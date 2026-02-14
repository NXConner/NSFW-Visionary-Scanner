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
