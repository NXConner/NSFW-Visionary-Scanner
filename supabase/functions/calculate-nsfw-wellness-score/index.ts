import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReqBody = {
  calculation_period_days?: number;
};

type FunctionRow = {
  entry_date: string;
  erectile_function_score: number | null;
  erection_quality: "none" | "partial" | "full" | "rigid" | null;
  erection_duration_minutes: number | null;
  erection_stability: number | null;
  stamina_minutes: number | null;
  control_level: number | null;
  activity_type: "solo" | "partner" | "both" | null;
  partner_present: boolean | null;
};

type LibidoRow = {
  entry_date: string;
  libido_level: number | null;
  desire_intensity: number | null;
};

type SatisfactionRow = {
  entry_date: string;
  overall_satisfaction: number | null;
  physical_satisfaction: number | null;
  emotional_satisfaction: number | null;
  partner_satisfaction: number | null;
  mutual_satisfaction: number | null;
};

type FrequencyRow = {
  tracking_period_start: string;
  tracking_period_end: string;
  period_type: "daily" | "weekly" | "monthly" | null;
  total_activity_count: number | null;
  average_per_week: number | null;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function toDateString(d: Date): string {
  // YYYY-MM-DD in UTC (lexicographically comparable for date columns).
  return d.toISOString().slice(0, 10);
}

function avg(values: Array<number | null | undefined>): number | null {
  const nums = values.filter(v => typeof v === "number" && Number.isFinite(v)) as number[];
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function weightedAverage(parts: Array<{ value: number | null; weight: number }>): number | null {
  const usable = parts.filter(
    p => typeof p.value === "number" && Number.isFinite(p.value),
  ) as Array<{
    value: number;
    weight: number;
  }>;
  if (usable.length === 0) return null;
  const totalW = usable.reduce((a, p) => a + p.weight, 0);
  if (totalW <= 0) return null;
  const sum = usable.reduce((a, p) => a + p.value * p.weight, 0);
  return sum / totalW;
}

function score10To100(v: number | null): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return clamp((v / 10) * 100, 0, 100);
}

function mapQuality(q: FunctionRow["erection_quality"]): number | null {
  if (!q) return null;
  switch (q) {
    case "none":
      return 0;
    case "partial":
      return 40;
    case "full":
      return 80;
    case "rigid":
      return 100;
    default:
      return null;
  }
}

function minutesToScore(v: number | null, targetMinutes: number): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
  return clamp((v / targetMinutes) * 100, 0, 100);
}

function splitByPeriod<T extends { entry_date: string }>(rows: T[], startCurrent: string) {
  const current: T[] = [];
  const previous: T[] = [];
  for (const r of rows) {
    if (String(r.entry_date) >= startCurrent) current.push(r);
    else previous.push(r);
  }
  return { current, previous };
}

function inferFrequencyPerWeek(params: {
  functionRowsCurrentCount: number;
  periodDays: number;
  frequencyRows: FrequencyRow[];
  startCurrent: string;
}): number {
  // Prefer explicit frequency rows if present in the current period.
  const candidates = params.frequencyRows.filter(
    r => String(r.tracking_period_end) >= params.startCurrent,
  );
  if (candidates.length > 0) {
    // Pick the most recent.
    const latest = candidates.sort((a, b) =>
      String(a.tracking_period_end) < String(b.tracking_period_end) ? 1 : -1,
    )[0]!;

    const avgPerWeek = typeof latest.average_per_week === "number" ? latest.average_per_week : null;
    if (avgPerWeek != null && Number.isFinite(avgPerWeek) && avgPerWeek >= 0) return avgPerWeek;

    const total =
      typeof latest.total_activity_count === "number" ? latest.total_activity_count : null;
    if (total != null && Number.isFinite(total) && total >= 0) {
      const pt = latest.period_type || "weekly";
      if (pt === "daily") return total * 7;
      if (pt === "weekly") return total;
      if (pt === "monthly") return (total / 30) * 7;
    }
  }

  // Fallback: infer from count of function rows (note: table is 1 row per date).
  const days = Math.max(1, params.periodDays);
  return (params.functionRowsCurrentCount / days) * 7;
}

