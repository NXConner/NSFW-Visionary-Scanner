/**
 * Subscription Tiers Expansion
 * Handles expanded subscription tiers (Health Pro, Enterprise, Student) and annual plans
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Subscription Tiers ====================

export interface SubscriptionTier {
  id: string
  tier_id: string
  tier_name: string
  tier_description: string | null
  monthly_price: number
  annual_price: number | null
  lifetime_price: number | null
  annual_discount_percentage: number
  lifetime_discount_percentage: number
  stripe_monthly_price_id: string | null
  stripe_annual_price_id: string | null
  stripe_lifetime_price_id: string | null
  features: string[]
  limitations: string[] | null
  is_active: boolean
  is_featured: boolean
  is_popular: boolean
  sort_order: number
  icon_url: string | null
  color_scheme: string | null
  created_at: string
  updated_at: string
}

export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      logger.error('Error fetching subscription tiers:', error)
      return []
    }

    return (data || []).map(tier => ({
      ...tier,
      features: Array.isArray(tier.features) ? tier.features : [],
      limitations: Array.isArray(tier.limitations) ? tier.limitations : null
    })) as SubscriptionTier[]
  } catch (error) {
    logger.error('Error in getSubscriptionTiers:', error)
    return []
  }
}

export async function getSubscriptionTier(tierId: string): Promise<SubscriptionTier | null> {
  try {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('tier_id', tierId)
      .eq('is_active', true)
      .single()

    if (error) {
      logger.error('Error fetching subscription tier:', error)
      return null
    }

    return {
      ...data,
      features: Array.isArray(data.features) ? data.features : [],
      limitations: Array.isArray(data.limitations) ? data.limitations : null
    } as SubscriptionTier
  } catch (error) {
    logger.error('Error in getSubscriptionTier:', error)
    return null
  }
}

// ==================== Subscription Plans ====================

export interface SubscriptionPlan {
  id: string
  user_id: string
  tier_id: string
  plan_type: 'monthly' | 'annual' | 'lifetime'
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  stripe_customer_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'paused'
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  trial_start: string | null
  trial_end: string | null
  price_paid: number
  currency: string
  created_at: string
  updated_at: string
}

export async function getUserSubscriptionPlan(): Promise<SubscriptionPlan | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      logger.error('Error fetching subscription plan:', error)
      return null
    }

    return data as SubscriptionPlan | null
  } catch (error) {
    logger.error('Error in getUserSubscriptionPlan:', error)
    return null
  }
}

export async function subscribeToTier(
  tierId: string,
  planType: 'monthly' | 'annual' | 'lifetime'
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to subscribe')
      return false
    }

    // Get tier details
    const tier = await getSubscriptionTier(tierId)
    if (!tier) {
      toast.error('Tier not found')
      return false
    }

    // Determine price and Stripe price ID
    let price: number
    let stripePriceId: string | null = null

    switch (planType) {
      case 'monthly':
        price = tier.monthly_price
        stripePriceId = tier.stripe_monthly_price_id
        break
      case 'annual':
        price = tier.annual_price || tier.monthly_price * 12
        stripePriceId = tier.stripe_annual_price_id
        break
      case 'lifetime':
        price = tier.lifetime_price || tier.monthly_price * 60
        stripePriceId = tier.stripe_lifetime_price_id
        break
    }

    // Create checkout session
    const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        tier_id: tierId,
        plan_type: planType,
        price,
        stripe_price_id: stripePriceId,
        success_url: `${window.location.origin}/profile?subscription=success`,
        cancel_url: `${window.location.origin}/profile?subscription=cancelled`
      }
    })

    if (sessionError) {
      logger.error('Error creating checkout:', sessionError)
      toast.error('Failed to start subscription')
      return false
    }

    // Redirect to checkout
    if (sessionData.url) {
      window.location.href = sessionData.url
    }

    return true
  } catch (error) {
    logger.error('Error in subscribeToTier:', error)
    return false
  }
}

export async function upgradeSubscription(
  newTierId: string,
  planType: 'monthly' | 'annual' | 'lifetime'
): Promise<boolean> {
  try {
    const currentPlan = await getUserSubscriptionPlan()
    if (!currentPlan) {
      toast.error('No active subscription found')
      return false
    }

    // Cancel current subscription and create new one
    return await subscribeToTier(newTierId, planType)
  } catch (error) {
    logger.error('Error in upgradeSubscription:', error)
    return false
  }
}

export async function cancelSubscription(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in')
      return false
    }

    const currentPlan = await getUserSubscriptionPlan()
    if (!currentPlan) {
      toast.error('No active subscription found')
      return false
    }

    // Cancel via Stripe
    const { error } = await supabase.functions.invoke('cancel-subscription', {
      body: {
        subscription_id: currentPlan.stripe_subscription_id
      }
    })

    if (error) {
      logger.error('Error canceling subscription:', error)
      toast.error('Failed to cancel subscription')
      return false
    }

    toast.success('Subscription will be canceled at the end of the billing period')
    return true
  } catch (error) {
    logger.error('Error in cancelSubscription:', error)
    return false
  }
}

// ==================== Tier Comparison ====================

export interface TierComparisonFeature {
  id: string
  feature_name: string
  feature_description: string | null
  feature_category: string | null
  available_tiers: string[]
  is_premium: boolean
  is_core: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export async function getTierComparisonFeatures(): Promise<TierComparisonFeature[]> {
  try {
    const { data, error } = await supabase
      .from('tier_comparison_features')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('feature_category', { ascending: true })

    if (error) {
      logger.error('Error fetching tier comparison features:', error)
      return []
    }

    return (data || []).map(feature => ({
      ...feature,
      available_tiers: Array.isArray(feature.available_tiers) ? feature.available_tiers : []
    })) as TierComparisonFeature[]
  } catch (error) {
    logger.error('Error in getTierComparisonFeatures:', error)
    return []
  }
}

