/**
 * NSFW Sexual Wellness Analytics
 * Supabase-backed implementation (RLS: users can manage their own rows).
 */

import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

export interface NSFWSexualFunctionTracking {
  id: string;
  user_id: string;
  entry_date: string;
  entry_time: string | null;
  activity_type: string | null;
  erectile_function_score: number | null;
  erection_quality: "none" | "partial" | "full" | "rigid" | null;
  erection_stability: number | null;
  erection_duration_minutes: number | null;
  stamina_minutes: number | null;
  control_level: number | null;
  recovery_time_minutes: number | null;
  partner_present: boolean;
  environment: string | null;
  factors_affecting: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NSFWLibidoTracking {
  id: string;
  user_id: string;
  entry_date: string;
  libido_level: number;
  libido_direction: "increasing" | "stable" | "decreasing" | null;
  desire_intensity: number | null;
  desire_frequency: string | null;
  contributing_factors: Record<string, unknown> | null;
  inhibiting_factors: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
}

export interface NSFWSatisfactionTracking {
  id: string;
  user_id: string;
  entry_date: string;
  activity_type: string | null;
  partner_present: boolean;
  overall_satisfaction: number;
  physical_satisfaction: number | null;
  emotional_satisfaction: number | null;
  partner_satisfaction: number | null;
  mutual_satisfaction: number | null;
  satisfaction_factors: Record<string, unknown> | null;
  dissatisfaction_factors: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
}

export interface NSFWFrequencyTracking {
  id: string;
  user_id: string;
  tracking_period_start: string;
  tracking_period_end: string;
  period_type: "weekly" | "monthly";
  solo_activity_count: number;
  partner_activity_count: number;
  total_activity_count: number;
  average_per_week: number | null;
  average_per_month: number | null;
  target_frequency_per_week: number | null;
  goal_achieved: boolean;
  frequency_trend: "increasing" | "stable" | "decreasing" | null;
  trend_strength: number | null;
  created_at: string;
}

export interface NSFWWellnessScore {
  id: string;
  user_id: string;
  calculation_date: string;
  calculation_period_days: number;
  overall_wellness_score: number;
  function_score: number | null;
  libido_score: number | null;
  satisfaction_score: number | null;
  frequency_score: number | null;
  relationship_score: number | null;
  score_trend: "improving" | "stable" | "declining" | null;
  score_change: number | null;
  insights: string[] | null;
  recommendations: string[] | null;
  calculated_at: string;
  created_at: string;
}

type AuthedUser = { id: string };

async function requireUser(): Promise<AuthedUser | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) logger.warn("NSFWWellness: auth.getUser failed", { error: error.message });
    if (!data.user) {
      toast.error("Please sign in");
      return null;
    }
    return { id: data.user.id };
  } catch (error) {
    logger.error("NSFWWellness: auth.getUser unexpected error", { error });
    toast.error("Please sign in");
    return null;
  }
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const avg = (values: Array<number | null | undefined>): number | null => {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
};

const toScore100From10 = (value10: number | null): number | null => {
  if (value10 === null) return null;
  return clamp((value10 / 10) * 100, 0, 100);
};

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.max(0, days));
  return d.toISOString().split("T")[0];
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export async function trackSexualFunction(
  entryDate: string,
  data: Partial<NSFWSexualFunctionTracking>,
): Promise<NSFWSexualFunctionTracking | null> {
  try {
    const user = await requireUser();
    if (!user) return null;

    const payload = {
      user_id: user.id,
      entry_date: entryDate,
      entry_time: data.entry_time ?? null,
      activity_type: data.activity_type ?? null,
      erectile_function_score: data.erectile_function_score ?? null,
      erection_quality: data.erection_quality ?? null,
      erection_duration_minutes: data.erection_duration_minutes ?? null,
      erection_stability: data.erection_stability ?? null,
      stamina_minutes: data.stamina_minutes ?? null,
      control_level: data.control_level ?? null,
      recovery_time_minutes: data.recovery_time_minutes ?? null,
      partner_present: data.partner_present ?? null,
      environment: data.environment ?? null,
      factors_affecting: data.factors_affecting ?? null,
      notes: data.notes ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: row, error } = await fromExtended("nsfw_sexual_function_tracking")
      .upsert(payload, { onConflict: "user_id,entry_date" })
      .select("*")
      .single();

    if (error) {
      logger.error("NSFWWellness: trackSexualFunction failed", { error: error.message });
      toast.error("Failed to save entry");
      return null;
    }

    toast.success("Saved");
    return row as NSFWSexualFunctionTracking;
  } catch (error) {
    logger.error("NSFWWellness: trackSexualFunction error", { error });
    toast.error("Failed to save entry");
    return null;
  }
}

