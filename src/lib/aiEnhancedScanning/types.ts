/**
 * AI-Enhanced Scanning - shared types
 */

export type DetectedCondition = {
  condition: string;
  confidence: number; // 0..1
  severity: "low" | "medium" | "high" | "critical" | string;
  recommendation?: string;
};

export type HealthAlert = {
  message: string;
  severity?: "low" | "medium" | "high" | "critical" | string;
};

export interface AIScanAnalysis {
  id: string;
  scan_id: string | null;
  user_id: string;
  analysis_type:
    | "health_detection"
    | "measurement_suggestion"
    | "quality_assessment"
    | "anomaly_detection"
    | "comparison"
    | "trend_visualization";
  detected_conditions: unknown[] | null;
  risk_factors: unknown[] | null;
  health_alerts: unknown[] | null;
  suggested_measurements: Record<string, unknown> | null;
  measurement_confidence: number | null;
  measurement_reasoning: string | null;
  overall_quality_score: number | null;
  quality_breakdown: Record<string, unknown> | null;
  quality_recommendations: string[] | null;
  anomalies_detected: unknown[] | null;
  anomaly_confidence: number | null;
  previous_scan_id: string | null;
  comparison_results: Record<string, unknown> | null;
  trend_direction: "improving" | "stable" | "declining" | "fluctuating" | null;
  trend_data: Record<string, unknown> | null;
  visualization_url: string | null;
  ai_model_version: string | null;
  ai_model_confidence: number | null;
  processing_time_ms: number | null;
  analyzed_at: string;
  created_at: string;
}

export interface MeasurementSuggestion {
  id: string;
  scan_id: string | null;
  user_id: string;
  suggestion_type:
    | "angle_adjustment"
    | "distance_adjustment"
    | "lighting_improvement"
    | "focus_improvement"
    | "position_correction";
  current_value: number | null;
  suggested_value: number;
  improvement_expected: number;
  reasoning: string | null;
  priority: "low" | "medium" | "high";
  is_applied: boolean;
  applied_at: string | null;
  created_at: string;
}

export interface QualityAssessment {
  id: string;
  scan_id: string | null;
  user_id: string;
  overall_score: number;
  lighting_score: number | null;
  focus_score: number | null;
  angle_score: number | null;
  distance_score: number | null;
  stability_score: number | null;
  contrast_score: number | null;
  recommendations: string[] | null;
  critical_issues: string[] | null;
  compared_to_average: boolean;
  average_score: number | null;
  percentile_rank: number | null;
  assessed_at: string;
  created_at: string;
}

export interface AnomalyDetection {
  id: string;
  scan_id: string | null;
  user_id: string;
  anomaly_type:
    | "measurement_outlier"
    | "shape_anomaly"
    | "color_anomaly"
    | "texture_anomaly"
    | "size_anomaly"
    | "position_anomaly";
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  description: string;
  location: Record<string, unknown> | null;
  affected_measurements: string[] | null;
  compared_to_previous: boolean;
  previous_scan_id: string | null;
  deviation_amount: number | null;
  recommendation: string | null;
  requires_attention: boolean;
  is_reviewed: boolean;
  reviewed_at: string | null;
  review_notes: string | null;
  detected_at: string;
  created_at: string;
}

export interface HealthTrendVisualization {
  id: string;
  user_id: string;
  visualization_type:
    | "growth_trend"
    | "measurement_trend"
    | "health_score_trend"
    | "comparison_trend";
  trend_data: Record<string, unknown>;
  time_period_days: number | null;
  data_points: unknown;
  chart_image_url: string | null;
  chart_config: Record<string, unknown> | null;
  insights: string[] | null;
  predictions: Record<string, unknown> | null;
  generated_at: string;
  created_at: string;
}

export type ScanRow = {
  id: string;
  user_id: string;
  scanned_at: string | null;
  created_at: string | null;
  length: number | null;
  girth: number | null;
  overall_health: string | null;
  confidence_level: number | null;
  urgency: string | null;
  analysis_result: unknown;
};
