export interface GrowthPrediction {
  id: string;
  user_id: string;
  model_id: string | null;
  prediction_date: string;
  prediction_horizon_days: number;
  input_data: unknown;
  predicted_growth: unknown;
  confidence_intervals: unknown | null;
  confidence_level: number;
  contributing_factors: unknown | null;
  limiting_factors: unknown | null;
  recommendations: string[] | null;
  optimal_routine_suggestions: unknown | null;
  created_at: string;
}

export interface HealthRiskPrediction {
  id: string;
  user_id: string;
  model_id: string | null;
  risk_type: string;
  risk_level: string;
  risk_score: number;
  prediction_horizon_days: number;
  probability: number | null;
  risk_factors: unknown;
  protective_factors: unknown | null;
  prevention_recommendations: string[] | null;
  monitoring_recommendations: string[] | null;
  when_to_see_doctor: string | null;
  created_at: string;
}

export interface RoutineTimingPrediction {
  id: string;
  user_id: string;
  model_id: string | null;
  prediction_date: string;
  prediction_period_days: number;
  optimal_times: unknown;
  optimal_days: unknown | null;
  optimal_duration_minutes: number | null;
  optimal_frequency_per_week: number | null;
  timing_factors: unknown | null;
  expected_effectiveness: number | null;
  expected_progress: unknown | null;
  created_at: string;
}

export interface OutcomeSimulation {
  id: string;
  user_id: string;
  scenario_name: string;
  scenario_type: string;
  simulation_parameters: unknown;
  baseline_data: unknown;
  simulated_outcomes: unknown;
  time_horizon_days: number;
  vs_baseline: unknown | null;
  improvement_percentage: number | null;
  recommendations: string[] | null;
  action_items: string[] | null;
  created_at: string;
}

export interface LongTermHealthForecast {
  id: string;
  user_id: string;
  model_id: string | null;
  forecast_date: string;
  forecast_horizon_years: number;
  forecasted_metrics: unknown;
  confidence_intervals: unknown | null;
  best_case_trajectory: unknown | null;
  worst_case_trajectory: unknown | null;
  most_likely_trajectory: unknown | null;
  key_factors: unknown | null;
  intervention_opportunities: unknown | null;
  long_term_recommendations: string[] | null;
  milestone_goals: unknown | null;
  created_at: string;
}
