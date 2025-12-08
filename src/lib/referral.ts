/**
 * Referral Program System
 * Handles referral code generation, tracking, rewards, and analytics
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface ReferralCode {
  id: string
  user_id: string
  code: string
  is_active: boolean
  usage_count: number
  max_uses: number | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface ReferralTracking {
  id: string
  referrer_id: string
  referred_id: string
  referral_code_id: string
  status: 'pending' | 'completed' | 'rewarded' | 'expired'
  reward_type: 'discount' | 'free_month' | 'credit' | 'badge' | null
  reward_value: number | null
  reward_applied: boolean
  referred_subscribed: boolean
  referred_subscription_tier: string | null
  created_at: string
  completed_at: string | null
  rewarded_at: string | null
}

export interface ReferralReward {
  id: string
  user_id: string
  referral_tracking_id: string
  reward_type: string
  reward_value: number
  reward_status: 'pending' | 'applied' | 'expired' | 'cancelled'
  expires_at: string | null
  applied_at: string | null
  created_at: string
}

export interface ReferralAnalytics {
  total_referrals: number
  completed_referrals: number
  pending_referrals: number
  total_rewards_earned: number
  conversion_rate: number
  top_referrers: Array<{
    user_id: string
    count: number
  }>
}

/**
 * Generate or get user's referral code
 */
export async function getOrCreateReferralCode(): Promise<ReferralCode | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      logger.error('User not authenticated')
      return null
    }

    // Check if user already has a referral code
    const { data: existing, error: fetchError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (existing && !fetchError) {
      return existing as ReferralCode
    }

    // Generate new referral code via Edge Function
    const { data, error } = await supabase.functions.invoke('generate-referral-code', {
      body: { user_id: user.id }
    })

    if (error) {
      logger.error('Error generating referral code:', error)
      return null
    }

    return data as ReferralCode
  } catch (error) {
    logger.error('Error in getOrCreateReferralCode:', error)
    return null
  }
}

/**
 * Validate referral code
 */
export async function validateReferralCode(code: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('referral_codes')
      .select('id, is_active, expires_at, max_uses, usage_count')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return false
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return false
    }

    // Check max uses
    if (data.max_uses && data.usage_count >= data.max_uses) {
      return false
    }

    return true
  } catch (error) {
    logger.error('Error validating referral code:', error)
    return false
  }
}

/**
 * Apply referral code (when new user signs up)
 */
export async function applyReferralCode(code: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to use a referral code')
      return false
    }

    // Validate code
    const isValid = await validateReferralCode(code)
    if (!isValid) {
      toast.error('Invalid or expired referral code')
      return false
    }

    // Get referral code details
    const { data: referralCode, error: codeError } = await supabase
      .from('referral_codes')
      .select('id, user_id')
      .eq('code', code.toUpperCase())
      .single()

    if (codeError || !referralCode) {
      toast.error('Referral code not found')
      return false
    }

    // Check if user is trying to refer themselves
    if (referralCode.user_id === user.id) {
      toast.error('You cannot use your own referral code')
      return false
    }

    // Check if user already used a referral code
    const { data: existing } = await supabase
      .from('referral_tracking')
      .select('id')
      .eq('referred_id', user.id)
      .single()

    if (existing) {
      toast.error('You have already used a referral code')
      return false
    }

    // Create referral tracking entry
    const { error: trackingError } = await supabase
      .from('referral_tracking')
      .insert({
        referrer_id: referralCode.user_id,
        referred_id: user.id,
        referral_code_id: referralCode.id,
        status: 'pending'
      })

    if (trackingError) {
      logger.error('Error creating referral tracking:', trackingError)
      toast.error('Failed to apply referral code')
      return false
    }

    // Increment usage count
    await supabase.rpc('increment_referral_usage', {
      code_id: referralCode.id
    })

    toast.success('Referral code applied successfully!')
    return true
  } catch (error) {
    logger.error('Error applying referral code:', error)
    toast.error('Failed to apply referral code')
    return false
  }
}

/**
 * Get user's referral statistics
 */
export async function getReferralStats(): Promise<ReferralAnalytics | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: referrals, error } = await supabase
      .from('referral_tracking')
      .select('*')
      .eq('referrer_id', user.id)

    if (error) {
      logger.error('Error fetching referral stats:', error)
      return null
    }

    const total = referrals?.length || 0
    const completed = referrals?.filter(r => r.status === 'completed' || r.status === 'rewarded').length || 0
    const pending = referrals?.filter(r => r.status === 'pending').length || 0

    // Get total rewards earned
    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('reward_value')
      .eq('user_id', user.id)
      .eq('reward_status', 'applied')

    const totalRewards = rewards?.reduce((sum, r) => sum + (r.reward_value || 0), 0) || 0

    return {
      total_referrals: total,
      completed_referrals: completed,
      pending_referrals: pending,
      total_rewards_earned: totalRewards,
      conversion_rate: total > 0 ? (completed / total) * 100 : 0,
      top_referrers: []
    }
  } catch (error) {
    logger.error('Error getting referral stats:', error)
    return null
  }
}

/**
 * Get referral tracking list
 */
export async function getReferralTracking(): Promise<ReferralTracking[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('referral_tracking')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching referral tracking:', error)
      return []
    }

    return (data || []) as ReferralTracking[]
  } catch (error) {
    logger.error('Error getting referral tracking:', error)
    return []
  }
}

/**
 * Get referral rewards
 */
export async function getReferralRewards(): Promise<ReferralReward[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching referral rewards:', error)
      return []
    }

    return (data || []) as ReferralReward[]
  } catch (error) {
    logger.error('Error getting referral rewards:', error)
    return []
  }
}

/**
 * Share referral code
 */
export function shareReferralCode(code: string): void {
  const shareText = `Join me on this amazing health tracking app! Use my referral code: ${code}\n\nGet started: ${window.location.origin}?ref=${code}`
  const shareUrl = `${window.location.origin}?ref=${code}`

  if (navigator.share) {
    navigator.share({
      title: 'Join me on this health app!',
      text: shareText,
      url: shareUrl
    }).catch(err => {
      logger.error('Error sharing:', err)
      copyToClipboard(shareUrl)
    })
  } else {
    copyToClipboard(shareUrl)
  }
}

/**
 * Copy to clipboard
 */
function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Referral link copied to clipboard!')
  }).catch(err => {
    logger.error('Error copying to clipboard:', err)
    toast.error('Failed to copy referral link')
  })
}

/**
 * Get referral leaderboard (opt-in, anonymous)
 */
export async function getReferralLeaderboard(limit: number = 10): Promise<Array<{
  display_name: string
  referral_count: number
  rank: number
}>> {
  try {
    const { data, error } = await supabase
      .rpc('get_referral_leaderboard', { limit_count: limit })

    if (error) {
      logger.error('Error fetching leaderboard:', error)
      return []
    }

    return data || []
  } catch (error) {
    logger.error('Error getting referral leaderboard:', error)
    return []
  }
}

