import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";
// Check DLC Updates
// Checks if there are updates available for the user's DLC content.
//
// Compatibility:
// - Supports both legacy and package-based DLC license schemas.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function semverCompare(a: string | null | undefined, b: string | null | undefined): number {
  const pa = String(a || "")
    .split(".")
    .map(x => Number(x));
  const pb = String(b || "")
    .split(".")
    .map(x => Number(x));
  for (let i = 0; i < 3; i++) {
    const av = Number.isFinite(pa[i]) ? pa[i] : 0;
    const bv = Number.isFinite(pb[i]) ? pb[i] : 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rateLimitResponse = await applyRateLimit({
    req,
    endpoint: "check-dlc-updates",
    ...DEFAULT_EDGE_RATE_LIMIT,
    headers: corsHeaders,
  });
  if (rateLimitResponse) return rateLimitResponse;

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");

    const { data: userRes, error: authError } = await supabaseClient.auth.getUser(token);
    const user = userRes?.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { currentVersion, userId: bodyUserId, packageId } = await req.json();
    if (bodyUserId && String(bodyUserId) !== user.id) {
      return new Response(JSON.stringify({ error: "User mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user has active DLC license(s)
    let licenseQuery = supabaseClient
      .from("dlc_licenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (packageId) {
      licenseQuery = licenseQuery.eq("package_id", packageId);
    }

    const { data: licenses, error: licenseError } = await licenseQuery;

    if (licenseError || !licenses || licenses.length === 0) {
      return new Response(JSON.stringify({ hasUpdate: false, error: "No active DLC license" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get latest content package
    const { data: latestPackage, error: packageError } = await supabaseClient
      .from("dlc_content_packages")
      .select("*")
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (packageError || !latestPackage) {
      return new Response(JSON.stringify({ hasUpdate: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compare versions (semver)
    const now = new Date();
    const activeLicenses = (licenses as any[]).filter(l => {
      if (l.refunded_at || l.deactivated_at) return false;
      const exp = l.expiration_date ?? l.subscription_end ?? null;
      if (!exp) return true;
      return new Date(exp) >= now;
    });

    if (activeLicenses.length === 0) {
      return new Response(JSON.stringify({ hasUpdate: false, error: "No active DLC license" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstLicense: any = activeLicenses[0];
    const userVersion =
      currentVersion || firstLicense.content_version || firstLicense.contentVersion || null;
    const hasUpdate = semverCompare(latestPackage.version, userVersion) !== 0;

    if (!hasUpdate) {
      return new Response(JSON.stringify({ hasUpdate: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return update information
    return new Response(
      JSON.stringify({
        hasUpdate: true,
        package: {
          version: latestPackage.version,
          downloadUrl: latestPackage.download_url,
          checksum: latestPackage.checksum,
          size: latestPackage.size_bytes,
          releaseDate: latestPackage.release_date,
          changelog: latestPackage.changelog || [],
        },
        currentVersion: userVersion,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error checking DLC updates:", error);
    return new Response(JSON.stringify({ hasUpdate: false, error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
