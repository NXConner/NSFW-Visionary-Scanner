/**
 * Habit Tracker System
 * Manages daily habit tracking, streaks, reminders, analytics, and PE routine integration
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'

export interface HabitDefinition {
  id?: string
  user_id?: string
  name: string
  description?: string
  category?: 'pe_routine' | 'health' | 'wellness' | 'lifestyle' | 'custom'
  frequency: 'daily' | 'weekly' | 'custom'
  target_value?: number
  unit?: string
  reminder_enabled?: boolean
  reminder_times?: string[]
  reminder_days?: number[]
  linked_routine_id?: string
  linked_feature?: string
  color?: string
  icon?: string
  order_index?: number
  is_active?: boolean
  is_template?: boolean
  created_at?: string
  updated_at?: string
}

export interface UserHabit {
  id?: string
  user_id?: string
  habit_definition_id: string
  custom_name?: string
  custom_target_value?: number
  is_active?: boolean
  started_at?: string
  paused_at?: string
  archived_at?: string
  current_streak?: number
  longest_streak?: number
  total_completions?: number
  completion_rate?: number
  created_at?: string
  updated_at?: string
}

export interface HabitEntry {
  id?: string
  user_habit_id: string
  entry_date: string
  completed_value?: number
  target_value?: number
  notes?: string
  mood?: 'great' | 'good' | 'okay' | 'difficult' | 'skipped'
  difficulty_rating?: number
  duration_minutes?: number
  completed_at?: string
  created_at?: string
  updated_at?: string
}

export interface HabitStreak {
  id?: string
  user_habit_id: string
  streak_start_date: string
  streak_end_date?: string
  streak_length?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface HabitTemplate {
  id?: string
  name: string
  description?: string
  category?: string
  frequency: string
  target_value?: number
  unit?: string
  icon?: string
  color?: string
  is_featured?: boolean
  usage_count?: number
  created_at?: string
}

/**
 * Get habit templates
 */
export async function getHabitTemplates(): Promise<HabitTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('habit_templates')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('usage_count', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get habit templates', { error })
    throw error
  }
}

/**
 * Create a habit from template or custom
 */
export async function createHabit(
  habit: Omit<HabitDefinition, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_template'>
): Promise<HabitDefinition> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('habit_definitions')
      .insert({
        ...habit,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Create user habit instance
    await supabase
      .from('user_habits')
      .insert({
        user_id: user.id,
        habit_definition_id: data.id,
      })

    logger.info('Habit created', { habitId: data.id })
    return data
  } catch (error) {
    logger.error('Failed to create habit', { error, habit })
    throw error
  }
}

/**
 * Get user's habits
 */
export async function getUserHabits(activeOnly: boolean = true): Promise<UserHabit[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('user_habits')
      .select(`
        *,
        habit_definition:habit_definitions(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get user habits', { error })
    throw error
  }
}

/**
 * Log habit entry (mark as completed)
 */
export async function logHabitEntry(
  userHabitId: string,
  entry: Omit<HabitEntry, 'id' | 'user_habit_id' | 'created_at' | 'updated_at' | 'completed_at'>
): Promise<HabitEntry> {
  try {
    const entryDate = entry.entry_date || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('habit_entries')
      .upsert({
        ...entry,
        user_habit_id: userHabitId,
        entry_date: entryDate,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_habit_id,entry_date',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Habit entry logged', { userHabitId, entryDate })
    return data
  } catch (error) {
    logger.error('Failed to log habit entry', { error, userHabitId })
    throw error
  }
}

/**
 * Get habit entries for a date range
 */
export async function getHabitEntries(
  userHabitId: string,
  startDate?: string,
  endDate?: string
): Promise<HabitEntry[]> {
  try {
    let query = supabase
      .from('habit_entries')
      .select('*')
      .eq('user_habit_id', userHabitId)
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
    logger.error('Failed to get habit entries', { error, userHabitId })
    throw error
  }
}

/**
 * Get today's habit status
 */
export async function getTodayHabitStatus(): Promise<{
  habits: UserHabit[]
  completed: string[]
  pending: string[]
}> {
  try {
    const habits = await getUserHabits()
    const today = new Date().toISOString().split('T')[0]
    
    const completed: string[] = []
    const pending: string[] = []

    for (const habit of habits) {
      const entries = await getHabitEntries(habit.id!, today, today)
      if (entries.length > 0) {
        completed.push(habit.id!)
      } else {
        pending.push(habit.id!)
      }
    }

    return { habits, completed, pending }
  } catch (error) {
    logger.error('Failed to get today habit status', { error })
    throw error
  }
}

/**
 * Get habit streaks
 */
export async function getHabitStreaks(userHabitId?: string): Promise<HabitStreak[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('habit_streaks')
      .select(`
        *,
        user_habit:user_habits!inner(
          id,
          user_id,
          habit_definition:habit_definitions(name, category)
        )
      `)
      .eq('user_habit.user_id', user.id)
      .order('streak_length', { ascending: false })

    if (userHabitId) {
      query = query.eq('user_habit_id', userHabitId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get habit streaks', { error })
    throw error
  }
}

/**
 * Update habit
 */
export async function updateHabit(
  habitId: string,
  updates: Partial<HabitDefinition>
): Promise<HabitDefinition> {
  try {
    const { data, error } = await supabase
      .from('habit_definitions')
      .update(updates)
      .eq('id', habitId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    logger.error('Failed to update habit', { error, habitId })
    throw error
  }
}

/**
 * Delete habit
 */
export async function deleteHabit(habitId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('habit_definitions')
      .delete()
      .eq('id', habitId)

    if (error) throw error
  } catch (error) {
    logger.error('Failed to delete habit', { error, habitId })
    throw error
  }
}

/**
 * Get habit analytics
 */
export async function getHabitAnalytics(
  userHabitId: string,
  daysBack: number = 30
): Promise<{
  completionRate: number
  totalEntries: number
  completedEntries: number
  currentStreak: number
  longestStreak: number
  averageValue: number
}> {
  try {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const entries = await getHabitEntries(userHabitId, startDate, endDate)
    const streaks = await getHabitStreaks(userHabitId)

    const completedEntries = entries.length
    const totalEntries = daysBack
    const completionRate = (completedEntries / totalEntries) * 100

    const currentStreak = streaks.find(s => s.is_active)?.streak_length || 0
    const longestStreak = Math.max(...streaks.map(s => s.streak_length || 0), 0)

    const averageValue = entries.length > 0
      ? entries.reduce((sum, e) => sum + (e.completed_value || 0), 0) / entries.length
      : 0

    return {
      completionRate,
      totalEntries,
      completedEntries,
      currentStreak,
      longestStreak,
      averageValue
    }
  } catch (error) {
    logger.error('Failed to get habit analytics', { error, userHabitId })
    throw error
  }
}


