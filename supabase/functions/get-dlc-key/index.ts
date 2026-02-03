import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = {
  packageId: string;
  deviceId?: string;
  devicePlatform?: "web" | "android" | "ios";
};

function decodeB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function encodeB64(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]!);
  return btoa(s);
}

function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

async function importMasterKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("DLC_KEYRING_MASTER_KEY_B64") ?? "";
  if (!raw) throw new Error("Missing DLC_KEYRING_MASTER_KEY_B64");
  const bytes = decodeB64(raw);
  if (bytes.byteLength !== 32)
    throw new Error("DLC_KEYRING_MASTER_KEY_B64 must be 32 bytes base64");
  return await crypto.subtle.importKey("raw", toArrayBuffer(bytes), { name: "AES-GCM" }, false, [
    "decrypt",
  ]);
}

async function decryptKey(params: {
  keyCiphertext: string;
  ivB64: string;
  master: CryptoKey;
}): Promise<string> {
  const iv = decodeB64(params.ivB64);
  const ct = decodeB64(params.keyCiphertext);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    params.master,
    toArrayBuffer(ct),
  );
  // plaintext is raw key bytes; return base64
  return encodeB64(pt);
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
    endpoint: "get-dlc-key",
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

    const body = (await req.json()) as ReqBody;
    const packageId = String(body.packageId || "").trim();
    const deviceId = body.deviceId ? String(body.deviceId) : "";
    const devicePlatform =
      body.devicePlatform === "android" ||
      body.devicePlatform === "ios" ||
      body.devicePlatform === "web"
        ? body.devicePlatform
        : "web";

    if (!packageId) {
      return new Response(JSON.stringify({ error: "Missing packageId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Age gate
    const { data: age } = await supabase
      .from("dlc_age_verifications")
      .select("is_verified, adult_content_consent, terms_accepted")
      .eq("user_id", user.id)
      .maybeSingle();
    const okAge = Boolean(age?.is_verified && age?.adult_content_consent && age?.terms_accepted);
    if (!okAge) {
      return new Response(JSON.stringify({ error: "Age verification required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // License gate (active + not refunded/deactivated). Support bundles via included_packages.
    const { data: licenses } = await supabase
      .from("dlc_licenses")
      .select("id, package_id, is_active, refunded_at, deactivated_at, max_devices")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const activeLicenses = (licenses || []).filter((l: any) => !l.refunded_at && !l.deactivated_at);
    if (activeLicenses.length === 0) {
      return new Response(JSON.stringify({ error: "No active license" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ownedPackageIds = activeLicenses.map((l: any) => String(l.package_id));
    const { data: pkgs } = await supabase
      .from("dlc_packages")
      .select("package_id, included_packages")
      .in("package_id", ownedPackageIds);

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

    // Optional device binding enforcement (align with signed URL function)
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

        await supabase.from("dlc_license_devices").upsert(
          {
            license_id: grantingLicense.id,
            user_id: user.id,
            device_id: deviceId,
            device_platform: devicePlatform,
            is_active: true,
            last_used_at: new Date().toISOString(),
            last_validation_at: new Date().toISOString(),
          },
          { onConflict: "license_id,device_id" },
        );
      }
    }

    // Load active key for package
    const { data: keyRow, error: keyErr } = await supabase
      .from("dlc_package_keyring")
      .select("id, key_version, key_ciphertext, key_iv")
      .eq("package_id", packageId)
      .eq("is_active", true)
      .order("key_version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (keyErr || !keyRow) {
      return new Response(JSON.stringify({ error: "Key not configured" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const master = await importMasterKey();
    const keyB64 = await decryptKey({
      keyCiphertext: String((keyRow as any).key_ciphertext),
      ivB64: String((keyRow as any).key_iv),
      master,
    });

    return new Response(
      JSON.stringify({
        packageId,
        keyId: String((keyRow as any).id),
        keyVersion: Number((keyRow as any).key_version),
        keyB64,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("get-dlc-key error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