export async function getSexualFunctionTracking(
  startDate?: string,
  endDate?: string,
): Promise<NSFWSexualFunctionTracking[]> {
  try {
    const user = await requireUser();
    if (!user) return [];

    const from = startDate ?? daysAgoIso(180);
    const to = endDate ?? todayIso();

    const { data, error } = await fromExtended("nsfw_sexual_function_tracking")
      .select("*")
      .eq("user_id", user.id)
      .gte("entry_date", from)
      .lte("entry_date", to)
      .order("entry_date", { ascending: true });

    if (error) {
      logger.error("NSFWWellness: getSexualFunctionTracking failed", { error: error.message });
      return [];
    }

    return (data || []) as NSFWSexualFunctionTracking[];
  } catch (error) {
    logger.error("NSFWWellness: getSexualFunctionTracking error", { error });
    return [];
  }
}

export async function trackLibido(
  entryDate: string,
  libidoLevel: number,
  data?: Partial<NSFWLibidoTracking>,
): Promise<NSFWLibidoTracking | null> {
  try {
    const user = await requireUser();
    if (!user) return null;

    const payload = {
      user_id: user.id,
      entry_date: entryDate,
      libido_level: clamp(Number(libidoLevel), 1, 10),
      libido_direction: data?.libido_direction ?? null,
      desire_intensity: data?.desire_intensity ?? null,
      desire_frequency: data?.desire_frequency ?? null,
      contributing_factors: data?.contributing_factors ?? null,
      inhibiting_factors: data?.inhibiting_factors ?? null,
      notes: data?.notes ?? null,
    };

    const { data: row, error } = await fromExtended("nsfw_libido_tracking")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      logger.error("NSFWWellness: trackLibido failed", { error: error.message });
      toast.error("Failed to save entry");
      return null;
    }

    toast.success("Saved");
    return row as NSFWLibidoTracking;
  } catch (error) {
    logger.error("NSFWWellness: trackLibido error", { error });
    toast.error("Failed to save entry");
    return null;
  }
}

export async function getLibidoTracking(
  startDate?: string,
  endDate?: string,
): Promise<NSFWLibidoTracking[]> {
  try {
    const user = await requireUser();
    if (!user) return [];

    const from = startDate ?? daysAgoIso(180);
    const to = endDate ?? todayIso();

    const { data, error } = await fromExtended("nsfw_libido_tracking")
      .select("*")
      .eq("user_id", user.id)
      .gte("entry_date", from)
      .lte("entry_date", to)
      .order("entry_date", { ascending: true });

    if (error) {
      logger.error("NSFWWellness: getLibidoTracking failed", { error: error.message });
      return [];
    }
    return (data || []) as NSFWLibidoTracking[];
  } catch (error) {
    logger.error("NSFWWellness: getLibidoTracking error", { error });
    return [];
  }
}

export async function trackSatisfaction(
  entryDate: string,
  overallSatisfaction: number,
  data?: Partial<NSFWSatisfactionTracking>,
): Promise<NSFWSatisfactionTracking | null> {
  try {
    const user = await requireUser();
    if (!user) return null;

    const payload = {
      user_id: user.id,
      entry_date: entryDate,
      overall_satisfaction: clamp(Number(overallSatisfaction), 1, 10),
      physical_satisfaction: data?.physical_satisfaction ?? null,
      emotional_satisfaction: data?.emotional_satisfaction ?? null,
      partner_satisfaction: data?.partner_satisfaction ?? null,
      mutual_satisfaction: data?.mutual_satisfaction ?? null,
      satisfaction_factors: data?.satisfaction_factors ?? null,
      dissatisfaction_factors: data?.dissatisfaction_factors ?? null,
      activity_type: data?.activity_type ?? null,
      partner_present: data?.partner_present ?? null,
      notes: data?.notes ?? null,
    };

    const { data: row, error } = await fromExtended("nsfw_satisfaction_tracking")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      logger.error("NSFWWellness: trackSatisfaction failed", { error: error.message });
      toast.error("Failed to save entry");
      return null;
    }

    toast.success("Saved");
    return row as NSFWSatisfactionTracking;
  } catch (error) {
    logger.error("NSFWWellness: trackSatisfaction error", { error });
    toast.error("Failed to save entry");
    return null;
  }
}

