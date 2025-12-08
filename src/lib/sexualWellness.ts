/**
 * Sexual Wellness Tracking System
 * Manages sexual function, libido, satisfaction, frequency, and relationship health tracking
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'

export interface SexualWellnessEntry {
  id?: string
  user_id?: string
  entry_date: string
  
  // Sexual function metrics
  erectile_function_score?: number // 0-10
  ejaculation_quality_score?: number // 0-10
  orgasm_intensity_score?: number // 0-10
  stamina_duration_minutes?: number
  
  // Libido and desire
  libido_level?: number // 0-10
  desire_frequency?: 'daily' | 'few_times_week' | 'weekly' | 'few_times_month' | 'monthly' | 'rarely'
  morning_erections?: boolean
  
  // Satisfaction and experience
  overall_satisfaction?: number // 0-10
  partner_satisfaction?: number // 0-10
  sexual_confidence?: number // 0-10
  
  // Frequency tracking
  sexual_activity_count?: number
  masturbation_count?: number
  activity_type?: 'intercourse' | 'masturbation' | 'oral' | 'other' | 'none'
  
  // Relationship health (optional)
  relationship_satisfaction?: number // 0-10
  communication_quality?: number // 0-10
  intimacy_level?: number // 0-10
  
  // Contextual factors
  stress_level?: number // 0-10
  sleep_quality?: number // 0-10
  exercise_level?: 'none' | 'light' | 'moderate' | 'intense'
  alcohol_consumption?: 'none' | 'light' | 'moderate' | 'heavy'
  
  // Calculated
  wellness_score?: number // 0-100
  
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface SexualWellnessGoal {
  id?: string
  user_id?: string
  goal_type: 'erectile_function' | 'libido' | 'satisfaction' | 'frequency' | 'stamina' | 'confidence' | 'communication' | 'intimacy'
  target_value: number
  target_date?: string
  current_value?: number
  progress_percentage?: number
  is_active?: boolean
  completed_at?: string
  created_at?: string
  updated_at?: string
}

export interface SexualWellnessPattern {
  id?: string
  user_id?: string
  pattern_type: 'correlation' | 'trend' | 'anomaly' | 'improvement' | 'decline'
  pattern_description: string
  affected_metrics?: string[]
  correlation_factors?: string[]
  confidence_score?: number
  detected_at?: string
  acknowledged_at?: string
  created_at?: string
}

export interface PartnerConnection {
  id?: string
  user_id?: string
  partner_user_id?: string
  partner_email?: string
  connection_code: string
  connection_status?: 'pending' | 'active' | 'paused' | 'disconnected'
  share_wellness_data?: boolean
  share_goals?: boolean
  share_insights?: boolean
  connected_at?: string
  created_at?: string
  updated_at?: string
}

/**
 * Create or update a sexual wellness entry
 */
export async function upsertSexualWellnessEntry(
  entry: Omit<SexualWellnessEntry, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'wellness_score'>
): Promise<SexualWellnessEntry> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('sexual_wellness_entries')
      .upsert({
        ...entry,
        user_id: user.id,
      }, {
        onConflict: 'user_id,entry_date',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Sexual wellness entry upserted', { entryId: data.id, entryDate: entry.entry_date })
    return data
  } catch (error) {
    logger.error('Failed to upsert sexual wellness entry', { error, entry })
    throw error
  }
}

/**
 * Get sexual wellness entries for a date range
 */
export async function getSexualWellnessEntries(
  startDate?: string,
  endDate?: string
): Promise<SexualWellnessEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('sexual_wellness_entries')
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

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get sexual wellness entries', { error })
    throw error
  }
}

/**
 * Get latest sexual wellness entry
 */
export async function getLatestSexualWellnessEntry(): Promise<SexualWellnessEntry | null> {
  try {
    const entries = await getSexualWellnessEntries()
    return entries.length > 0 ? entries[0] : null
  } catch (error) {
    logger.error('Failed to get latest sexual wellness entry', { error })
    return null
  }
}

/**
 * Delete a sexual wellness entry
 */
export async function deleteSexualWellnessEntry(entryId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('sexual_wellness_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id)

    if (error) throw error
    logger.info('Sexual wellness entry deleted', { entryId })
  } catch (error) {
    logger.error('Failed to delete sexual wellness entry', { error, entryId })
    throw error
  }
}

/**
 * Create a sexual wellness goal
 */
export async function createSexualWellnessGoal(
  goal: Omit<SexualWellnessGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'current_value' | 'progress_percentage'>
): Promise<SexualWellnessGoal> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('sexual_wellness_goals')
      .insert({
        ...goal,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Sexual wellness goal created', { goalId: data.id, goalType: goal.goal_type })
    return data
  } catch (error) {
    logger.error('Failed to create sexual wellness goal', { error, goal })
    throw error
  }
}

/**
 * Get sexual wellness goals
 */
