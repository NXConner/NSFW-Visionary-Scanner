/**
 * AI-Powered Health Insights
 * Daily insights, pattern recognition, predictions, and personalized recommendations
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface DailyInsight {
  id: string
  user_id: string
  insight_date: string
  insight_type: 'pattern' | 'prediction' | 'recommendation' | 'warning' | 'celebration'
  title: string
  content: string
  category: 'prostate' | 'testicular' | 'sexual' | 'urinary' | 'general' | 'routine'
  confidence: number
  actionable: boolean
  action_items: string[]
  is_read: boolean
  created_at: string
}

export interface HealthPattern {
  pattern_type: string
  description: string
  confidence: number
  affected_metrics: string[]
  timeframe: string
  recommendation: string
}

export interface HealthPrediction {
  metric: string
  current_value: number
  predicted_value: number
  timeframe: string
  confidence: number
  factors: string[]
}

/**
 * Get daily health insights
 */
export async function getDailyInsights(date?: string): Promise<DailyInsight[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const targetDate = date || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('daily_health_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('insight_date', targetDate)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching daily insights:', error)
      return []
    }

    return (data || []) as DailyInsight[]
  } catch (error) {
    logger.error('Error getting daily insights:', error)
    return []
  }
}

/**
 * Generate daily insights (called by backend/cron)
 */
export async function generateDailyInsights(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Call Edge Function to generate insights
    const { error } = await supabase.functions.invoke('generate-health-insights', {
      body: { user_id: user.id }
    })

    if (error) {
      logger.error('Error generating insights:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in generateDailyInsights:', error)
    return false
  }
}

/**
 * Get health patterns
 */
export async function getHealthPatterns(): Promise<HealthPattern[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Call Edge Function to analyze patterns
    const { data, error } = await supabase.functions.invoke('analyze-health-patterns', {
      body: { user_id: user.id }
    })

    if (error) {
      logger.error('Error analyzing patterns:', error)
      return []
    }

    return (data?.patterns || []) as HealthPattern[]
  } catch (error) {
    logger.error('Error getting health patterns:', error)
    return []
  }
}

/**
 * Get health predictions
 */
export async function getHealthPredictions(
  timeframe: '1_month' | '3_months' | '6_months' | '1_year' = '6_months'
): Promise<HealthPrediction[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Call Edge Function to generate predictions
    const { data, error } = await supabase.functions.invoke('predict-health-trends', {
      body: {
        user_id: user.id,
        timeframe
      }
    })

    if (error) {
      logger.error('Error generating predictions:', error)
      return []
    }

    return (data?.predictions || []) as HealthPrediction[]
  } catch (error) {
    logger.error('Error getting health predictions:', error)
    return []
  }
}

/**
 * Ask AI about progress
 */
export async function askAIAboutProgress(question: string): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to use AI insights')
      return null
    }

    // Get user's health data
    const [prostate, testicular, sexual, urinary, wellness] = await Promise.all([
      getProstate(30),
      getTesticular(30),
      getSexual(30),
      getUrinary(30),
      getWellness(30)
    ])

    // Call Edge Function with context
    const { data, error } = await supabase.functions.invoke('ai-progress-analysis', {
      body: {
        user_id: user.id,
        question,
        context: {
          prostate_health: prostate.slice(0, 5),
          testicular_health: testicular.slice(0, 5),
          sexual_health: sexual.slice(0, 5),
          urinary_health: urinary.slice(0, 5),
          wellness_scores: wellness.slice(0, 5)
        }
      }
    })

    if (error) {
      logger.error('Error asking AI about progress:', error)
      toast.error('Failed to get AI response')
      return null
    }

    return data?.response || null
  } catch (error) {
    logger.error('Error in askAIAboutProgress:', error)
    return null
  }
}

/**
 * Mark insight as read
 */
export async function markInsightRead(insightId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('daily_health_insights')
      .update({ is_read: true })
      .eq('id', insightId)

    if (error) {
      logger.error('Error marking insight as read:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in markInsightRead:', error)
    return false
  }
}

// Import health monitoring functions
async function getProstateHealthEntries(limit: number) {
  const { data } = await supabase
    .from('prostate_health')
    .select('*')
    .limit(limit)
  return data || []
}

async function getTesticularHealthEntries(limit: number) {
  const { data } = await supabase
    .from('testicular_health')
    .select('*')
    .limit(limit)
  return data || []
}

async function getSexualHealthEntries(limit: number) {
  const { data } = await supabase
    .from('sexual_health_metrics')
    .select('*')
    .limit(limit)
  return data || []
}

async function getUrinaryHealthEntries(limit: number) {
  const { data } = await supabase
    .from('urinary_health')
    .select('*')
    .limit(limit)
  return data || []
}

async function getWellnessScores(limit: number) {
  const { data } = await supabase
    .from('sexual_wellness_scores')
    .select('*')
    .limit(limit)
  return data || []
}

