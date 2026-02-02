import { logger } from "@/lib/logger";
import { toast } from "sonner";
import type { AIScanAnalysis, DetectedCondition, HealthAlert, ScanRow } from "./types";
import { clamp01, getScan, normalizeConfidenceLevel, requireUserId } from "./utils";

// Local storage for AI scan analysis results
const ANALYSIS_STORAGE_KEY = "ai_scan_analysis";

function getStoredAnalysis(): AIScanAnalysis[] {
  try {
    const stored = localStorage.getItem(ANALYSIS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAnalysisToStorage(analyses: AIScanAnalysis[]): void {
  try {
    localStorage.setItem(ANALYSIS_STORAGE_KEY, JSON.stringify(analyses.slice(0, 100)));
  } catch {
    // ignore
  }
}

function createBaseAnalysis(
  scanId: string,
  userId: string,
  analysisType: AIScanAnalysis["analysis_type"],
): AIScanAnalysis {
  return {
    id: crypto.randomUUID(),
    scan_id: scanId,
    user_id: userId,
    analysis_type: analysisType,
    detected_conditions: null,
    risk_factors: null,
    health_alerts: null,
    suggested_measurements: null,
    measurement_confidence: null,
    measurement_reasoning: null,
    overall_quality_score: null,
    quality_breakdown: null,
    quality_recommendations: null,
    anomalies_detected: null,
    anomaly_confidence: null,
    previous_scan_id: null,
    comparison_results: null,
    trend_direction: null,
    trend_data: null,
    visualization_url: null,
    ai_model_version: null,
    ai_model_confidence: null,
    processing_time_ms: null,
    analyzed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

export async function analyzeScanWithAI(
  scanId: string,
  analysisTypes: AIScanAnalysis["analysis_type"][],
): Promise<AIScanAnalysis[]> {
  const userId = await requireUserId();
  if (!userId) return [];

  const scan = await getScan(scanId);
  if (!scan || scan.user_id !== userId) {
    toast.error("Scan not found");
    return [];
  }

  const started = Date.now();

  const detectedConditions: DetectedCondition[] = [];
  const healthAlerts: HealthAlert[] = [];

  if (scan.urgency === "urgent") {
    healthAlerts.push({
      message: "Scan indicates urgent follow-up recommended.",
      severity: "high",
    });
  }
  if (scan.overall_health === "concerning") {
    detectedConditions.push({
      condition: "Concerning overall health score",
      confidence: 0.7,
      severity: "high",
      recommendation: "Consider consulting a healthcare provider.",
    });
  }

  const missingLength = scan.length == null;
  const missingGirth = scan.girth == null;

  const suggestedMeasurements: Record<string, unknown> = {};
  if (missingLength) suggestedMeasurements.length = "missing";
  if (missingGirth) suggestedMeasurements.girth = "missing";

  const confidence = normalizeConfidenceLevel(scan.confidence_level);
  const qualityScore = confidence ?? 0.7;

  const rows = analysisTypes.map(type => {
    const base = createBaseAnalysis(scanId, userId, type);

    if (type === "health_detection") {
      base.detected_conditions = detectedConditions.length ? detectedConditions : null;
      base.health_alerts = healthAlerts.length ? healthAlerts : null;
      base.ai_model_confidence = clamp01((confidence ?? 0.75) * 0.9);
    }

    if (type === "measurement_suggestion") {
      base.suggested_measurements = Object.keys(suggestedMeasurements).length
        ? suggestedMeasurements
        : null;
      base.measurement_confidence = clamp01(confidence ?? 0.75);
      base.measurement_reasoning =
        missingLength || missingGirth
          ? "Scan is missing one or more key measurements. Ensure proper alignment and calibration."
          : "Measurements appear complete. Consider re-scanning if confidence is low.";
    }

    if (type === "quality_assessment") {
      base.overall_quality_score = clamp01(qualityScore);
      base.quality_breakdown = {
        lighting: clamp01(qualityScore),
        focus: clamp01(qualityScore),
        angle: clamp01(qualityScore),
      };
      base.quality_recommendations =
        qualityScore < 0.6
          ? ["Improve lighting and stabilize camera", "Re-scan with consistent angle"]
          : ["Good scan quality"];
    }

    if (type === "anomaly_detection") {
      base.anomalies_detected = null;
      base.anomaly_confidence = clamp01(confidence ?? 0.7);
    }

    base.ai_model_version = "heuristics-v1";
    base.processing_time_ms = Date.now() - started;
    return base;
  });

  // Store locally
  const analyses = getStoredAnalysis();
  analyses.unshift(...rows);
  saveAnalysisToStorage(analyses);

  return rows;
}

export async function getAIScanAnalysis(scanId: string): Promise<AIScanAnalysis[]> {
  try {
    const analyses = getStoredAnalysis();
    return analyses.filter(a => a.scan_id === scanId);
  } catch (error) {
    logger.error("getAIScanAnalysis error", { error });
    return [];
  }
}