export async function getSexualWellnessGoals(activeOnly: boolean = true): Promise<SexualWellnessGoal[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('sexual_wellness_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get sexual wellness goals', { error })
    throw error
  }
}

/**
 * Update a sexual wellness goal
 */
export async function updateSexualWellnessGoal(
  goalId: string,
  updates: Partial<SexualWellnessGoal>
): Promise<SexualWellnessGoal> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('sexual_wellness_goals')
      .update(updates)
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    logger.info('Sexual wellness goal updated', { goalId })
    return data
  } catch (error) {
    logger.error('Failed to update sexual wellness goal', { error, goalId, updates })
    throw error
  }
}

/**
 * Delete a sexual wellness goal
 */
export async function deleteSexualWellnessGoal(goalId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('sexual_wellness_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id)

    if (error) throw error
    logger.info('Sexual wellness goal deleted', { goalId })
  } catch (error) {
    logger.error('Failed to delete sexual wellness goal', { error, goalId })
    throw error
  }
}

/**
 * Get sexual wellness patterns (AI-generated insights)
 */
export async function getSexualWellnessPatterns(
  unacknowledgedOnly: boolean = false
): Promise<SexualWellnessPattern[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('sexual_wellness_patterns')
      .select('*')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: false })

    if (unacknowledgedOnly) {
      query = query.is('acknowledged_at', null)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get sexual wellness patterns', { error })
    throw error
  }
}

/**
 * Acknowledge a sexual wellness pattern
 */
export async function acknowledgeSexualWellnessPattern(patternId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('sexual_wellness_patterns')
      .update({ acknowledged_at: new Date().toISOString() })
      .eq('id', patternId)
      .eq('user_id', user.id)

    if (error) throw error
    logger.info('Sexual wellness pattern acknowledged', { patternId })
  } catch (error) {
    logger.error('Failed to acknowledge sexual wellness pattern', { error, patternId })
    throw error
  }
}

/**
 * Get sexual wellness statistics
 */
export async function getSexualWellnessStatistics(
  startDate?: string,
  endDate?: string
): Promise<{
  averageWellnessScore: number
  averageErectileFunction: number
  averageLibido: number
  averageSatisfaction: number
  averageConfidence: number
  totalActivities: number
  trend: 'improving' | 'declining' | 'stable'
}> {
  try {
    const entries = await getSexualWellnessEntries(startDate, endDate)
    
    if (entries.length === 0) {
      return {
        averageWellnessScore: 0,
        averageErectileFunction: 0,
        averageLibido: 0,
        averageSatisfaction: 0,
        averageConfidence: 0,
        totalActivities: 0,
        trend: 'stable'
      }
    }

    const scores = entries
      .filter(e => e.wellness_score !== undefined)
      .map(e => e.wellness_score!)
    const wellnessScores = entries
      .filter(e => e.erectile_function_score !== undefined)
      .map(e => e.erectile_function_score!)
    const libidoScores = entries
      .filter(e => e.libido_level !== undefined)
      .map(e => e.libido_level!)
    const satisfactionScores = entries
      .filter(e => e.overall_satisfaction !== undefined)
      .map(e => e.overall_satisfaction!)
    const confidenceScores = entries
      .filter(e => e.sexual_confidence !== undefined)
      .map(e => e.sexual_confidence!)

    const average = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    const totalActivities = entries.reduce((sum, e) => sum + (e.sexual_activity_count || 0), 0)

    // Determine trend (comparing first half to second half)
    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    if (scores.length >= 4) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
      const secondHalf = scores.slice(Math.floor(scores.length / 2))
      const firstAvg = average(firstHalf)
      const secondAvg = average(secondHalf)
      
      if (secondAvg > firstAvg + 2) trend = 'improving'
      else if (secondAvg < firstAvg - 2) trend = 'declining'
    }

    return {
      averageWellnessScore: average(scores),
      averageErectileFunction: average(wellnessScores),
      averageLibido: average(libidoScores),
      averageSatisfaction: average(satisfactionScores),
      averageConfidence: average(confidenceScores),
      totalActivities,
      trend
    }
  } catch (error) {
    logger.error('Failed to get sexual wellness statistics', { error })
    throw error
  }
}

/**
 * Create a partner connection
 */
export async function createPartnerConnection(
  partnerEmail?: string
): Promise<PartnerConnection> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Generate unique connection code
    const connectionCode = `${user.id.slice(0, 8)}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

    const { data, error } = await supabase
      .from('partner_connections')
      .insert({
        user_id: user.id,
        partner_email: partnerEmail,
        connection_code: connectionCode,
        connection_status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Partner connection created', { connectionId: data.id, connectionCode })
    return data
  } catch (error) {
    logger.error('Failed to create partner connection', { error })
    throw error
  }
}

/**
 * Get partner connections
 */
export async function getPartnerConnections(): Promise<PartnerConnection[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('partner_connections')
      .select('*')
      .or(`user_id.eq.${user.id},partner_user_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get partner connections', { error })
    throw error
  }
}

