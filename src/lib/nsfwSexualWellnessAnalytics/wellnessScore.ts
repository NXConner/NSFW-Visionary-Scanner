import { toast } from "sonner";

import { logger } from "@/lib/logger";

import { avg, clamp, db, daysAgoIso, requireUser, toScore100From10, todayIso } from "./common";
import { getFrequencyTracking } from "./frequency";
import { getLibidoTracking } from "./libido";
import { getSatisfactionTracking } from "./satisfaction";
import { getSexualFunctionTracking } from "./sexualFunction";
import type { NSFWWellnessScore } from "./types";

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

    const { data: row, error } = await db("nsfw_wellness_scores")
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
    const { data, error } = await db("nsfw_wellness_scores")
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