export async function getSatisfactionTracking(
  startDate?: string,
  endDate?: string,
): Promise<NSFWSatisfactionTracking[]> {
  try {
    const user = await requireUser();
    if (!user) return [];

    const from = startDate ?? daysAgoIso(180);
    const to = endDate ?? todayIso();

    const { data, error } = await fromExtended("nsfw_satisfaction_tracking")
      .select("*")
      .eq("user_id", user.id)
      .gte("entry_date", from)
      .lte("entry_date", to)
      .order("entry_date", { ascending: true });

    if (error) {
      logger.error("NSFWWellness: getSatisfactionTracking failed", { error: error.message });
      return [];
    }
    return (data || []) as NSFWSatisfactionTracking[];
  } catch (error) {
    logger.error("NSFWWellness: getSatisfactionTracking error", { error });
    return [];
  }
}

export async function trackFrequency(
  periodStart: string,
  periodEnd: string,
  periodType: "weekly" | "monthly",
  soloCount: number,
  partnerCount: number,
): Promise<NSFWFrequencyTracking | null> {
  try {
    const user = await requireUser();
    if (!user) return null;

    const solo = Math.max(0, Number(soloCount) || 0);
    const partner = Math.max(0, Number(partnerCount) || 0);
    const total = solo + partner;

    const avgPerWeek =
      periodType === "weekly" ? total : periodType === "monthly" ? total / 4 : null;
    const avgPerMonth =
      periodType === "monthly" ? total : periodType === "weekly" ? total * 4 : null;

    const payload = {
      user_id: user.id,
      tracking_period_start: periodStart,
      tracking_period_end: periodEnd,
      period_type: periodType,
      solo_activity_count: solo,
      partner_activity_count: partner,
      total_activity_count: total,
      average_per_week: avgPerWeek,
      average_per_month: avgPerMonth,
    };

    const { data: row, error } = await fromExtended("nsfw_frequency_tracking")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      logger.error("NSFWWellness: trackFrequency failed", { error: error.message });
      toast.error("Failed to save entry");
      return null;
    }

    toast.success("Saved");
    return row as NSFWFrequencyTracking;
  } catch (error) {
    logger.error("NSFWWellness: trackFrequency error", { error });
    toast.error("Failed to save entry");
    return null;
  }
}

export async function getFrequencyTracking(
  startDate?: string,
  endDate?: string,
): Promise<NSFWFrequencyTracking[]> {
  try {
    const user = await requireUser();
    if (!user) return [];

    const from = startDate ?? daysAgoIso(365);
    const to = endDate ?? todayIso();

    const { data, error } = await fromExtended("nsfw_frequency_tracking")
      .select("*")
      .eq("user_id", user.id)
      .gte("tracking_period_start", from)
      .lte("tracking_period_end", to)
      .order("tracking_period_start", { ascending: true });

    if (error) {
      logger.error("NSFWWellness: getFrequencyTracking failed", { error: error.message });
      return [];
    }
    return (data || []) as NSFWFrequencyTracking[];
  } catch (error) {
    logger.error("NSFWWellness: getFrequencyTracking error", { error });
    return [];
  }
}

