/**
 * Achievement System
 * Handles achievements, badges, streaks, milestones, and leaderboards
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface AchievementDefinition {
  id: string
  code: string
  name: string
  description: string
  category: 'consistency' | 'progress' | 'health' | 'community' | 'premium' | 'special'
  icon_name: string | null
  badge_color: string
  requirement_type: 'streak' | 'count' | 'milestone' | 'custom'
  requirement_value: number | null
  requirement_data: Record<string, any> | null
  points: number
  is_premium: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  progress: number
  is_unlocked: boolean
  unlocked_at: string | null
  progress_data: Record<string, any> | null
  created_at: string
  updated_at: string
  achievement?: AchievementDefinition
}

export interface UserStreak {
  id: string
  user_id: string
  streak_type: 'scan' | 'routine' | 'diary' | 'education' | 'community'
  current_streak: number
  longest_streak: number
  last_activity_date: string | null
  streak_start_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserMilestone {
  id: string
  user_id: string
  milestone_type: 'scan_count' | 'routine_count' | 'diary_count' | 'days_active' | 'measurement_growth' | 'custom'
  milestone_value: number
  achieved_at: string
  milestone_data: Record<string, any> | null
  created_at: string
}

/**
 * Get all achievement definitions
 */
export async function getAchievementDefinitions(): Promise<AchievementDefinition[]> {
  try {
    const { data, error } = await supabase
      .from('achievement_definitions')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('points', { ascending: false })

    if (error) {
      logger.error('Error fetching achievement definitions:', error)
      return []
    }

    return (data || []) as AchievementDefinition[]
  } catch (error) {
    logger.error('Error getting achievement definitions:', error)
    return []
  }
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(): Promise<UserAchievement[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievement_definitions(*)
      `)
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false, nullsFirst: false })
      .order('progress', { ascending: false })

    if (error) {
      logger.error('Error fetching user achievements:', error)
      return []
    }

    return (data || []) as UserAchievement[]
  } catch (error) {
    logger.error('Error getting user achievements:', error)
    return []
  }
}

/**
 * Check and update achievement progress
 */
export async function checkAchievementProgress(
  achievementCode: string,
  progressIncrement: number = 1
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase.rpc('check_achievement_progress', {
      p_user_id: user.id,
      p_achievement_code: achievementCode,
      p_progress_increment: progressIncrement
    })

    if (error) {
      logger.error('Error checking achievement progress:', error)
      return false
    }

    // If achievement was unlocked, show celebration
    if (data) {
      const achievement = await getAchievementByCode(achievementCode)
      if (achievement) {
        toast.success(`🎉 Achievement Unlocked: ${achievement.name}!`, {
          description: achievement.description,
          duration: 5000
        })
      }
    }

    return data || false
  } catch (error) {
    logger.error('Error in checkAchievementProgress:', error)
    return false
  }
}

/**
 * Get achievement by code
 */
export async function getAchievementByCode(code: string): Promise<AchievementDefinition | null> {
  try {
    const { data, error } = await supabase
      .from('achievement_definitions')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return null
    }

    return data as AchievementDefinition
  } catch (error) {
    logger.error('Error getting achievement by code:', error)
    return null
  }
}

/**
 * Update streak
 */
export async function updateStreak(streakType: UserStreak['streak_type']): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data, error } = await supabase.rpc('update_streak', {
      p_user_id: user.id,
      p_streak_type: streakType
    })

    if (error) {
      logger.error('Error updating streak:', error)
      return 0
    }

    // Check streak-based achievements
    if (data) {
      await checkAchievementProgress(`streak_${streakType}_${data}`, 0)
      await checkAchievementProgress(`streak_${streakType}_7`, 0)
      await checkAchievementProgress(`streak_${streakType}_30`, 0)
      await checkAchievementProgress(`streak_${streakType}_100`, 0)
    }

    return data || 0
  } catch (error) {
    logger.error('Error in updateStreak:', error)
    return 0
  }
}

/**
 * Get user streaks
 */
export async function getUserStreaks(): Promise<UserStreak[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('current_streak', { ascending: false })

    if (error) {
      logger.error('Error fetching user streaks:', error)
      return []
    }

    return (data || []) as UserStreak[]
  } catch (error) {
    logger.error('Error getting user streaks:', error)
    return []
  }
}

/**
 * Record milestone
 */
export async function recordMilestone(
  milestoneType: UserMilestone['milestone_type'],
  milestoneValue: number,
  milestoneData?: Record<string, any>
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Check if milestone already recorded
    const { data: existing } = await supabase
      .from('user_milestones')
      .select('id')
      .eq('user_id', user.id)
      .eq('milestone_type', milestoneType)
      .eq('milestone_value', milestoneValue)
      .single()

    if (existing) {
      return false // Already recorded
    }

    const { error } = await supabase
      .from('user_milestones')
      .insert({
        user_id: user.id,
        milestone_type: milestoneType,
        milestone_value: milestoneValue,
        milestone_data: milestoneData || null
      })

    if (error) {
      logger.error('Error recording milestone:', error)
      return false
    }

    // Check milestone-based achievements
    await checkAchievementProgress(`milestone_${milestoneType}_${milestoneValue}`, 0)

    toast.success(`🎯 Milestone Achieved: ${milestoneType} - ${milestoneValue}!`)
    return true
  } catch (error) {
    logger.error('Error in recordMilestone:', error)
    return false
  }
}

/**
 * Get user milestones
 */
export async function getUserMilestones(): Promise<UserMilestone[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('user_milestones')
      .select('*')
      .eq('user_id', user.id)
      .order('achieved_at', { ascending: false })

    if (error) {
      logger.error('Error fetching user milestones:', error)
      return []
    }

    return (data || []) as UserMilestone[]
  } catch (error) {
    logger.error('Error getting user milestones:', error)
    return []
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  leaderboardType: 'achievements' | 'streaks' | 'progress' | 'community',
  period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time',
  limit: number = 100
): Promise<Array<{
  display_name: string
  score: number
  rank: number
}>> {
  try {
    const { data, error } = await supabase
      .from('leaderboards')
      .select('display_name, score, rank')
      .eq('leaderboard_type', leaderboardType)
      .eq('period', period)
      .order('rank', { ascending: true })
      .limit(limit)

    if (error) {
      logger.error('Error fetching leaderboard:', error)
      return []
    }

    return (data || []) as Array<{ display_name: string; score: number; rank: number }>
  } catch (error) {
    logger.error('Error getting leaderboard:', error)
    return []
  }
}

/**
 * Opt-in to leaderboard
 */
export async function optInToLeaderboard(
  leaderboardType: 'achievements' | 'streaks' | 'progress' | 'community',
  isAnonymous: boolean = true,
  displayName?: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('leaderboards')
      .upsert({
        user_id: user.id,
        leaderboard_type: leaderboardType,
        is_anonymous: isAnonymous,
        display_name: displayName || `User${user.id.slice(0, 8)}`,
        period: 'all_time',
        score: 0
      }, {
        onConflict: 'user_id,leaderboard_type,period'
      })

    if (error) {
      logger.error('Error opting in to leaderboard:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in optInToLeaderboard:', error)
    return false
  }
}

/**
 * Get achievement statistics
 */
export async function getAchievementStats(): Promise<{
  total_achievements: number
  unlocked_achievements: number
  total_points: number
  completion_percentage: number
  recent_unlocks: UserAchievement[]
}> {
  try {
    const achievements = await getUserAchievements()
    const definitions = await getAchievementDefinitions()

    const unlocked = achievements.filter(a => a.is_unlocked)
    const totalPoints = unlocked.reduce((sum, a) => sum + (a.achievement?.points || 0), 0)

    return {
      total_achievements: definitions.length,
      unlocked_achievements: unlocked.length,
      total_points: totalPoints,
      completion_percentage: definitions.length > 0 ? (unlocked.length / definitions.length) * 100 : 0,
      recent_unlocks: unlocked
        .filter(a => a.unlocked_at)
        .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
        .slice(0, 5)
    }
  } catch (error) {
    logger.error('Error getting achievement stats:', error)
    return {
      total_achievements: 0,
      unlocked_achievements: 0,
      total_points: 0,
      completion_percentage: 0,
      recent_unlocks: []
    }
  }
}

