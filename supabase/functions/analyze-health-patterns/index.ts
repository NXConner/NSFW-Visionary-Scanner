import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";
/**
 * Supabase Edge Function: Analyze Health Patterns
 * Uses AI to identify patterns in user's health data
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

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rateLimitResponse = await applyRateLimit({
    req,
    endpoint: "analyze-health-patterns",
    ...DEFAULT_EDGE_RATE_LIMIT,
    headers: corsHeaders,
  });
  if (rateLimitResponse) return rateLimitResponse;

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
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cache first
    const { data: cached } = await supabaseAdmin
      .from("health_pattern_cache")
      .select("*")
      .eq("user_id", user_id)
      .gt("expires_at", nowIso())
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({ patterns: cached.pattern_data?.patterns ?? cached.pattern_data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get health data
    const [wellness, urinary] = await Promise.all([
      supabaseAdmin
        .from("sexual_wellness_scores")
        .select("entry_date, overall_score, physical_score, emotional_score")
        .eq("user_id", user_id)
        .order("entry_date", { ascending: false })
        .limit(30),
      supabaseAdmin
        .from("urinary_health")
        .select("entry_date, urgency_level, nocturia_count, pain_on_urination, blood_in_urine")
        .eq("user_id", user_id)
        .order("entry_date", { ascending: false })
        .limit(30),
    ]);

    const w = wellness.data ?? [];
    const u = urinary.data ?? [];

    // Calculate patterns locally (no AI call needed for basic patterns)
    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);
    const wScores = w.map((x: any) => Number(x.overall_score ?? 0)).filter(n => Number.isFinite(n));
    const wAvg = avg(wScores);
    const uUrg = avg(
      u.map((x: any) => Number(x.urgency_level ?? 0)).filter(n => Number.isFinite(n)),
    );
    const uNoct = avg(
      u.map((x: any) => Number(x.nocturia_count ?? 0)).filter(n => Number.isFinite(n)),
    );
    const anyBlood = u.some((x: any) => Boolean(x.blood_in_urine));

    const patterns: any[] = [];
    if (w.length >= 5) {
      patterns.push({
        pattern_type: "wellness_average",
        description: `Your average wellness score over the last ${w.length} entries is ${Math.round(wAvg)}.`,
        confidence: 0.65,
        affected_metrics: ["sexual_wellness_scores.overall_score"],
        timeframe: "last_30_days",
        recommendation:
          wAvg < 50
            ? "Focus on recovery, sleep quality, and reduce intensity during low-score days."
            : "Keep consistency; small improvements compound over time.",
      });
    }
    if (u.length >= 5) {
      patterns.push({
        pattern_type: "urinary_baseline",
        description: `Average urinary urgency is ${uUrg.toFixed(1)} and nocturia is ${uNoct.toFixed(1)} over the last ${u.length} entries.`,
        confidence: 0.6,
        affected_metrics: ["urinary_health.urgency_level", "urinary_health.nocturia_count"],
        timeframe: "last_30_days",
        recommendation: anyBlood
          ? "Blood in urine warrants prompt medical evaluation."
          : "Track hydration and note triggers (caffeine, late fluids) to reduce nocturia.",
      });
    }

    // Cache results
    const pattern_data = { patterns };
    await supabaseAdmin.from("health_pattern_cache").insert({
      user_id,
      pattern_data,
      analyzed_at: nowIso(),
      expires_at: expiresIn(12),
      created_at: nowIso(),
    });

    return new Response(JSON.stringify({ patterns }), {
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
