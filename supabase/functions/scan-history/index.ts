import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReqBody = { limit?: number };

function toInt(n: unknown, def: number): number {
  const x = typeof n === "number" ? n : Number.parseInt(String(n ?? ""), 10);
  return Number.isFinite(x) ? x : def;
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
    endpoint: "scan-history",
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

    const body = (await req.json().catch(() => ({}))) as ReqBody;
    const limit = Math.max(1, Math.min(100, toInt(body.limit, 25)));

    const { data: scans, error } = await supabase
      .from("scans")
      .select(
        "id, scanned_at, scan_type, length, girth, curvature_angle, curvature_direction, confidence_level, overall_health, has_image, analysis_result",
      )
      .eq("user_id", user.id)
      .order("scanned_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const out = [];
    for (const row of scans ?? []) {
      const analysis = (row as any).analysis_result as any;
      const image = analysis?.image;
      const bucket = String(image?.bucket || "scans");
      const path = typeof image?.path === "string" ? image.path : null;
      let image_signed_url: string | null = null;

      if (path) {
        const { data: signed, error: signedErr } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, 60 * 10);
        if (!signedErr) image_signed_url = signed?.signedUrl ?? null;
      }

      out.push({
        id: (row as any).id,
        scanned_at: (row as any).scanned_at,
        scan_type: (row as any).scan_type,
        length: (row as any).length,
        girth: (row as any).girth,
        curvature_angle: (row as any).curvature_angle,
        curvature_direction: (row as any).curvature_direction,
        confidence_level: (row as any).confidence_level,
        overall_health: (row as any).overall_health,
        has_image: (row as any).has_image,
        image_signed_url,
      });
    }

    return new Response(JSON.stringify({ scans: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("scan-history error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

