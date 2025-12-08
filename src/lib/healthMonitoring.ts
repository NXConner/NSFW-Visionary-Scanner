/**
 * Comprehensive Health Monitoring System
 * Handles prostate, testicular, sexual health, hormone, and urinary tracking
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface ProstateHealthEntry {
  id: string
  user_id: string
  entry_date: string
  psa_level: number | null
  symptoms: string[]
  pain_level: number | null
  urination_frequency: number | null
  urination_difficulty: 'none' | 'mild' | 'moderate' | 'severe' | null
  blood_in_urine: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TesticularHealthEntry {
  id: string
  user_id: string
  entry_date: string
  self_exam_performed: boolean
  abnormalities_found: boolean
  abnormality_description: string | null
  pain_level: number | null
  swelling: boolean
  lumps_detected: boolean
  size_changes: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SexualHealthEntry {
  id: string
  user_id: string
  entry_date: string
  erectile_function_score: number | null
  libido_level: number | null
  satisfaction_level: number | null
  frequency_per_week: number | null
  orgasm_quality: number | null
  premature_ejaculation: boolean
  delayed_ejaculation: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface HormoneLevel {
  id: string
  user_id: string
  test_date: string
  testosterone_total: number | null
  testosterone_free: number | null
  lh: number | null
  fsh: number | null
  prolactin: number | null
  shbg: number | null
  notes: string | null
  lab_name: string | null
  created_at: string
  updated_at: string
}

export interface UrinaryHealthEntry {
  id: string
  user_id: string
  entry_date: string
  frequency_per_day: number | null
  urgency_level: number | null
  nocturia_count: number | null
  incontinence: boolean
  incontinence_type: 'stress' | 'urge' | 'overflow' | 'functional' | 'mixed' | null
  stream_strength: number | null
  incomplete_emptying: boolean
  pain_on_urination: boolean
  blood_in_urine: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SexualWellnessScore {
  id: string
  user_id: string
  entry_date: string
  overall_score: number
  physical_score: number
  emotional_score: number
  relationship_score: number
  factors: Record<string, any> | null
  created_at: string
}

export interface HealthRiskFactor {
  id: string
  user_id: string
  risk_type: 'prostate' | 'testicular' | 'sexual' | 'urinary' | 'general'
  risk_level: 'low' | 'moderate' | 'high' | 'very_high'
  risk_factors: string[]
  recommendations: string[]
  assessed_at: string
  created_at: string
}

export interface HealthAlert {
  id: string
  user_id: string
  alert_type: 'warning' | 'caution' | 'info' | 'reminder'
  category: 'prostate' | 'testicular' | 'sexual' | 'urinary' | 'general'
  title: string
  message: string
  action_required: boolean
  action_url: string | null
  is_read: boolean
  created_at: string
  read_at: string | null
}

/**
 * Save prostate health entry
 */
export async function saveProstateHealthEntry(entry: Partial<ProstateHealthEntry>): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to save health data')
      return false
    }

    const { error } = await supabase
      .from('prostate_health')
      .upsert({
        user_id: user.id,
        entry_date: entry.entry_date || new Date().toISOString().split('T')[0],
        ...entry
      }, {
        onConflict: 'user_id,entry_date'
      })

    if (error) {
      logger.error('Error saving prostate health entry:', error)
      toast.error('Failed to save prostate health data')
      return false
    }

    toast.success('Prostate health data saved')
    return true
  } catch (error) {
    logger.error('Error in saveProstateHealthEntry:', error)
    return false
  }
}

/**
 * Get prostate health entries
 */
export async function getProstateHealthEntries(limit: number = 30): Promise<ProstateHealthEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('prostate_health')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching prostate health entries:', error)
      return []
    }

    return (data || []) as ProstateHealthEntry[]
  } catch (error) {
    logger.error('Error getting prostate health entries:', error)
    return []
  }
}

/**
 * Save testicular health entry
 */
export async function saveTesticularHealthEntry(entry: Partial<TesticularHealthEntry>): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to save health data')
      return false
    }

    const { error } = await supabase
      .from('testicular_health')
      .upsert({
        user_id: user.id,
        entry_date: entry.entry_date || new Date().toISOString().split('T')[0],
        ...entry
      }, {
        onConflict: 'user_id,entry_date'
      })

    if (error) {
      logger.error('Error saving testicular health entry:', error)
      toast.error('Failed to save testicular health data')
      return false
    }

    toast.success('Testicular health data saved')
    return true
  } catch (error) {
    logger.error('Error in saveTesticularHealthEntry:', error)
    return false
  }
}

/**
 * Get testicular health entries
 */
export async function getTesticularHealthEntries(limit: number = 30): Promise<TesticularHealthEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('testicular_health')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching testicular health entries:', error)
      return []
    }

    return (data || []) as TesticularHealthEntry[]
  } catch (error) {
    logger.error('Error getting testicular health entries:', error)
    return []
  }
}

/**
 * Save sexual health entry
 */
