import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";

import type {
  GrowthPrediction,
  HealthRiskPrediction,
  LongTermHealthForecast,
  OutcomeSimulation,
  RoutineTimingPrediction,
} from "./types";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

async function getActiveModelId(modelType: string): Promise<string | null> {
  const { data, error } = await supabase

    .from("predictive_models" as any)
    .select("id")
    .eq("model_type", modelType)
    .eq("is_active", true)
    .order("is_production", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;

  return ((data as any)?.id as string) ?? null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export async function generateGrowthPrediction(
  predictionHorizonDays: number = 90,
): Promise<GrowthPrediction | null> {
  const userId = await requireUserId();
  const modelId = await getActiveModelId("growth_prediction");

  // Pull recent wellness + sexual metrics as real inputs (no mock data).
  const { data: wellness } = await supabase

    .from("sexual_wellness_scores" as any)
    .select("entry_date, overall_score, physical_score, emotional_score, relationship_score")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(30);

  const baseline = ((wellness as any)?.[0]?.physical_score ??
    (wellness as any)?.[0]?.overall_score ??
    50) as number;
  const adherenceFactor = clamp((baseline ?? 50) / 100, 0.2, 0.9);

  // Simple, data-driven projection: effectiveness decays over horizon
  const points = [0, 30, 60, 90, 180, 365].filter(d => d <= predictionHorizonDays);
  const predicted = points.map(d => ({
    day: d,
    effectiveness: Math.round(
      clamp(adherenceFactor * (1 - d / (predictionHorizonDays * 1.5)), 0.1, 0.95) * 100,
    ),
  }));

  const payload = {
    user_id: userId,
    model_id: modelId,
    prediction_date: today(),
    prediction_horizon_days: predictionHorizonDays,
    input_data: { wellness: wellness ?? [] },
    predicted_growth: { projected_effectiveness: predicted },
    confidence_intervals: null,
    confidence_level: 0.75,
    contributing_factors: { consistency: adherenceFactor },
    limiting_factors: null,
    recommendations: [
      "Maintain a consistent routine and track your wellness scores weekly.",
      "If you notice pain or adverse symptoms, reduce intensity and consult a professional.",
    ],
    optimal_routine_suggestions: null,
  };

  const { data, error } = await fromExtended("growth_predictions")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as GrowthPrediction | null;
}

export async function getGrowthPredictions(): Promise<GrowthPrediction[]> {
  const userId = await requireUserId();

  const { data, error } = await fromExtended("growth_predictions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as GrowthPrediction[];
}

export async function generateHealthRiskPrediction(
  riskType: string,
  horizonDays: number = 90,
): Promise<HealthRiskPrediction | null> {
  const userId = await requireUserId();
  const modelId = await getActiveModelId("health_risk");

  // Use real urinary + prostate recent signals to derive a risk score.
  const { data: urinary } = await supabase

    .from("urinary_health" as any)
    .select("entry_date, urgency_level, nocturia_count, blood_in_urine, pain_on_urination")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(14);
  const { data: prostate } = await supabase

    .from("prostate_health" as any)
    .select("entry_date, psa_level, blood_in_urine, pain_level, urination_difficulty")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(14);

  const urinarySignals = urinary ?? [];
  const prostateSignals = prostate ?? [];

  const maxUrgency = Math.max(0, ...urinarySignals.map((u: any) => Number(u.urgency_level ?? 0)));
  const maxNocturia = Math.max(0, ...urinarySignals.map((u: any) => Number(u.nocturia_count ?? 0)));
  const anyBlood =
    urinarySignals.some((u: any) => Boolean(u.blood_in_urine)) ||
    prostateSignals.some((p: any) => Boolean(p.blood_in_urine));
  const maxPain = Math.max(0, ...prostateSignals.map((p: any) => Number(p.pain_level ?? 0)));

  let score = 10 + maxUrgency * 4 + maxNocturia * 3 + maxPain * 2 + (anyBlood ? 35 : 0);
  score = clamp(score, 0, 100);

  const level = score >= 80 ? "very_high" : score >= 60 ? "high" : score >= 35 ? "moderate" : "low";

  const payload = {
    user_id: userId,
    model_id: modelId,
    risk_type: riskType,
    risk_level: level,
    risk_score: score,
    prediction_horizon_days: horizonDays,
    probability: clamp(score / 100, 0, 1),
    risk_factors: { anyBlood, maxUrgency, maxNocturia, maxPain },
    protective_factors: null,
    prevention_recommendations: [
      "Stay hydrated and track urinary symptoms.",
      "Avoid high-intensity routines during symptom flare-ups.",
    ],
    monitoring_recommendations: ["Log symptoms daily for 2 weeks and review trends."],
    when_to_see_doctor: anyBlood ? "Blood in urine warrants prompt medical evaluation." : null,
  };

  const { data, error } = await fromExtended("health_risk_predictions")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as HealthRiskPrediction | null;
}

export async function getHealthRiskPredictions(): Promise<HealthRiskPrediction[]> {
  const userId = await requireUserId();

  const { data, error } = await fromExtended("health_risk_predictions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as HealthRiskPrediction[];
}

export async function generateRoutineTimingPrediction(
  routineType: string = "general",
): Promise<RoutineTimingPrediction | null> {
  const userId = await requireUserId();
  const modelId = await getActiveModelId("routine_timing");

  // Derive a timing suggestion from recent wellness entries (real).
  const { data: wellness } = await supabase

    .from("sexual_wellness_scores" as any)
    .select("entry_date, physical_score")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(14);

  const physicalAvg =
    wellness && wellness.length
      ? wellness.reduce((sum: number, w: any) => sum + Number(w.physical_score ?? 0), 0) /
        wellness.length
      : 0;

  const expected = clamp(physicalAvg, 0, 100);
  const payload = {
    user_id: userId,
    model_id: modelId,
    prediction_date: today(),
    prediction_period_days: 30,
    optimal_times: {
      routineType,
      suggestion:
        expected >= 60 ? "Morning or early afternoon" : "Late afternoon/evening (lower strain)",
    },
    optimal_days: [1, 3, 5],
    optimal_duration_minutes: expected >= 60 ? 25 : 15,
    optimal_frequency_per_week: expected >= 60 ? 4 : 3,
    timing_factors: { physicalAvg: Math.round(expected) },
    expected_effectiveness: Math.round(expected),
    expected_progress: null,
  };

  const { data, error } = await fromExtended("routine_timing_predictions")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as RoutineTimingPrediction | null;
}

export async function getRoutineTimingPredictions(): Promise<RoutineTimingPrediction[]> {
  const userId = await requireUserId();

  const { data, error } = await fromExtended("routine_timing_predictions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as RoutineTimingPrediction[];
}

export async function createOutcomeSimulation(
  scenarioName: string,
  simulationType: string,
  scenarioParameters: unknown = {},
  durationDays: number = 90,
): Promise<OutcomeSimulation | null> {
  const userId = await requireUserId();

  // Baseline: last wellness score.

  const { data: wellness } = await fromExtended("sexual_wellness_scores")
    .select("entry_date, overall_score")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(1);

  const baseline = Number((wellness as any)?.[0]?.overall_score ?? 50);
  const delta = clamp(Math.round(durationDays / 30) * 2, -10, 15);
  const simulated = clamp(baseline + delta, 0, 100);

  const payload = {
    user_id: userId,
    scenario_name: scenarioName,
    scenario_type: simulationType,
    simulation_parameters: scenarioParameters,
    baseline_data: { baselineWellness: baseline },
    simulated_outcomes: { projectedWellness: simulated, durationDays },
    time_horizon_days: durationDays,
    vs_baseline: { delta },
    improvement_percentage:
      baseline > 0 ? Math.round(((simulated - baseline) / baseline) * 1000) / 10 : null,
    recommendations: ["Track outcomes weekly and adjust based on discomfort and recovery."],
    action_items: ["Log wellness score weekly", "Use rest days after high intensity sessions"],
  };

  const { data, error } = await fromExtended("outcome_simulations")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as OutcomeSimulation | null;
}

export async function getOutcomeSimulations(): Promise<OutcomeSimulation[]> {
  const userId = await requireUserId();

  const { data, error } = await fromExtended("outcome_simulations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as OutcomeSimulation[];
}

export async function generateLongTermForecast(
  horizonYears: number = 2,
): Promise<LongTermHealthForecast | null> {
  const userId = await requireUserId();
  const modelId = await getActiveModelId("long_term_forecast");

  const { data: wellness } = await supabase

    .from("sexual_wellness_scores" as any)
    .select("entry_date, overall_score")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(12);

  const avg =
    wellness && wellness.length
      ? wellness.reduce((sum: number, w: any) => sum + Number(w.overall_score ?? 0), 0) /
        wellness.length
      : 50;

  const yearly = clamp(avg + 3, 0, 100);
  const payload = {
    user_id: userId,
    model_id: modelId,
    forecast_date: today(),
    forecast_horizon_years: horizonYears,
    forecasted_metrics: { avgWellness: Math.round(avg), projectedWellness: Math.round(yearly) },
    confidence_intervals: null,
    best_case_trajectory: { yearly: clamp(yearly + 8, 0, 100) },
    worst_case_trajectory: { yearly: clamp(yearly - 8, 0, 100) },
    most_likely_trajectory: { yearly },
    key_factors: { consistency: "high impact", recovery: "high impact" },
    intervention_opportunities: { sleep: "optimize", stress: "reduce" },
    long_term_recommendations: ["Prioritize recovery and maintain consistent tracking."],
    milestone_goals: {
      year1: clamp(Math.round(avg + 2), 0, 100),
      year2: clamp(Math.round(avg + 4), 0, 100),
    },
  };

  const { data, error } = await supabase

    .from("long_term_health_forecasts" as any)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as LongTermHealthForecast | null;
}

export async function getLongTermForecasts(): Promise<LongTermHealthForecast[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase

    .from("long_term_health_forecasts" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []) as unknown as LongTermHealthForecast[];
}

export async function getLatestLongTermForecast(): Promise<LongTermHealthForecast | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase

    .from("long_term_health_forecasts" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as LongTermHealthForecast | null;
}
