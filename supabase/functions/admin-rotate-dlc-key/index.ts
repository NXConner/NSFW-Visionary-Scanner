import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPER_ADMIN_EMAIL = "n8ter8@gmail.com";

type ReqBody = { packageId: string };

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
    "encrypt",
  ]);
}

async function encryptKey(params: {
  plaintextKeyB64: string;
  master: CryptoKey;
}): Promise<{ ctB64: string; ivB64: string }> {
  const keyBytes = decodeB64(params.plaintextKeyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    params.master,
    toArrayBuffer(keyBytes),
  );
  return { ctB64: encodeB64(ct), ivB64: encodeB64(iv) };
}

async function isAdminUser(supabase: any, userId: string, email?: string | null): Promise<boolean> {
  if (email && email.toLowerCase().trim() === SUPER_ADMIN_EMAIL) return true;
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) return false;
  return (data || []).some((r: any) => r.role === "admin" || r.role === "super_admin");
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
      endpoint: "admin-rotate-dlc-key",
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

    const okAdmin = await isAdminUser(supabase, user.id, user.email);
    if (!okAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;
    const packageId = String(body.packageId || "").trim();
    if (!packageId) {
      return new Response(JSON.stringify({ error: "Missing packageId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate new 32-byte key
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    const plaintextKeyB64 = encodeB64(rawKey);

    const master = await importMasterKey();
    const { ctB64, ivB64 } = await encryptKey({ plaintextKeyB64, master });

    // Determine next version
    const { data: existing } = await supabase
      .from("dlc_package_keyring")
      .select("key_version")
      .eq("package_id", packageId)
      .order("key_version", { ascending: false })
      .limit(1);

    const nextVersion = (existing?.[0]?.key_version ? Number(existing[0].key_version) : 0) + 1;
    const now = new Date().toISOString();

    // Deactivate previous active keys
    await supabase
      .from("dlc_package_keyring")
      .update({ is_active: false, rotated_at: now })
      .eq("package_id", packageId)
      .eq("is_active", true);

    const { data: inserted, error: insErr } = await supabase
      .from("dlc_package_keyring")
      .insert({
        package_id: packageId,
        key_version: nextVersion,
        key_ciphertext: ctB64,
        key_iv: ivB64,
        is_active: true,
        created_at: now,
      })
      .select("id, key_version")
      .maybeSingle();

    if (insErr || !inserted?.id) throw new Error(insErr?.message || "Insert failed");

    // Also update dlc_packages.encryption_key_id for visibility (best-effort)
    try {
      await supabase
        .from("dlc_packages")
        .update({ encryption_key_id: String(inserted.id), updated_at: now })
        .eq("package_id", packageId);
    } catch {
      // ignore
    }

    return new Response(
      JSON.stringify({
        ok: true,
        packageId,
        keyId: String(inserted.id),
        keyVersion: Number(inserted.key_version),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("admin-rotate-dlc-key error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
