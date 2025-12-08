/**
 * Progress Sharing & Challenges System
 * Manages anonymous progress sharing, challenges, leaderboards, and community engagement
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface ProgressShare {
  id?: string
  user_id?: string
  share_type: 'scan' | 'wellness' | 'routine' | 'achievement' | 'milestone' | 'general'
  content_type: 'text' | 'image' | 'chart' | 'metric'
  title?: string
  description?: string
  content_data?: any
  is_anonymous?: boolean
  display_name?: string
  like_count?: number
  comment_count?: number
  view_count?: number
  share_count?: number
  is_approved?: boolean
  is_featured?: boolean
  created_at?: string
  updated_at?: string
}

export interface Challenge {
  id?: string
  name: string
  description: string
  challenge_type: '30_day' | '60_day' | '90_day' | 'custom' | 'community' | 'premium'
  duration_days: number
  goal_description?: string
  target_metrics?: any
  success_criteria?: any
  start_date?: string
  end_date?: string
  is_active?: boolean
  is_recurring?: boolean
  participant_count?: number
  completion_count?: number
  is_featured?: boolean
  is_premium?: boolean
  reward_description?: string
  badge_id?: string
  created_at?: string
  updated_at?: string
}

export interface ChallengeParticipant {
  id?: string
  challenge_id: string
  user_id?: string
  status?: 'active' | 'completed' | 'abandoned' | 'paused'
  progress_percentage?: number
  current_metrics?: any
  started_at?: string
  completed_at?: string
  last_activity_at?: string
}

export interface ChallengeCheckin {
  id?: string
  participant_id: string
  checkin_date: string
  metrics?: any
  notes?: string
  photo_url?: string
  created_at?: string
}

export interface Leaderboard {
  id?: string
  name: string
  description?: string
  leaderboard_type: 'challenge' | 'overall' | 'monthly' | 'all_time' | 'category'
  metric_type: 'wellness_score' | 'streak' | 'achievements' | 'challenge_completion' | 'reputation' | 'custom'
  period_start?: string
  period_end?: string
  is_active?: boolean
  is_anonymous?: boolean
  requires_opt_in?: boolean
  created_at?: string
  updated_at?: string
}

export interface LeaderboardEntry {
  id?: string
  leaderboard_id: string
  user_id?: string
  rank?: number
  score?: number
  display_name?: string
  is_anonymous?: boolean
  metrics?: any
  updated_at?: string
}

/**
 * Share progress
 */
export async function shareProgress(
  share: Omit<ProgressShare, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'like_count' | 'comment_count' | 'view_count' | 'share_count' | 'is_approved' | 'is_featured'>
): Promise<ProgressShare> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('progress_shares')
      .insert({
        ...share,
        user_id: share.is_anonymous ? null : user.id,
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Progress shared', { shareId: data.id })
    return data
  } catch (error) {
    logger.error('Failed to share progress', { error, share })
    throw error
  }
}

/**
 * Get progress shares
 */
export async function getProgressShares(
  shareType?: string,
  limit: number = 20
): Promise<ProgressShare[]> {
  try {
    let query = supabase
      .from('progress_shares')
      .select('*')
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (shareType) {
      query = query.eq('share_type', shareType)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get progress shares', { error })
    throw error
  }
}

/**
 * Like or interact with a progress share
 */
export async function interactWithProgressShare(
  shareId: string,
  interactionType: 'like' | 'comment' | 'share',
  commentText?: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if interaction exists
    const { data: existing } = await supabase
      .from('progress_share_interactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('share_id', shareId)
      .eq('interaction_type', interactionType)
      .single()

    if (existing) {
      // Remove interaction (toggle off)
      await supabase
        .from('progress_share_interactions')
        .delete()
        .eq('id', existing.id)
    } else {
      // Add interaction
      await supabase
        .from('progress_share_interactions')
        .insert({
          user_id: user.id,
          share_id: shareId,
          interaction_type: interactionType,
          comment_text: commentText,
        })
    }
  } catch (error) {
    logger.error('Failed to interact with progress share', { error, shareId, interactionType })
    throw error
  }
}

/**
 * Get active challenges
 */
export async function getActiveChallenges(): Promise<Challenge[]> {
  try {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('start_date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get active challenges', { error })
    throw error
  }
}

/**
 * Join a challenge
 */
export async function joinChallenge(challengeId: string): Promise<ChallengeParticipant> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: user.id,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Joined challenge', { challengeId, participantId: data.id })
    return data
  } catch (error) {
    logger.error('Failed to join challenge', { error, challengeId })
    throw error
  }
}

/**
 * Get user's challenge participations
 */
export async function getUserChallenges(): Promise<ChallengeParticipant[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get user challenges', { error })
    throw error
  }
}

/**
 * Submit challenge check-in
 */
export async function submitChallengeCheckin(
  participantId: string,
  checkin: Omit<ChallengeCheckin, 'id' | 'participant_id' | 'created_at'>
): Promise<ChallengeCheckin> {
  try {
    const { data, error } = await supabase
      .from('challenge_checkins')
      .insert({
        ...checkin,
        participant_id: participantId,
      })
      .select()
      .single()

    if (error) throw error

    // Update participant last activity
    await supabase
      .from('challenge_participants')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', participantId)

    logger.info('Challenge check-in submitted', { participantId })
    return data
  } catch (error) {
    logger.error('Failed to submit challenge check-in', { error, participantId })
    throw error
  }
}

/**
 * Get leaderboards
 */
export async function getLeaderboards(
  leaderboardType?: string
): Promise<Leaderboard[]> {
  try {
    let query = supabase
      .from('leaderboards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (leaderboardType) {
      query = query.eq('leaderboard_type', leaderboardType)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get leaderboards', { error })
    throw error
  }
}

/**
 * Get leaderboard entries
 */
export async function getLeaderboardEntries(
  leaderboardId: string,
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('leaderboard_id', leaderboardId)
      .order('rank', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get leaderboard entries', { error, leaderboardId })
    throw error
  }
}

/**
 * Opt into leaderboard
 */
export async function optIntoLeaderboard(leaderboardId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // This would calculate user's score and add them to leaderboard
    // Implementation depends on metric_type
    toast.info('Leaderboard opt-in feature coming soon')
  } catch (error) {
    logger.error('Failed to opt into leaderboard', { error, leaderboardId })
    throw error
  }
}

