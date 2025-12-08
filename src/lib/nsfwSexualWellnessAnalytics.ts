/**
 * NSFW Sexual Wellness Analytics
 * Handles enhanced sexual function tracking, libido monitoring, satisfaction tracking, frequency tracking, and wellness scoring
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Sexual Function Tracking ====================

export interface NSFWSexualFunctionTracking {
  id: string
  user_id: string
  entry_date: string
  entry_time: string | null
  erectile_function_score: number | null
  erection_quality: 'none' | 'partial' | 'full' | 'rigid' | null
  erection_duration_minutes: number | null
  erection_stability: number | null
  stamina_minutes: number | null
  control_level: number | null
  recovery_time_minutes: number | null
  activity_type: 'solo' | 'partner' | 'both' | null
  partner_present: boolean | null
  environment: string | null
  factors_affecting: any
  notes: string | null
  created_at: string
  updated_at: string
}

export async function trackSexualFunction(
  entryDate: string,
  functionData: Partial<NSFWSexualFunctionTracking>
): Promise<NSFWSexualFunctionTracking | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to track function')
      return null
    }

    const { data, error } = await supabase
      .from('nsfw_sexual_function_tracking')
      .upsert({
        user_id: user.id,
        entry_date: entryDate,
        ...functionData
      }, {
        onConflict: 'user_id,entry_date'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error tracking function:', error)
      toast.error('Failed to track function')
      return null
    }

    toast.success('Function tracked!')
    return data as NSFWSexualFunctionTracking
  } catch (error) {
    logger.error('Error in trackSexualFunction:', error)
    return null
  }
}

export async function getSexualFunctionTracking(
  startDate?: string,
  endDate?: string
): Promise<NSFWSexualFunctionTracking[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('nsfw_sexual_function_tracking')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })

    if (startDate) {
      query = query.gte('entry_date', startDate)
    }
    if (endDate) {
      query = query.lte('entry_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching function tracking:', error)
      return []
    }

    return (data || []) as NSFWSexualFunctionTracking[]
  } catch (error) {
    logger.error('Error in getSexualFunctionTracking:', error)
    return []
  }
}

// ==================== Libido Tracking ====================

export interface NSFWLibidoTracking {
  id: string
  user_id: string
  entry_date: string
  libido_level: number
  libido_direction: 'increasing' | 'stable' | 'decreasing' | null
  contributing_factors: any
  inhibiting_factors: any
  desire_frequency: 'multiple_daily' | 'daily' | 'few_times_week' | 'weekly' | 'less_often' | null
  desire_intensity: number | null
  notes: string | null
  created_at: string
}

export async function trackLibido(
  entryDate: string,
  libidoLevel: number,
  libidoData: Partial<NSFWLibidoTracking>
): Promise<NSFWLibidoTracking | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to track libido')
      return null
    }

    const { data, error } = await supabase
      .from('nsfw_libido_tracking')
      .insert({
        user_id: user.id,
        entry_date: entryDate,
        libido_level: libidoLevel,
        ...libidoData
      })
      .select()
      .single()

    if (error) {
      logger.error('Error tracking libido:', error)
      toast.error('Failed to track libido')
      return null
    }

    toast.success('Libido tracked!')
    return data as NSFWLibidoTracking
  } catch (error) {
    logger.error('Error in trackLibido:', error)
    return null
  }
}

// ==================== Satisfaction Tracking ====================

export interface NSFWSatisfactionTracking {
  id: string
  user_id: string
  entry_date: string
  overall_satisfaction: number
  physical_satisfaction: number | null
  emotional_satisfaction: number | null
  partner_satisfaction: number | null
  mutual_satisfaction: number | null
  satisfaction_factors: any
  dissatisfaction_factors: any
  activity_type: string | null
  partner_present: boolean | null
  notes: string | null
  created_at: string
}

export async function trackSatisfaction(
  entryDate: string,
  overallSatisfaction: number,
  satisfactionData: Partial<NSFWSatisfactionTracking>
): Promise<NSFWSatisfactionTracking | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to track satisfaction')
      return null
    }

    const { data, error } = await supabase
      .from('nsfw_satisfaction_tracking')
      .insert({
        user_id: user.id,
        entry_date: entryDate,
        overall_satisfaction: overallSatisfaction,
        ...satisfactionData
      })
      .select()
      .single()

    if (error) {
      logger.error('Error tracking satisfaction:', error)
      toast.error('Failed to track satisfaction')
      return null
    }

    toast.success('Satisfaction tracked!')
    return data as NSFWSatisfactionTracking
  } catch (error) {
    logger.error('Error in trackSatisfaction:', error)
    return null
  }
}

// ==================== Frequency Tracking ====================

export interface NSFWFrequencyTracking {
  id: string
  user_id: string
  tracking_period_start: string
  tracking_period_end: string
  period_type: 'daily' | 'weekly' | 'monthly'
  solo_activity_count: number
  partner_activity_count: number
  total_activity_count: number
  average_per_week: number | null
  average_per_month: number | null
  frequency_trend: 'increasing' | 'stable' | 'decreasing' | 'fluctuating' | null
  trend_strength: number | null
  target_frequency_per_week: number | null
  goal_achieved: boolean
  created_at: string
}

export async function trackFrequency(
  periodStart: string,
  periodEnd: string,
  frequencyData: Partial<NSFWFrequencyTracking>
): Promise<NSFWFrequencyTracking | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to track frequency')
      return null
    }

    const { data, error } = await supabase
      .from('nsfw_frequency_tracking')
      .insert({
        user_id: user.id,
        tracking_period_start: periodStart,
        tracking_period_end: periodEnd,
        ...frequencyData
      })
      .select()
      .single()

    if (error) {
      logger.error('Error tracking frequency:', error)
      toast.error('Failed to track frequency')
      return null
    }

    toast.success('Frequency tracked!')
    return data as NSFWFrequencyTracking
  } catch (error) {
    logger.error('Error in trackFrequency:', error)
    return null
  }
}

// ==================== Wellness Scores ====================

export interface NSFWWellnessScore {
  id: string
  user_id: string
  calculation_date: string
  calculation_period_days: number
  overall_wellness_score: number
  function_score: number | null
  libido_score: number | null
  satisfaction_score: number | null
  frequency_score: number | null
  relationship_score: number | null
  score_trend: 'improving' | 'stable' | 'declining' | 'fluctuating' | null
  score_change: number | null
  insights: string[] | null
  recommendations: string[] | null
  calculated_at: string
  created_at: string
}

export async function calculateWellnessScore(
  calculationPeriodDays: number = 30
): Promise<NSFWWellnessScore | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to calculate wellness score')
      return null
    }

    // Call wellness score calculation Edge Function
    const { data, error } = await supabase.functions.invoke('calculate-nsfw-wellness-score', {
      body: {
        calculation_period_days: calculationPeriodDays
      }
    })

    if (error) {
      logger.error('Error calculating wellness score:', error)
      toast.error('Failed to calculate wellness score')
      return null
    }

    // Save score
    const { data: score, error: saveError } = await supabase
      .from('nsfw_wellness_scores')
      .insert({
        user_id: user.id,
        calculation_date: new Date().toISOString().split('T')[0],
        calculation_period_days,
        ...data
      })
      .select()
      .single()

    if (saveError) {
      logger.error('Error saving wellness score:', saveError)
      return null
    }

    return score as NSFWWellnessScore
  } catch (error) {
    logger.error('Error in calculateWellnessScore:', error)
    return null
  }
}

export async function getWellnessScores(): Promise<NSFWWellnessScore[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('nsfw_wellness_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('calculated_at', { ascending: false })

    if (error) {
      logger.error('Error fetching wellness scores:', error)
      return []
    }

    return (data || []) as NSFWWellnessScore[]
  } catch (error) {
    logger.error('Error in getWellnessScores:', error)
    return []
  }
}

