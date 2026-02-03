import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = {
  imageDataUrl: string;
  clientScanId?: string;
};

function parseDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } {
  const m = String(dataUrl || "").match(/^data:([^;]+);base64,(.*)$/);
  if (!m) throw new Error("Invalid data URL");
  const mime = m[1]!;
  const b64 = m[2]!;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { mime, bytes };
}

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
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
    endpoint: "scan-upload",
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
    const imageDataUrl = String(body.imageDataUrl || "");
    if (!imageDataUrl) {
      return new Response(JSON.stringify({ error: "Missing imageDataUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { mime, bytes } = parseDataUrl(imageDataUrl);
    if (!mime.startsWith("image/")) throw new Error("Only image uploads are supported");
    if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("Image too large (max 10MB)");

    const bucket = "scans";
    const ext = extForMime(mime);
    const ts = new Date().toISOString().replaceAll(":", "-");
    const suffix = crypto.randomUUID();
    const baseName = body.clientScanId ? `${body.clientScanId}-${suffix}` : suffix;
    const objectPath = `${user.id}/${ts}/${baseName}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
      contentType: mime,
      upsert: false,
    });
    if (uploadErr) throw uploadErr;

    const { data: signed, error: signedErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(objectPath, 60 * 15);
    if (signedErr) throw signedErr;

    return new Response(
      JSON.stringify({
        bucket,
        objectPath,
        signedUrl: signed.signedUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("scan-upload error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

