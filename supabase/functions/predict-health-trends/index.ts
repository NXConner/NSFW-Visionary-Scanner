/**
 * Supabase Edge Function: Predict Health Trends
 * Generates simple time-series forecasts from existing metrics
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function nowIso() {
  return new Date().toISOString();
}

function expiresIn(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !serviceKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(url, serviceKey);
    const { user_id, timeframe = "6_months" } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tf = timeframe as "1_month" | "3_months" | "6_months" | "1_year";

    // Check cache
    const { data: cached } = await supabaseAdmin
      .from("health_prediction_cache")
      .select("*")
      .eq("user_id", user_id)
      .eq("timeframe", tf)
      .gt("expires_at", nowIso())
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({
          predictions: cached.prediction_data?.predictions ?? cached.prediction_data,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const horizonDays =
      tf === "1_month" ? 30 : tf === "3_months" ? 90 : tf === "6_months" ? 180 : 365;

    // Pull recent data
    const [wellness, urinary] = await Promise.all([
      supabaseAdmin
        .from("sexual_wellness_scores")
        .select("entry_date, overall_score")
        .eq("user_id", user_id)
        .order("entry_date", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("urinary_health")
        .select("entry_date, urgency_level, nocturia_count")
        .eq("user_id", user_id)
        .order("entry_date", { ascending: false })
        .limit(30),
    ]);

    const w = wellness.data ?? [];
    const u = urinary.data ?? [];

    const latestW = w[0]?.overall_score != null ? Number(w[0].overall_score) : 50;
    const avgW = w.length
      ? w.reduce((s: number, r: any) => s + Number(r.overall_score ?? 0), 0) / w.length
      : latestW;
    const slopeW = clamp((latestW - avgW) / Math.max(1, w.length), -2, 2);

    const latestUrg = u[0]?.urgency_level != null ? Number(u[0].urgency_level) : 0;
    const avgUrg = u.length
      ? u.reduce((s: number, r: any) => s + Number(r.urgency_level ?? 0), 0) / u.length
      : latestUrg;
    const slopeUrg = clamp((avgUrg - latestUrg) / Math.max(1, u.length), -0.5, 0.5);

    const predictions = [
      {
        metric: "wellness_overall_score",
        current_value: Math.round(latestW),
        predicted_value: Math.round(clamp(latestW + slopeW * (horizonDays / 30), 0, 100)),
        timeframe: tf,
        confidence: 0.55,
        factors: ["recent trend vs average", "consistency of tracking"],
      },
      {
        metric: "urinary_urgency_level",
        current_value: Number(latestUrg.toFixed(1)),
        predicted_value: Number(clamp(latestUrg + slopeUrg * (horizonDays / 30), 0, 10).toFixed(1)),
        timeframe: tf,
        confidence: 0.5,
        factors: ["recent urinary entries", "variability across days"],
      },
    ];

    // Cache results
    const prediction_data = { predictions };
    await supabaseAdmin.from("health_prediction_cache").insert({
      user_id,
      timeframe: tf,
      prediction_data,
      generated_at: nowIso(),
      expires_at: expiresIn(12),
      created_at: nowIso(),
    });

    return new Response(JSON.stringify({ predictions }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
