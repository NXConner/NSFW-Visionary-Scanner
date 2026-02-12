import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReqBody = {
  api_key?: string;
  api_secret?: string;
};

function decodeB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function encodeB64(bytes: ArrayBuffer | Uint8Array): string {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  // btoa expects a binary string; chunk to avoid call stack limits.
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < b.length; i += chunk) {
    s += String.fromCharCode(...b.subarray(i, i + chunk));
  }
  return btoa(s);
}

function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

async function sha256Bytes(input: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return new Uint8Array(buf);
}

async function importAesGcmEncryptKey(): Promise<CryptoKey> {
  // Prefer an explicit key. Otherwise reuse DLC master key. Final fallback: hash the service role key.
  const explicit = (Deno.env.get("CREDENTIALS_ENCRYPTION_KEY_B64") ?? "").trim();
  const dlcMaster = (Deno.env.get("DLC_KEYRING_MASTER_KEY_B64") ?? "").trim();

  let keyBytes: Uint8Array | null = null;
  if (explicit) {
    const decoded = decodeB64(explicit);
    if (decoded.byteLength < 32) throw new Error("CREDENTIALS_ENCRYPTION_KEY_B64 must be >= 32 bytes base64");
    keyBytes = decoded.slice(0, 32);
  } else if (dlcMaster) {
    const decoded = decodeB64(dlcMaster);
    if (decoded.byteLength < 32) throw new Error("DLC_KEYRING_MASTER_KEY_B64 must be >= 32 bytes base64");
    keyBytes = decoded.slice(0, 32);
  } else {
    const serviceRoleKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
    if (!serviceRoleKey) throw new Error("Supabase not configured");
    keyBytes = (await sha256Bytes(serviceRoleKey)).slice(0, 32);
  }

  return await crypto.subtle.importKey("raw", toArrayBuffer(keyBytes), { name: "AES-GCM" }, false, [
    "encrypt",
  ]);
}

async function encryptText(params: { key: CryptoKey; plaintext: string }): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const pt = new TextEncoder().encode(params.plaintext);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, params.key, pt);
  // v1:<ivB64>:<ctB64>
  return `v1:${encodeB64(iv)}:${encodeB64(ct)}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const rateLimitResponse = await applyRateLimit({
      req,
      endpoint: "encrypt-credentials",
      userId: user.id,
      ...DEFAULT_EDGE_RATE_LIMIT,
      headers: corsHeaders,
    });
    if (rateLimitResponse) return rateLimitResponse;

    let body: ReqBody;
    try {
      body = (await req.json()) as ReqBody;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = String(body.api_key ?? "").trim();
    const apiSecret = String(body.api_secret ?? "").trim();

    if (!apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: "Missing api_key or api_secret" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (apiKey.length > 4096 || apiSecret.length > 4096) {
      return new Response(JSON.stringify({ error: "Credentials too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = await importAesGcmEncryptKey();
    const api_key_encrypted = await encryptText({ key, plaintext: apiKey });
    const api_secret_encrypted = await encryptText({ key, plaintext: apiSecret });

    return new Response(JSON.stringify({ api_key_encrypted, api_secret_encrypted, version: 1 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // Do not log request bodies; credentials may be present.
    console.error("encrypt-credentials error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

