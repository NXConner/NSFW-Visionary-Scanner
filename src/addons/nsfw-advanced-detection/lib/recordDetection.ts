import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import type { NsfwDetectionResult } from "@/addons/nsfw-scanner/scanner/types";
import type { AdvancedNsfwDetectionPolicy } from "../types";

let cachedNsfwJsModelId: string | null = null;
let cachedNsfwJsModelLookup: Promise<string | null> | null = null;

async function getNsfwJsModelId(): Promise<string | null> {
  if (cachedNsfwJsModelId) return cachedNsfwJsModelId;
  if (cachedNsfwJsModelLookup) return cachedNsfwJsModelLookup;

  cachedNsfwJsModelLookup = (async () => {
    try {
      const { data, error } = await fromExtended("nsfw_detection_models")
        .select("id,name,is_active")
        .eq("name", "NSFW-JS")
        .maybeSingle();
      if (error || !data?.id) return null;
      cachedNsfwJsModelId = String(data.id);
      return cachedNsfwJsModelId;
    } catch {
      return null;
    } finally {
      cachedNsfwJsModelLookup = null;
    }
  })();

  return cachedNsfwJsModelLookup;
}

export async function recordAdvancedNsfwDetection(args: {
  scanId: string;
  detection: NsfwDetectionResult;
  policy: AdvancedNsfwDetectionPolicy;
  thresholds?: { explicitThreshold?: number; suggestiveThreshold?: number };
}): Promise<void> {
  const { scanId, detection, policy, thresholds } = args;
  if (!policy.enabled || !policy.storeDetectionHistory) return;
  if (!scanId) return;

  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    const modelId = await getNsfwJsModelId();
    if (!modelId) {
      logger.warn("[nsfw-advanced-detection] Model id missing; skipping history write");
      return;
    }

    // Idempotency: do not insert duplicates for the same scan/model.
    try {
      const { data: existing } = await fromExtended("nsfw_detection_results")
        .select("id")
        .eq("scan_id", scanId)
        .eq("user_id", userId)
        .eq("model_id", modelId)
        .maybeSingle();
      if (existing?.id) return;
    } catch {
      // If table doesn't exist in this environment, do not break scans.
      return;
    }

    const overall = Number(detection.confidence) || 0;
    const predictions = {
      model: detection.model,
      label: detection.label,
      confidence: overall,
      raw: detection.raw ?? {},
      thresholds: {
        explicit: thresholds?.explicitThreshold ?? null,
        suggestive: thresholds?.suggestiveThreshold ?? null,
        confidenceThreshold: policy.confidenceThreshold,
      },
    };

    await fromExtended("nsfw_detection_results").insert({
      scan_id: scanId,
      model_id: modelId,
      user_id: userId,
      overall_confidence: overall,
      predictions,
      execution_time_ms: null,
    });

    // Ensemble result (for now, single-model ensemble; future models can append).
    try {
      const { data: existingEnsemble } = await fromExtended("nsfw_ensemble_results")
        .select("id")
        .eq("scan_id", scanId)
        .eq("user_id", userId)
        .maybeSingle();
      if (existingEnsemble?.id) return;
    } catch {
      // ignore
    }

    await fromExtended("nsfw_ensemble_results").insert({
      scan_id: scanId,
      user_id: userId,
      combined_confidence: overall,
      model_results: [
        {
          model: "NSFW-JS",
          modelId,
          label: detection.label,
          confidence: overall,
        },
      ],
      final_classification: detection.label,
      confidence_intervals: null,
    });
  } catch (error) {
    logger.warn("[nsfw-advanced-detection] Failed to write detection history", {
      error: error instanceof Error ? error.message : error,
    });
  }
}