function buildInsights(params: {
  overall: number;
  delta: number | null;
  functionScore: number | null;
  libidoScore: number | null;
  satisfactionScore: number | null;
  frequencyScore: number | null;
}): { insights: string[]; recommendations: string[] } {
  const insights: string[] = [];
  const recommendations: string[] = [];

  if (params.delta != null) {
    if (params.delta > 2) insights.push("Overall wellness is improving vs the prior period.");
    else if (params.delta < -2) insights.push("Overall wellness declined vs the prior period.");
    else insights.push("Overall wellness is stable vs the prior period.");
  }

  const low: Array<{ key: string; score: number | null }> = [
    { key: "function", score: params.functionScore },
    { key: "libido", score: params.libidoScore },
    { key: "satisfaction", score: params.satisfactionScore },
    { key: "frequency", score: params.frequencyScore },
  ];

  for (const s of low) {
    if (s.score == null) continue;
    if (s.score >= 55) continue;
    if (s.key === "function") {
      insights.push("Function metrics are lower than your recent baseline.");
      recommendations.push(
        "Prioritize sleep, hydration, and stress reduction; consider tracking context factors.",
      );
      recommendations.push(
        "If issues persist or cause distress, consider speaking with a licensed clinician.",
      );
    } else if (s.key === "libido") {
      insights.push("Libido metrics are lower than your recent baseline.");
      recommendations.push(
        "Review sleep, stress, and recovery; consider adjusting routines and reducing overtraining.",
      );
    } else if (s.key === "satisfaction") {
      insights.push("Satisfaction metrics are lower than your recent baseline.");
      recommendations.push(
        "Use a short check-in routine and note what improved comfort, communication, and pacing.",
      );
    } else if (s.key === "frequency") {
      insights.push("Activity frequency appears below your recent baseline.");
      recommendations.push(
        "Set a realistic weekly goal and track small consistency improvements over time.",
      );
    }
  }

  if (params.overall >= 80) {
    insights.push("Overall wellness is strong in this period.");
    recommendations.push("Keep your current habits consistent and monitor trends monthly.");
  }

  // Deduplicate while preserving order
  const uniq = <T>(arr: T[]): T[] => Array.from(new Map(arr.map(v => [String(v), v])).values());
  return {
    insights: uniq(insights).slice(0, 12),
    recommendations: uniq(recommendations).slice(0, 12),
  };
}

