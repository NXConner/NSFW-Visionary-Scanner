import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { supabase } from "@/integrations/supabase/client";
import type { ComparativeAnalytics, DateRange } from "./types";
import { computeSnapshot, fetchScansInRange } from "./metrics";

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(-9999, Math.min(9999, n));
}

export async function runComparativeAnalysis(
  comparisonType: ComparativeAnalytics["comparison_type"] = "self",
  baselineDate?: string,
): Promise<ComparativeAnalytics | null> {
  try {
    toast.info("Running analysis...");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const now = new Date().toISOString();
    const baselineStart = baselineDate ? baselineDate : daysAgoIso(60);
    const baselineEnd = baselineDate ? baselineDate : daysAgoIso(30);

    const baselineRange: DateRange = {
      start_date: baselineStart,
      end_date: baselineEnd,
      preset: "custom",
    };
    const currentRange: DateRange = { start_date: baselineEnd, end_date: now, preset: "custom" };

    const [baselineScans, currentScans] = await Promise.all([
      fetchScansInRange(baselineRange),
      fetchScansInRange(currentRange),
    ]);
    const baseline = computeSnapshot(baselineScans);
    const current = computeSnapshot(currentScans);

    const baselineData: Record<string, number> = {};
    const comparisonData: Record<string, number> = {};

    if (baseline.length_avg != null) baselineData.length = baseline.length_avg;
    if (baseline.girth_avg != null) baselineData.girth = baseline.girth_avg;
    if (baseline.erect_length_avg != null) baselineData.erect_length = baseline.erect_length_avg;
    if (baseline.erect_girth_avg != null) baselineData.erect_girth = baseline.erect_girth_avg;
    if (baseline.eq_score_avg != null) baselineData.eq_score = baseline.eq_score_avg;
    if (baseline.hardness_avg != null) baselineData.hardness = baseline.hardness_avg;
    baselineData.scan_count = baseline.scan_count;

    if (current.length_avg != null) comparisonData.length = current.length_avg;
    if (current.girth_avg != null) comparisonData.girth = current.girth_avg;
    if (current.erect_length_avg != null) comparisonData.erect_length = current.erect_length_avg;
    if (current.erect_girth_avg != null) comparisonData.erect_girth = current.erect_girth_avg;
    if (current.eq_score_avg != null) comparisonData.eq_score = current.eq_score_avg;
    if (current.hardness_avg != null) comparisonData.hardness = current.hardness_avg;
    comparisonData.scan_count = current.scan_count;

    const differences: Record<string, { absolute: number; percentage: number }> = {};
    const insights: string[] = [];

    for (const key of Object.keys(comparisonData)) {
      const cur = comparisonData[key] ?? 0;
      const base = baselineData[key] ?? 0;
      const absolute = cur - base;
      const percentage = base !== 0 ? clampPct((absolute / base) * 100) : 0;
      differences[key] = { absolute, percentage };

      if (key !== "scan_count" && Number.isFinite(percentage) && Math.abs(percentage) >= 2) {
        insights.push(`${key} changed by ${percentage.toFixed(1)}% vs baseline.`);
      }
    }

    if (insights.length === 0) {
      insights.push("Not enough data to detect meaningful changes yet.");
    }

    toast.success("Analysis complete");
    return {
      id: crypto.randomUUID(),
      user_id: user.id,
      comparison_type: comparisonType,
      baseline_data: baselineData,
      comparison_data: comparisonData,
      differences,
      insights,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error running comparative analysis", { error });
    toast.error("Analysis failed");
    return null;
  }
}
