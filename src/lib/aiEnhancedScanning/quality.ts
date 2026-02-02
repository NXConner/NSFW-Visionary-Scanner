import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { QualityAssessment } from "./types";
import { clamp01, getScan, normalizeConfidenceLevel, requireUserId } from "./utils";

export async function assessScanQuality(scanId: string): Promise<QualityAssessment | null> {
  try {
    const userId = await requireUserId();
    if (!userId) return null;
    const scan = await getScan(scanId);
    if (!scan || scan.user_id !== userId) return null;

    const conf = normalizeConfidenceLevel(scan.confidence_level) ?? 0.7;
    const overall_score = clamp01(conf);
    const recommendations =
      overall_score < 0.6
        ? ["Increase lighting", "Avoid motion blur", "Re-scan"]
        : ["Good scan quality"];
    const critical_issues =
      overall_score < 0.4 ? ["Scan confidence is very low; results may be unreliable"] : null;

    const { data, error } = await supabase
      .from("quality_assessment_history")
      .insert({
        scan_id: scanId,
        user_id: userId,
        overall_score,
        lighting_score: overall_score,
        focus_score: overall_score,
        angle_score: overall_score,
        distance_score: null,
        stability_score: null,
        contrast_score: null,
        recommendations,
        critical_issues,
        compared_to_average: false,
        average_score: null,
        percentile_rank: null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as QualityAssessment;
  } catch (error) {
    logger.error("AIEnhancedScanning: assessScanQuality failed", { error });
    toast.error("Failed to assess quality");
    return null;
  }
}
