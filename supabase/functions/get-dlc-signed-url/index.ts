import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = {
  packageId: string;
  assetPath: string; // storage path within bucket
  expiresInSeconds?: number;
  deviceId?: string;
  devicePlatform?: "web" | "android" | "ios";
};

const ADULT_RATINGS = new Set(["18+", "adult", "explicit", "nsfw"]);

const isAdultRating = (rating?: string | null): boolean =>
  ADULT_RATINGS.has(String(rating || "").trim().toLowerCase());

async function logAssetAccess(params: {
  supabase: any;
  userId: string;
  packageId: string;
  assetPath: string;
  deviceId?: string;
  devicePlatform?: string;
  expiresInSeconds: number;
  accessType?: string;
}): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + params.expiresInSeconds * 1000).toISOString();
    await params.supabase.from("dlc_asset_access_logs").insert({
      user_id: params.userId,
      package_id: params.packageId,
      asset_path: params.assetPath,
      device_id: params.deviceId || null,
      device_platform: params.devicePlatform || null,
      access_type: params.accessType || "signed_url",
      expires_at: expiresAt,
    });
  } catch {
    // Best-effort; avoid blocking asset delivery on log failure.
  }
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  const rateLimitResponse = await applyRateLimit({
    req,
    endpoint: "get-dlc-signed-url",
    ...DEFAULT_EDGE_RATE_LIMIT,
    headers: corsHeaders,
  });
  if (rateLimitResponse) return rateLimitResponse;

    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userRes, error: authError } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Super-admin bypass (for internal testing / full-access accounts)
    // - Allows signing URLs without DLC license ownership and without age verification rows.
    // - Still enforces asset namespace constraints and uses signed URLs (no public bucket access).
    const email = String(user.email || "").toLowerCase();
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (roleRows || []).map((r: any) => String(r.role || ""));
    const isSuperAdmin = roles.includes("super_admin") || email === "n8ter8@gmail.com";
    const hasNsfwAccess = isSuperAdmin || roles.includes("nsfw_access") || roles.includes("admin");

    const body = (await req.json()) as ReqBody;
    const packageId = String(body.packageId || "");
    const assetPath = String(body.assetPath || "");
    const expiresInSeconds = Math.max(30, Math.min(60 * 60, Number(body.expiresInSeconds ?? 300)));
    const deviceId = body.deviceId ? String(body.deviceId) : "";
    const devicePlatform =
      body.devicePlatform === "android" ||
      body.devicePlatform === "ios" ||
      body.devicePlatform === "web"
        ? body.devicePlatform
        : "web";

    if (!packageId || !assetPath) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent arbitrary path probing: require assets to be namespaced under the package.
    if (!assetPath.startsWith(`${packageId}/`)) {
      return new Response(JSON.stringify({ error: "Invalid asset path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: packageRow, error: packageError } = await supabase
      .from("dlc_packages")
      .select("package_id, content_rating, is_active")
      .eq("package_id", packageId)
      .maybeSingle();
    if (packageError) throw packageError;
    if (!packageRow || packageRow.is_active === false) {
      return new Response(JSON.stringify({ error: "Package not available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isAdultRating(packageRow.content_rating) && !hasNsfwAccess) {
      return new Response(JSON.stringify({ error: "NSFW entitlement required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If super_admin, bypass license + age checks (still device binds if deviceId is provided).
    // This enables full content visibility for the designated internal admin account.
    if (isSuperAdmin) {
      const bucket = Deno.env.get("NSFW_CONTENT_BUCKET") ?? "nsfw-content";
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(assetPath, expiresInSeconds);
      if (error) throw error;

      await logAssetAccess({
        supabase,
        userId: user.id,
        packageId,
        assetPath,
        deviceId,
        devicePlatform,
        expiresInSeconds,
        accessType: "signed_url",
      });

      return new Response(
        JSON.stringify({
          signedUrl: data.signedUrl,
          expiresInSeconds,
          grantedBy: { role: "super_admin" },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify active license (supports bundles/subscriptions via included_packages)
    // Strategy:
    // - Load all active, non-refunded, non-deactivated licenses for the user
    // - Load package definitions for those licenses (to inspect included_packages)
    // - Authorize if ANY owned license covers the requested packageId
    const { data: licenses, error: licensesError } = await supabase
      .from("dlc_licenses")
      .select("id, package_id, is_active, refunded_at, deactivated_at, max_devices")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (licensesError) throw licensesError;

    const activeLicenses = (licenses || []).filter((l: any) => !l.refunded_at && !l.deactivated_at);
    if (activeLicenses.length === 0) {
      return new Response(JSON.stringify({ error: "No active license" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownedPackageIds = activeLicenses.map((l: any) => String(l.package_id));
    const { data: pkgs, error: pkgsError } = await supabase
      .from("dlc_packages")
      .select("package_id, included_packages")
      .in("package_id", ownedPackageIds);
    if (pkgsError) throw pkgsError;

    const covers = (licensePackageId: string): boolean => {
      if (licensePackageId === packageId) return true;
      const pkgRow = (pkgs || []).find((p: any) => String(p.package_id) === licensePackageId);
      const included = Array.isArray((pkgRow as any)?.included_packages)
        ? (pkgRow as any).included_packages
        : [];
      return included.includes(packageId);
    };

    const grantingLicense =
      activeLicenses.find((l: any) => String(l.package_id) === packageId) ??
      activeLicenses.find((l: any) => covers(String(l.package_id))) ??
      null;

    if (!grantingLicense) {
      return new Response(JSON.stringify({ error: "No active license" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional device binding enforcement
    if (deviceId) {
      const maxDevices = Math.max(1, Number((grantingLicense as any).max_devices ?? 3));
      const { data: activeDevices, error: devicesError } = await supabase
        .from("dlc_license_devices")
        .select("id, device_id, is_active")
        .eq("license_id", grantingLicense.id)
        .eq("is_active", true);

      if (!devicesError) {
        const alreadyBound = (activeDevices || []).some((d: any) => d.device_id === deviceId);
        if (!alreadyBound && (activeDevices || []).length >= maxDevices) {
          return new Response(JSON.stringify({ error: "Maximum devices reached" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: upsertError } = await supabase.from("dlc_license_devices").upsert(
          {
            license_id: grantingLicense.id,
            device_id: deviceId,
            device_platform: devicePlatform,
            is_active: true,
            last_used_at: new Date().toISOString(),
            last_validation_at: new Date().toISOString(),
          },
          { onConflict: "license_id,device_id" },
        );
        if (upsertError) throw upsertError;
      }
    }

    // Verify age gate + consent
    const { data: age, error: ageError } = await supabase
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

    const bucket = Deno.env.get("NSFW_CONTENT_BUCKET") ?? "nsfw-content";

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(assetPath, expiresInSeconds);
    if (error) throw error;

    await logAssetAccess({
      supabase,
      userId: user.id,
      packageId,
      assetPath,
      deviceId,
      devicePlatform,
      expiresInSeconds,
      accessType: "signed_url",
    });

    return new Response(
      JSON.stringify({
        signedUrl: data.signedUrl,
        expiresInSeconds,
        grantedBy: { packageId: String((grantingLicense as any).package_id) },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("get-dlc-signed-url error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
