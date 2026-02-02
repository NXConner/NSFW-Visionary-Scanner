// Get DLC Content Package
// Returns download information for DLC content packages.
//
// Compatibility:
// - Supports both historical DLC schemas:
//   - package-based licenses (dlc_packages + dlc_licenses.package_id)
//   - legacy licenses (dlc_licenses content_version/expiration_date)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADULT_RATINGS = new Set(["18+", "adult", "explicit", "nsfw"]);

const isAdultRating = (rating?: string | null): boolean =>
  ADULT_RATINGS.has(String(rating || "").trim().toLowerCase());

serve(async req => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRows } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (roleRows || []).map((r: any) => String(r.role || ""));
    const hasNsfwAccess =
      roles.includes("nsfw_access") || roles.includes("admin") || roles.includes("super_admin");

    // Optional packageId request (if client wants a specific package)
    let requestedPackageId: string | null = null;
    try {
      const body = await req.json().catch(() => null);
      requestedPackageId = body?.packageId ?? body?.package_id ?? null;
    } catch {
      // ignore
    }

    // Load active licenses (users can own multiple)
    let licensesQuery = supabaseClient
      .from("dlc_licenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (requestedPackageId) {
      licensesQuery = licensesQuery.eq("package_id", requestedPackageId);
    }

    const { data: licenses, error: licensesError } = await licensesQuery;

    if (licensesError || !licenses || licenses.length === 0) {
      return new Response(JSON.stringify({ error: "No active DLC license found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter out expired licenses (support expiration_date and subscription_end)
    const now = new Date();
    const activeLicenses = licenses.filter((l: any) => {
      if (l.refunded_at || l.deactivated_at) return false;
      const exp = l.expiration_date ?? l.subscription_end ?? null;
      if (!exp) return true;
      return new Date(exp) >= now;
    });

    if (activeLicenses.length === 0) {
      return new Response(JSON.stringify({ error: "DLC license has expired" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const packageIds = activeLicenses
      .map((l: any) => String(l.package_id || "").trim())
      .filter(Boolean);

    let requiresAdultEntitlement = false;
    if (requestedPackageId) {
      const { data: pkgRow, error: pkgError } = await supabaseClient
        .from("dlc_packages")
        .select("package_id, content_rating, is_active")
        .eq("package_id", requestedPackageId)
        .maybeSingle();
      if (pkgError) throw pkgError;
      if (!pkgRow || pkgRow.is_active === false) {
        return new Response(JSON.stringify({ error: "Package not available" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      requiresAdultEntitlement = isAdultRating(pkgRow.content_rating);
    } else if (packageIds.length > 0) {
      const { data: pkgRows, error: pkgError } = await supabaseClient
        .from("dlc_packages")
        .select("package_id, content_rating, is_active")
        .in("package_id", packageIds);
      if (pkgError) throw pkgError;
      requiresAdultEntitlement = (pkgRows || []).some(row => isAdultRating(row.content_rating));
    }

    if (requiresAdultEntitlement && !hasNsfwAccess) {
      return new Response(JSON.stringify({ error: "NSFW entitlement required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (requiresAdultEntitlement) {
      const { data: age, error: ageError } = await supabaseClient
        .from("dlc_age_verifications")
        .select("is_verified, adult_content_consent, terms_accepted")
        .eq("user_id", user.id)
        .maybeSingle();
      if (ageError) throw ageError;
      const okAge = Boolean(age?.is_verified && age?.adult_content_consent && age?.terms_accepted);
      if (!okAge) {
        return new Response(JSON.stringify({ error: "Age verification required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get latest content package (global)
    const { data: contentPackage, error: packageError } = await supabaseClient
      .from("dlc_content_packages")
      .select("*")
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (packageError || !contentPackage) {
      return new Response(JSON.stringify({ error: "No content package available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine user's current content version (prefer explicit license.content_version; fallback to license.content_version-like fields)
    const firstLicense: any = activeLicenses[0];
    const userContentVersion =
      firstLicense.content_version ??
      firstLicense.contentVersion ??
      firstLicense.content_version ??
      null;

    // Return content package information
    return new Response(
      JSON.stringify({
        package: {
          version: contentPackage.version,
          downloadUrl: contentPackage.download_url,
          checksum: contentPackage.checksum,
          size: contentPackage.size_bytes,
          releaseDate: contentPackage.release_date,
          changelog: contentPackage.changelog || [],
        },
        licenses: activeLicenses.map((l: any) => ({
          id: l.id,
          packageId: l.package_id ?? null,
          licenseKey: l.license_key,
          contentVersion: l.content_version ?? null,
          expirationDate: l.expiration_date ?? l.subscription_end ?? null,
          isActive: l.is_active === true,
        })),
        license: {
          version: userContentVersion,
          hasUpdate: userContentVersion ? contentPackage.version !== userContentVersion : true,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error getting DLC content:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
