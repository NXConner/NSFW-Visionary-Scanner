import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPER_ADMIN_EMAIL = "n8ter8@gmail.com";

type ReqBody = {
  packageId: string;
  assetPath: string; // storage path within bucket
};

function isSafeAssetPath(packageId: string, assetPath: string): boolean {
  if (!assetPath) return false;
  if (assetPath.includes("..") || assetPath.startsWith("/") || assetPath.includes("\\"))
    return false;
  if (!assetPath.startsWith(`${packageId}/`)) return false;
  return true;
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
      endpoint: "get-dlc-signed-upload-url",
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
    const packageId = String(body.packageId || "");
    const assetPath = String(body.assetPath || "");

    if (!packageId || !assetPath) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
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

    if (!isSafeAssetPath(packageId, assetPath)) {
      return new Response(JSON.stringify({ error: "Invalid asset path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bucket = Deno.env.get("NSFW_CONTENT_BUCKET") ?? "nsfw-content";

    // Note: Supabase Storage signed upload requires client to call uploadToSignedUrl(path, token, file).
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(assetPath);
    if (error) throw error;

    return new Response(
      JSON.stringify({
        bucket,
        path: assetPath,
        signedUrl: data.signedUrl,
        token: data.token,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("get-dlc-signed-upload-url error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
