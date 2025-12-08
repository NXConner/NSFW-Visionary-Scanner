/**
 * Predictive Health Modeling
 * Handles advanced growth predictions, health risk predictions, optimal routine timing, outcome simulations, and long-term forecasting
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Growth Predictions ====================

export interface GrowthPrediction {
  id: string
  user_id: string
  model_id: string | null
  prediction_date: string
  prediction_horizon_days: number
  input_data: any
  predicted_growth: any
  confidence_intervals: any | null
  confidence_level: number
  contributing_factors: any | null
  limiting_factors: any | null
  recommendations: string[] | null
  optimal_routine_suggestions: any | null
  created_at: string
}

export async function generateGrowthPrediction(
  predictionHorizonDays: number = 90
): Promise<GrowthPrediction | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to generate prediction')
      return null
    }

    // Call prediction Edge Function
    const { data: predictionData, error: predictionError } = await supabase.functions.invoke('predict-growth', {
      body: {
        prediction_horizon_days: predictionHorizonDays
      }
    })

    if (predictionError) {
      logger.error('Error generating prediction:', predictionError)
      toast.error('Failed to generate prediction')
      return null
    }

    // Save prediction
    const { data, error } = await supabase
      .from('growth_predictions')
      .insert({
        user_id: user.id,
        prediction_date: new Date().toISOString().split('T')[0],
        prediction_horizon_days: predictionHorizonDays,
        input_data: predictionData.input_data,
        predicted_growth: predictionData.predicted_growth,
        confidence_intervals: predictionData.confidence_intervals,
        contributing_factors: predictionData.contributing_factors,
        recommendations: predictionData.recommendations
      })
      .select()
      .single()

    if (error) {
      logger.error('Error saving prediction:', error)
      return null
    }

    toast.success('Growth prediction generated!')
    return data as GrowthPrediction
  } catch (error) {
    logger.error('Error in generateGrowthPrediction:', error)
    return null
  }
}

export async function getGrowthPredictions(): Promise<GrowthPrediction[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('growth_predictions')
      .select('*')
      .eq('user_id', user.id)
      .order('prediction_date', { ascending: false })

    if (error) {
      logger.error('Error fetching predictions:', error)
      return []
    }

    return (data || []) as GrowthPrediction[]
  } catch (error) {
    logger.error('Error in getGrowthPredictions:', error)
    return []
  }
}

// ==================== Health Risk Predictions ====================

export interface HealthRiskPrediction {
  id: string
  user_id: string
  model_id: string | null
  risk_type: 'erectile_dysfunction' | 'peyronies' | 'circulation' | 'general_health' | 'other'
  risk_level: 'low' | 'moderate' | 'high' | 'very_high'
  risk_score: number
  prediction_horizon_days: number
  probability: number | null
  risk_factors: any
  protective_factors: any | null
  prevention_recommendations: string[] | null
  monitoring_recommendations: string[] | null
  when_to_see_doctor: string | null
  validated: boolean
  validation_date: string | null
  actual_outcome: string | null
  created_at: string
}

export async function generateHealthRiskPrediction(
  riskType: HealthRiskPrediction['risk_type'],
  predictionHorizonDays: number = 365
): Promise<HealthRiskPrediction | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to generate risk prediction')
      return null
    }

    // Call risk prediction Edge Function
    const { data: riskData, error: riskError } = await supabase.functions.invoke('predict-health-risk', {
      body: {
        risk_type: riskType,
        prediction_horizon_days: predictionHorizonDays
      }
    })

    if (riskError) {
      logger.error('Error generating risk prediction:', riskError)
      toast.error('Failed to generate risk prediction')
      return null
    }

    // Save prediction
    const { data, error } = await supabase
      .from('health_risk_predictions')
      .insert({
        user_id: user.id,
        risk_type: riskType,
        risk_level: riskData.risk_level,
        risk_score: riskData.risk_score,
        prediction_horizon_days: predictionHorizonDays,
        probability: riskData.probability,
        risk_factors: riskData.risk_factors,
        protective_factors: riskData.protective_factors,
        prevention_recommendations: riskData.prevention_recommendations,
        monitoring_recommendations: riskData.monitoring_recommendations
      })
      .select()
      .single()

    if (error) {
      logger.error('Error saving risk prediction:', error)
      return null
    }

    toast.success('Health risk prediction generated!')
    return data as HealthRiskPrediction
  } catch (error) {
    logger.error('Error in generateHealthRiskPrediction:', error)
    return null
  }
}

// ==================== Routine Timing Predictions ====================

export interface RoutineTimingPrediction {
  id: string
  user_id: string
  model_id: string | null
  prediction_date: string
  prediction_period_days: number
  optimal_times: any
  optimal_days: any | null
  optimal_duration_minutes: number | null
  optimal_frequency_per_week: number | null
  timing_factors: any | null
  expected_effectiveness: number | null
  expected_progress: any | null
  created_at: string
}

export async function generateRoutineTimingPrediction(
  predictionPeriodDays: number = 30
): Promise<RoutineTimingPrediction | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to generate timing prediction')
      return null
    }

    // Call timing prediction Edge Function
    const { data: timingData, error: timingError } = await supabase.functions.invoke('predict-routine-timing', {
      body: {
        prediction_period_days: predictionPeriodDays
      }
    })

    if (timingError) {
      logger.error('Error generating timing prediction:', timingError)
      toast.error('Failed to generate timing prediction')
      return null
    }

    // Save prediction
    const { data, error } = await supabase
      .from('routine_timing_predictions')
      .insert({
        user_id: user.id,
        prediction_date: new Date().toISOString().split('T')[0],
        prediction_period_days: predictionPeriodDays,
        optimal_times: timingData.optimal_times,
        optimal_days: timingData.optimal_days,
        optimal_duration_minutes: timingData.optimal_duration,
        optimal_frequency_per_week: timingData.optimal_frequency,
        timing_factors: timingData.timing_factors,
        expected_effectiveness: timingData.expected_effectiveness
      })
      .select()
      .single()

    if (error) {
      logger.error('Error saving timing prediction:', error)
      return null
    }

    toast.success('Routine timing prediction generated!')
    return data as RoutineTimingPrediction
  } catch (error) {
    logger.error('Error in generateRoutineTimingPrediction:', error)
    return null
  }
}

// ==================== Outcome Simulations ====================

export interface OutcomeSimulation {
  id: string
  user_id: string
  scenario_name: string
  scenario_type: 'routine_change' | 'lifestyle_change' | 'what_if' | 'goal_achievement'
  simulation_parameters: any
  baseline_data: any
  simulated_outcomes: any
  time_horizon_days: number
  vs_baseline: any | null
  improvement_percentage: number | null
  recommendations: string[] | null
  action_items: string[] | null
  created_at: string
}

export async function createOutcomeSimulation(
  scenarioName: string,
  scenarioType: OutcomeSimulation['scenario_type'],
  simulationParameters: any,
  timeHorizonDays: number = 90
): Promise<OutcomeSimulation | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create simulation')
      return null
    }

    // Call simulation Edge Function
    const { data: simulationData, error: simulationError } = await supabase.functions.invoke('simulate-outcome', {
      body: {
        scenario_type: scenarioType,
        simulation_parameters: simulationParameters,
        time_horizon_days: timeHorizonDays
      }
    })

    if (simulationError) {
      logger.error('Error creating simulation:', simulationError)
      toast.error('Failed to create simulation')
      return null
    }

    // Save simulation
    const { data, error } = await supabase
      .from('outcome_simulations')
      .insert({
        user_id: user.id,
        scenario_name: scenarioName,
        scenario_type: scenarioType,
        simulation_parameters: simulationParameters,
        baseline_data: simulationData.baseline_data,
        simulated_outcomes: simulationData.simulated_outcomes,
        time_horizon_days: timeHorizonDays,
        vs_baseline: simulationData.vs_baseline,
        improvement_percentage: simulationData.improvement_percentage,
        recommendations: simulationData.recommendations
      })
      .select()
      .single()

    if (error) {
      logger.error('Error saving simulation:', error)
      return null
    }

    toast.success('Simulation created!')
    return data as OutcomeSimulation
  } catch (error) {
    logger.error('Error in createOutcomeSimulation:', error)
    return null
  }
}

// ==================== Long-Term Health Forecasts ====================

export interface LongTermHealthForecast {
  id: string
  user_id: string
  model_id: string | null
  forecast_date: string
  forecast_horizon_years: number
  forecasted_metrics: any
  confidence_intervals: any | null
  best_case_trajectory: any | null
  worst_case_trajectory: any | null
  most_likely_trajectory: any | null
  key_factors: any | null
  intervention_opportunities: any | null
  long_term_recommendations: string[] | null
  milestone_goals: any | null
  created_at: string
}

export async function generateLongTermForecast(
  forecastHorizonYears: number = 5
): Promise<LongTermHealthForecast | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to generate forecast')
      return null
    }

    // Call forecast Edge Function
    const { data: forecastData, error: forecastError } = await supabase.functions.invoke('forecast-long-term-health', {
      body: {
        forecast_horizon_years: forecastHorizonYears
      }
    })

    if (forecastError) {
      logger.error('Error generating forecast:', forecastError)
      toast.error('Failed to generate forecast')
      return null
    }

    // Save forecast
    const { data, error } = await supabase
      .from('long_term_health_forecasts')
      .insert({
        user_id: user.id,
        forecast_date: new Date().toISOString().split('T')[0],
        forecast_horizon_years: forecastHorizonYears,
        forecasted_metrics: forecastData.forecasted_metrics,
        confidence_intervals: forecastData.confidence_intervals,
        best_case_trajectory: forecastData.best_case_trajectory,
        worst_case_trajectory: forecastData.worst_case_trajectory,
        most_likely_trajectory: forecastData.most_likely_trajectory,
        key_factors: forecastData.key_factors,
        long_term_recommendations: forecastData.long_term_recommendations
      })
      .select()
      .single()

    if (error) {
      logger.error('Error saving forecast:', error)
      return null
    }

    toast.success('Long-term forecast generated!')
    return data as LongTermHealthForecast
  } catch (error) {
    logger.error('Error in generateLongTermForecast:', error)
    return null
  }
}

