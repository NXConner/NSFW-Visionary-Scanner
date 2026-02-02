export type JsonObject = Record<string, unknown>;

export interface ReportConfig {
  include_charts: boolean;
  include_tables: boolean;
  include_summary: boolean;
  include_recommendations: boolean;
  page_size: "a4" | "letter" | "legal";
  orientation: "portrait" | "landscape";
}

export interface DateRange {
  start_date: string;
  end_date: string;
  preset?: "week" | "month" | "quarter" | "year" | "all_time" | "custom";
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface ChartConfig {
  progress_chart: "line" | "bar" | "area" | null;
  comparison_chart: "radar" | "bar" | null;
  distribution_chart: "pie" | "doughnut" | null;
}

export interface CustomReport {
  id: string;
  user_id: string;
  report_name: string;
  description?: string;
  report_type: "progress" | "health" | "comparison" | "comprehensive" | "custom";
  report_config: ReportConfig;
  selected_metrics: string[];
  date_range: DateRange;
  theme: "light" | "dark" | "professional" | "minimal";
  color_scheme: ColorScheme;
  chart_types: ChartConfig;
  is_favorite: boolean;
  is_scheduled: boolean;
  is_shared?: boolean;
  schedule_frequency?: "daily" | "weekly" | "monthly" | null;
  schedule_day?: number | null;
  schedule_time?: string | null;
  next_scheduled_at?: string | null;
  last_generated_at?: string | null;
  generation_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReportTemplate {
  id: string;
  template_name: string;
  description: string;
  template_type: "progress" | "health" | "comparison" | "comprehensive" | "custom";
  default_metrics: string[];
  default_config: ReportConfig;
  is_system_template: boolean;
  is_premium?: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface ComparativeAnalytics {
  id: string;
  user_id: string;
  comparison_type: "self" | "baseline" | "goal" | "community";
  baseline_data: Record<string, number>;
  comparison_data: Record<string, number>;
  differences: Record<string, { absolute: number; percentage: number }>;
  insights: string[];
  created_at: string;
}

export interface PredictiveModelingResult {
  id: string;
  user_id: string;
  model_type: "linear" | "polynomial" | "exponential";
  input_data: Record<string, number[]>;
  prediction_horizon_days: number;
  predictions: Record<string, { date: string; value: number }[]>;
  confidence_intervals: Record<string, { lower: number; upper: number }[]>;
  accuracy_score: number;
  created_at: string;
}

export interface HealthRiskScore {
  id: string;
  user_id: string;
  risk_category: string;
  overall_risk_score: number;
  risk_level: "low" | "moderate" | "elevated" | "high";
  risk_factors: RiskFactor[];
  recommendations: string[];
  trend: "improving" | "stable" | "declining";
  created_at: string;
}

export interface RiskFactor {
  factor_name: string;
  score: number;
  weight: number;
  status: "normal" | "warning" | "critical";
  description: string;
}

export type AvailableMetric = { id: string; name: string; unit: string; category: string };

export const AVAILABLE_METRICS: AvailableMetric[] = [
  { id: "length", name: "Length", unit: "inches", category: "measurements" },
  { id: "girth", name: "Girth", unit: "inches", category: "measurements" },
  { id: "erect_length", name: "Erect Length", unit: "inches", category: "measurements" },
  { id: "erect_girth", name: "Erect Girth", unit: "inches", category: "measurements" },
  { id: "eq_score", name: "EQ Score", unit: "%", category: "health" },
  { id: "hardness", name: "Hardness", unit: "scale", category: "health" },
  { id: "routine_completion", name: "Routine Completion", unit: "%", category: "activity" },
  { id: "exercise_minutes", name: "Exercise Minutes", unit: "min", category: "activity" },
  { id: "scan_count", name: "Scans Taken", unit: "count", category: "activity" },
  { id: "diary_entries", name: "Diary Entries", unit: "count", category: "activity" },
];

export type ScanRow = {
  id: string;
  user_id: string;
  scanned_at: string | null;
  created_at: string | null;
  length: number | null;
  girth: number | null;
  erect_length: number | null;
  erect_girth: number | null;
  overall_health: string | null;
  confidence_level: number | null;
  urgency: string | null;
  analysis_result: unknown;
  curvature_detected?: boolean;
  curvature_severity?: "mild" | "moderate" | "severe" | null;
  conditions?: string[];
  recommendations?: string[];
};

export type HealthRiskScoreRow = {
  id: string;
  user_id: string;
  risk_category: string;
  overall_risk_score: number;
  risk_level: string;
  risk_factors: unknown;
  recommendations: string[];
  created_at: string;
};