export async function saveSexualHealthEntry(entry: Partial<SexualHealthEntry>): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to save health data')
      return false
    }

    const { error } = await supabase
      .from('sexual_health_metrics')
      .upsert({
        user_id: user.id,
        entry_date: entry.entry_date || new Date().toISOString().split('T')[0],
        ...entry
      }, {
        onConflict: 'user_id,entry_date'
      })

    if (error) {
      logger.error('Error saving sexual health entry:', error)
      toast.error('Failed to save sexual health data')
      return false
    }

    // Calculate and save wellness score
    await calculateWellnessScore(entry)

    toast.success('Sexual health data saved')
    return true
  } catch (error) {
    logger.error('Error in saveSexualHealthEntry:', error)
    return false
  }
}

/**
 * Get sexual health entries
 */
export async function getSexualHealthEntries(limit: number = 30): Promise<SexualHealthEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('sexual_health_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching sexual health entries:', error)
      return []
    }

    return (data || []) as SexualHealthEntry[]
  } catch (error) {
    logger.error('Error getting sexual health entries:', error)
    return []
  }
}

/**
 * Calculate wellness score
 */
async function calculateWellnessScore(entry: Partial<SexualHealthEntry>): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const physicalScore = entry.erectile_function_score || 0
    const emotionalScore = entry.satisfaction_level || 0
    const relationshipScore = entry.satisfaction_level || 0
    const overallScore = Math.round((physicalScore + emotionalScore + relationshipScore) / 3 * 10)

    await supabase
      .from('sexual_wellness_scores')
      .upsert({
        user_id: user.id,
        entry_date: entry.entry_date || new Date().toISOString().split('T')[0],
        overall_score: overallScore,
        physical_score: physicalScore * 10,
        emotional_score: emotionalScore * 10,
        relationship_score: relationshipScore * 10,
        factors: entry
      }, {
        onConflict: 'user_id,entry_date'
      })
  } catch (error) {
    logger.error('Error calculating wellness score:', error)
  }
}

/**
 * Get wellness scores
 */
export async function getWellnessScores(limit: number = 30): Promise<SexualWellnessScore[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('sexual_wellness_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching wellness scores:', error)
      return []
    }

    return (data || []) as SexualWellnessScore[]
  } catch (error) {
    logger.error('Error getting wellness scores:', error)
    return []
  }
}

/**
 * Save hormone levels
 */
export async function saveHormoneLevels(levels: Partial<HormoneLevel>): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to save health data')
      return false
    }

    const { error } = await supabase
      .from('hormone_levels')
      .insert({
        user_id: user.id,
        ...levels
      })

    if (error) {
      logger.error('Error saving hormone levels:', error)
      toast.error('Failed to save hormone levels')
      return false
    }

    toast.success('Hormone levels saved')
    return true
  } catch (error) {
    logger.error('Error in saveHormoneLevels:', error)
    return false
  }
}

/**
 * Get hormone levels
 */
export async function getHormoneLevels(limit: number = 10): Promise<HormoneLevel[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('hormone_levels')
      .select('*')
      .eq('user_id', user.id)
      .order('test_date', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching hormone levels:', error)
      return []
    }

    return (data || []) as HormoneLevel[]
  } catch (error) {
    logger.error('Error getting hormone levels:', error)
    return []
  }
}

/**
 * Save urinary health entry
 */
export async function saveUrinaryHealthEntry(entry: Partial<UrinaryHealthEntry>): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to save health data')
      return false
    }

    const { error } = await supabase
      .from('urinary_health')
      .upsert({
        user_id: user.id,
        entry_date: entry.entry_date || new Date().toISOString().split('T')[0],
        ...entry
      }, {
        onConflict: 'user_id,entry_date'
      })

    if (error) {
      logger.error('Error saving urinary health entry:', error)
      toast.error('Failed to save urinary health data')
      return false
    }

    toast.success('Urinary health data saved')
    return true
  } catch (error) {
    logger.error('Error in saveUrinaryHealthEntry:', error)
    return false
  }
}

/**
 * Get urinary health entries
 */
export async function getUrinaryHealthEntries(limit: number = 30): Promise<UrinaryHealthEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('urinary_health')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching urinary health entries:', error)
      return []
    }

    return (data || []) as UrinaryHealthEntry[]
  } catch (error) {
    logger.error('Error getting urinary health entries:', error)
    return []
  }
}

/**
 * Get health alerts
 */
export async function getHealthAlerts(unreadOnly: boolean = false): Promise<HealthAlert[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('health_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching health alerts:', error)
      return []
    }

    return (data || []) as HealthAlert[]
  } catch (error) {
    logger.error('Error getting health alerts:', error)
    return []
  }
}

/**
 * Mark health alert as read
 */
export async function markHealthAlertRead(alertId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('health_alerts')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', alertId)

    if (error) {
      logger.error('Error marking alert as read:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in markHealthAlertRead:', error)
    return false
  }
}

/**
 * Get health risk factors
 */
export async function getHealthRiskFactors(): Promise<HealthRiskFactor[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('health_risk_factors')
      .select('*')
      .eq('user_id', user.id)
      .order('assessed_at', { ascending: false })

    if (error) {
      logger.error('Error fetching risk factors:', error)
      return []
    }

    return (data || []) as HealthRiskFactor[]
  } catch (error) {
    logger.error('Error getting risk factors:', error)
    return []
  }
}

