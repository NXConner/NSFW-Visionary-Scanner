import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReqBody = {
  file_path: string;
  total_chunks: number;
  bucket: string;
  content_type?: string;
};

function isSafePath(path: string): boolean {
  if (!path) return false;
  if (path.startsWith("/")) return false;
  if (path.includes("..")) return false;
  // disallow backslashes (windows paths)
  if (path.includes("\\")) return false;
  return true;
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rateLimitResponse = await applyRateLimit({
    req,
    endpoint: "merge-video-chunks",
    ...DEFAULT_EDGE_RATE_LIMIT,
    headers: corsHeaders,
  });
  if (rateLimitResponse) return rateLimitResponse;

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

    const body = (await req.json()) as ReqBody;
    const filePath = String(body.file_path || "");
    const totalChunks = Number(body.total_chunks);
    const bucket = String(body.bucket || "");
    const contentType = body.content_type ? String(body.content_type) : "video/mp4";

    if (
      !filePath ||
      !bucket ||
      !Number.isFinite(totalChunks) ||
      totalChunks < 1 ||
      totalChunks > 5000
    ) {
      return new Response(JSON.stringify({ error: "Missing/invalid required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isSafePath(filePath)) {
      return new Response(JSON.stringify({ error: "Invalid file_path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Best-practice safety: require file namespace under user id
    // Example: "<userId>/recordings/xyz.mp4"
    if (!filePath.startsWith(`${user.id}/`)) {
      return new Response(JSON.stringify({ error: "Invalid file_path namespace" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download all chunks
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = `${filePath}.chunk.${i}`;
      const { data, error } = await supabase.storage.from(bucket).download(chunkPath);
      if (error || !data) {
        return new Response(
          JSON.stringify({
            error: `Failed to download chunk ${i}: ${error?.message ?? "unknown"}`,
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const arrayBuffer = await data.arrayBuffer();
      chunks.push(new Uint8Array(arrayBuffer));
    }

    // Merge chunks
    const totalSize = chunks.reduce((sum, c) => sum + c.length, 0);
    const merged = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    // Upload merged file
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, merged, {
      cacheControl: "3600",
      upsert: true,
      contentType,
    });
    if (uploadError) {
      return new Response(
        JSON.stringify({ error: `Failed to upload merged file: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Delete chunks (best-effort)
    const chunkPaths = Array.from({ length: totalChunks }, (_, i) => `${filePath}.chunk.${i}`);
    await supabase.storage.from(bucket).remove(chunkPaths);

    return new Response(JSON.stringify({ success: true, path: filePath, bytes: totalSize }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("merge-video-chunks error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