export async function calculateWellnessScore(
  periodDays?: number,
): Promise<NSFWWellnessScore | null> {
  try {
    const user = await requireUser();
    if (!user) return null;

    const days = Math.max(7, Math.min(365, Number(periodDays ?? 30)));
    const from = daysAgoIso(days);
    const to = todayIso();

    const [functionRows, libidoRows, satisfactionRows, frequencyRows] = await Promise.all([
      getSexualFunctionTracking(from, to),
      getLibidoTracking(from, to),
      getSatisfactionTracking(from, to),
      getFrequencyTracking(from, to),
    ]);

    const functionAvg = avg(functionRows.map(r => r.erectile_function_score ?? null));
    const libidoAvg = avg(libidoRows.map(r => r.libido_level ?? null));
    const satisfactionAvg = avg(satisfactionRows.map(r => r.overall_satisfaction ?? null));

    const functionScore = toScore100From10(functionAvg);
    const libidoScore = toScore100From10(libidoAvg);
    const satisfactionScore = toScore100From10(satisfactionAvg);

    // Frequency score: target 3/week as “100”, linear scale.
    const totalActs = frequencyRows.reduce((acc, r) => acc + (r.total_activity_count ?? 0), 0);
    const weeks = Math.max(1, days / 7);
    const perWeek = totalActs / weeks;
    const frequencyScore = clamp((perWeek / 3) * 100, 0, 100);

    const weightedParts: Array<{ v: number; w: number }> = [];
    if (functionScore !== null) weightedParts.push({ v: functionScore, w: 0.35 });
    if (libidoScore !== null) weightedParts.push({ v: libidoScore, w: 0.2 });
    if (satisfactionScore !== null) weightedParts.push({ v: satisfactionScore, w: 0.35 });
    weightedParts.push({ v: frequencyScore, w: 0.1 });

    const wSum = weightedParts.reduce((a, p) => a + p.w, 0) || 1;
    const overall = weightedParts.reduce((a, p) => a + p.v * p.w, 0) / wSum;

    const insights: string[] = [];
    if (functionScore !== null && functionScore < 50)
      insights.push(
        "Function score is trending low — consider improving recovery, sleep, and reducing stress.",
      );
    if (libidoScore !== null && libidoScore < 50)
      insights.push(
        "Libido score is trending low — consider exercise consistency and reviewing inhibiting factors.",
      );
    if (satisfactionScore !== null && satisfactionScore < 50)
      insights.push(
        "Satisfaction score is trending low — consider focusing on communication and comfort.",
      );
    if (frequencyScore < 40)
      insights.push("Frequency is below target — consider setting a realistic weekly goal.");

    const recommendations: string[] = [];
    if (functionScore !== null && functionScore < 70)
      recommendations.push(
        "Prioritize sleep and hydration; avoid overtraining; review erection stability notes.",
      );
    if (libidoScore !== null && libidoScore < 70)
      recommendations.push(
        "Track stress, sleep, and exercise to identify drivers of libido changes.",
      );
    if (satisfactionScore !== null && satisfactionScore < 70)
      recommendations.push("Add notes on what improved satisfaction to learn patterns.");
    if (frequencyScore < 70)
      recommendations.push("Set a weekly target and track progress to build consistency.");

    const payload = {
      user_id: user.id,
      calculation_date: to,
      calculation_period_days: days,
      overall_wellness_score: Number(overall.toFixed(2)),
      function_score: functionScore !== null ? Number(functionScore.toFixed(2)) : null,
      libido_score: libidoScore !== null ? Number(libidoScore.toFixed(2)) : null,
      satisfaction_score: satisfactionScore !== null ? Number(satisfactionScore.toFixed(2)) : null,
      frequency_score: Number(frequencyScore.toFixed(2)),
      insights,
      recommendations,
    };

    const { data: row, error } = await fromExtended("nsfw_wellness_scores")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      logger.error("NSFWWellness: calculateWellnessScore insert failed", { error: error.message });
      toast.error("Failed to calculate wellness score");
      return null;
    }

    toast.success("Wellness score calculated");
    return row as NSFWWellnessScore;
  } catch (error) {
    logger.error("NSFWWellness: calculateWellnessScore error", { error });
    toast.error("Failed to calculate wellness score");
    return null;
  }
}

export async function getWellnessScores(limit?: number): Promise<NSFWWellnessScore[]> {
  try {
    const user = await requireUser();
    if (!user) return [];

    const lim = Math.max(1, Math.min(200, Number(limit ?? 50)));
    const { data, error } = await fromExtended("nsfw_wellness_scores")
      .select("*")
      .eq("user_id", user.id)
      .order("calculation_date", { ascending: false })
      .limit(lim);

    if (error) {
      logger.error("NSFWWellness: getWellnessScores failed", { error: error.message });
      return [];
    }
    return (data || []) as NSFWWellnessScore[];
  } catch (error) {
    logger.error("NSFWWellness: getWellnessScores error", { error });
    return [];
  }
}

export async function getLatestWellnessScore(): Promise<NSFWWellnessScore | null> {
  const scores = await getWellnessScores(1);
  return scores[0] ?? null;
}

export async function getWellnessTrend(periodDays?: number): Promise<{
  trend: "improving" | "stable" | "declining";
  change: number;
  insights: string[];
}> {
  try {
    const days = Math.max(7, Math.min(365, Number(periodDays ?? 30)));
    const scores = await getWellnessScores(10);
    if (scores.length < 2) return { trend: "stable", change: 0, insights: [] };

    // Compare newest vs previous (closest prior record)
    const newest = scores[0];
    const previous = scores[1];
    const change = Number(
      (newest.overall_wellness_score - previous.overall_wellness_score).toFixed(2),
    );

    const trend: "improving" | "stable" | "declining" =
      change > 2 ? "improving" : change < -2 ? "declining" : "stable";

    const insights: string[] = [];
    if (trend === "improving") insights.push(`Overall wellness improved by ${change} points.`);
    if (trend === "declining")
      insights.push(`Overall wellness declined by ${Math.abs(change)} points.`);
    if (trend === "stable") insights.push("Overall wellness is stable.");

    void days;
    return { trend, change, insights };
  } catch (error) {
    logger.error("NSFWWellness: getWellnessTrend error", { error });
    return { trend: "stable", change: 0, insights: [] };
  }
}