serve(async req => {
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
      endpoint: "calculate-nsfw-wellness-score",
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

    const periodDaysRaw = Number(body.calculation_period_days ?? 30);
    const periodDays = clamp(Number.isFinite(periodDaysRaw) ? periodDaysRaw : 30, 7, 365);

    const now = new Date();
    const startPrevDate = new Date(now.getTime());
    startPrevDate.setUTCDate(startPrevDate.getUTCDate() - periodDays * 2);
    const startCurrentDate = new Date(now.getTime());
    startCurrentDate.setUTCDate(startCurrentDate.getUTCDate() - periodDays);

    const startPrev = toDateString(startPrevDate);
    const startCurrent = toDateString(startCurrentDate);

    const [functionRes, libidoRes, satisfactionRes, frequencyRes] = await Promise.all([
      supabase
        .from("nsfw_sexual_function_tracking")
        .select(
          "entry_date, erectile_function_score, erection_quality, erection_duration_minutes, erection_stability, stamina_minutes, control_level, activity_type, partner_present",
        )
        .eq("user_id", user.id)
        .gte("entry_date", startPrev)
        .order("entry_date", { ascending: true }),
      supabase
        .from("nsfw_libido_tracking")
        .select("entry_date, libido_level, desire_intensity")
        .eq("user_id", user.id)
        .gte("entry_date", startPrev)
        .order("entry_date", { ascending: true }),
      supabase
        .from("nsfw_satisfaction_tracking")
        .select(
          "entry_date, overall_satisfaction, physical_satisfaction, emotional_satisfaction, partner_satisfaction, mutual_satisfaction",
        )
        .eq("user_id", user.id)
        .gte("entry_date", startPrev)
        .order("entry_date", { ascending: true }),
      supabase
        .from("nsfw_frequency_tracking")
        .select(
          "tracking_period_start, tracking_period_end, period_type, total_activity_count, average_per_week",
        )
        .eq("user_id", user.id)
        .gte("tracking_period_end", startPrev)
        .order("tracking_period_end", { ascending: true }),
    ]);

    if (functionRes.error) throw new Error(functionRes.error.message);
    if (libidoRes.error) throw new Error(libidoRes.error.message);
    if (satisfactionRes.error) throw new Error(satisfactionRes.error.message);
    if (frequencyRes.error) throw new Error(frequencyRes.error.message);

    const functionRows = (functionRes.data || []) as FunctionRow[];
    const libidoRows = (libidoRes.data || []) as LibidoRow[];
    const satisfactionRows = (satisfactionRes.data || []) as SatisfactionRow[];
    const frequencyRows = (frequencyRes.data || []) as FrequencyRow[];

    const fSplit = splitByPeriod(functionRows, startCurrent);
    const lSplit = splitByPeriod(libidoRows, startCurrent);
    const sSplit = splitByPeriod(satisfactionRows, startCurrent);

    const computeScores = (rows: {
      functionRows: FunctionRow[];
      libidoRows: LibidoRow[];
      satisfactionRows: SatisfactionRow[];
      frequencyRows: FrequencyRow[];
    }) => {
      const ef = score10To100(avg(rows.functionRows.map(r => r.erectile_function_score)));
      const stability = score10To100(avg(rows.functionRows.map(r => r.erection_stability)));
      const control = score10To100(avg(rows.functionRows.map(r => r.control_level)));
      const quality = avg(rows.functionRows.map(r => mapQuality(r.erection_quality)));
      const stamina = minutesToScore(avg(rows.functionRows.map(r => r.stamina_minutes)), 30);
      const duration = minutesToScore(
        avg(rows.functionRows.map(r => r.erection_duration_minutes)),
        30,
      );

      const functionScore = weightedAverage([
        { value: ef, weight: 0.35 },
        { value: quality, weight: 0.2 },
        { value: stability, weight: 0.15 },
        { value: control, weight: 0.1 },
        { value: stamina, weight: 0.1 },
        { value: duration, weight: 0.1 },
      ]);

      const libidoLevel = score10To100(avg(rows.libidoRows.map(r => r.libido_level)));
      const desireIntensity = score10To100(avg(rows.libidoRows.map(r => r.desire_intensity)));
      const libidoScore = weightedAverage([
        { value: libidoLevel, weight: 0.7 },
        { value: desireIntensity, weight: 0.3 },
      ]);

      const overallSat = score10To100(avg(rows.satisfactionRows.map(r => r.overall_satisfaction)));
      const physicalSat = score10To100(
        avg(rows.satisfactionRows.map(r => r.physical_satisfaction)),
      );
      const emotionalSat = score10To100(
        avg(rows.satisfactionRows.map(r => r.emotional_satisfaction)),
      );
      const satisfactionScore = weightedAverage([
        { value: overallSat, weight: 0.6 },
        { value: physicalSat, weight: 0.2 },
        { value: emotionalSat, weight: 0.2 },
      ]);

      const freqPerWeek = inferFrequencyPerWeek({
        functionRowsCurrentCount: rows.functionRows.length,
        periodDays,
        frequencyRows: rows.frequencyRows,
        startCurrent,
      });
      const frequencyScore = clamp((freqPerWeek / 2) * 100, 0, 100); // default target = 2/week

      const overall = weightedAverage([
        { value: functionScore, weight: 0.35 },
        { value: libidoScore, weight: 0.2 },
        { value: satisfactionScore, weight: 0.25 },
        { value: frequencyScore, weight: 0.2 },
      ]);

      return {
        overall: overall != null ? clamp(overall, 0, 100) : null,
        functionScore: functionScore != null ? clamp(functionScore, 0, 100) : null,
        libidoScore: libidoScore != null ? clamp(libidoScore, 0, 100) : null,
        satisfactionScore: satisfactionScore != null ? clamp(satisfactionScore, 0, 100) : null,
        frequencyScore: clamp(frequencyScore, 0, 100),
      };
    };

    const currentScores = computeScores({
      functionRows: fSplit.current,
      libidoRows: lSplit.current,
      satisfactionRows: sSplit.current,
      frequencyRows,
    });
    const prevScores = computeScores({
      functionRows: fSplit.previous,
      libidoRows: lSplit.previous,
      satisfactionRows: sSplit.previous,
      frequencyRows,
    });

    if (currentScores.overall == null) {
      return new Response(
        JSON.stringify({
          error: "Not enough data to calculate wellness score yet",
          details: {
            functionRows: fSplit.current.length,
            libidoRows: lSplit.current.length,
            satisfactionRows: sSplit.current.length,
          },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const delta =
      prevScores.overall != null
        ? clamp(currentScores.overall - prevScores.overall, -100, 100)
        : null;

    const score_trend =
      delta == null ? null : delta > 2 ? "improving" : delta < -2 ? "declining" : "stable";

    const { insights, recommendations } = buildInsights({
      overall: currentScores.overall,
      delta,
      functionScore: currentScores.functionScore,
      libidoScore: currentScores.libidoScore,
      satisfactionScore: currentScores.satisfactionScore,
      frequencyScore: currentScores.frequencyScore,
    });

    return new Response(
      JSON.stringify({
        overall_wellness_score: Number(currentScores.overall.toFixed(2)),
        function_score:
          currentScores.functionScore != null
            ? Number(currentScores.functionScore.toFixed(2))
            : null,
        libido_score:
          currentScores.libidoScore != null ? Number(currentScores.libidoScore.toFixed(2)) : null,
        satisfaction_score:
          currentScores.satisfactionScore != null
            ? Number(currentScores.satisfactionScore.toFixed(2))
            : null,
        frequency_score: Number(currentScores.frequencyScore.toFixed(2)),
        relationship_score: null,
        score_trend,
        score_change: delta != null ? Number(delta.toFixed(2)) : null,
        insights,
        recommendations,
        // NOTE: calculation_date and calculation_period_days are stored by the client insert.
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("calculate-nsfw-wellness-score error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
