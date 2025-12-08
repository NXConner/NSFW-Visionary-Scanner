/**
 * Premium Add-Ons System
 * Handles premium add-ons (advanced analytics, extended storage, priority support, etc.)
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Premium Add-Ons ====================

export interface PremiumAddOn {
  id: string
  addon_id: string
  addon_name: string
  addon_description: string
  monthly_price: number
  annual_price: number | null
  lifetime_price: number | null
  annual_discount_percentage: number
  stripe_monthly_price_id: string | null
  stripe_annual_price_id: string | null
  stripe_lifetime_price_id: string | null
  features: string[]
  limitations: string[] | null
  requires_tier: string[]
  incompatible_addons: string[] | null
  is_active: boolean
  is_featured: boolean
  is_popular: boolean
  category: string | null
  icon_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export async function getPremiumAddOns(category?: string): Promise<PremiumAddOn[]> {
  try {
    let query = supabase
      .from('premium_add_ons')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching premium add-ons:', error)
      return []
    }

    return (data || []).map(addon => ({
      ...addon,
      features: Array.isArray(addon.features) ? addon.features : [],
      limitations: Array.isArray(addon.limitations) ? addon.limitations : null,
      requires_tier: Array.isArray(addon.requires_tier) ? addon.requires_tier : [],
      incompatible_addons: Array.isArray(addon.incompatible_addons) ? addon.incompatible_addons : null
    })) as PremiumAddOn[]
  } catch (error) {
    logger.error('Error in getPremiumAddOns:', error)
    return []
  }
}

export async function getPremiumAddOn(addonId: string): Promise<PremiumAddOn | null> {
  try {
    const { data, error } = await supabase
      .from('premium_add_ons')
      .select('*')
      .eq('addon_id', addonId)
      .eq('is_active', true)
      .single()

    if (error) {
      logger.error('Error fetching premium add-on:', error)
      return null
    }

    return {
      ...data,
      features: Array.isArray(data.features) ? data.features : [],
      limitations: Array.isArray(data.limitations) ? data.limitations : null,
      requires_tier: Array.isArray(data.requires_tier) ? data.requires_tier : [],
      incompatible_addons: Array.isArray(data.incompatible_addons) ? data.incompatible_addons : null
    } as PremiumAddOn
  } catch (error) {
    logger.error('Error in getPremiumAddOn:', error)
    return null
  }
}

// ==================== User Add-Ons ====================

export interface UserAddOn {
  id: string
  user_id: string
  addon_id: string
  plan_type: 'monthly' | 'annual' | 'lifetime'
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'paused'
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  price_paid: number
  currency: string
  created_at: string
  updated_at: string
}

export async function getUserAddOns(): Promise<UserAddOn[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('user_add_ons')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching user add-ons:', error)
      return []
    }

    return (data || []) as UserAddOn[]
  } catch (error) {
    logger.error('Error in getUserAddOns:', error)
    return []
  }
}

export async function subscribeToAddOn(
  addonId: string,
  planType: 'monthly' | 'annual' | 'lifetime'
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to subscribe')
      return false
    }

    // Get add-on details
    const addon = await getPremiumAddOn(addonId)
    if (!addon) {
      toast.error('Add-on not found')
      return false
    }

    // Check if user has required tier
    const { data: subscription } = await supabase
      .from('subscription_plans')
      .select('tier_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (!subscription || !addon.requires_tier.includes(subscription.tier_id)) {
      toast.error(`This add-on requires one of the following tiers: ${addon.requires_tier.join(', ')}`)
      return false
    }

    // Determine price and Stripe price ID
    let price: number
    let stripePriceId: string | null = null

    switch (planType) {
      case 'monthly':
        price = addon.monthly_price
        stripePriceId = addon.stripe_monthly_price_id
        break
      case 'annual':
        price = addon.annual_price || addon.monthly_price * 12
        stripePriceId = addon.stripe_annual_price_id
        break
      case 'lifetime':
        price = addon.lifetime_price || addon.monthly_price * 60
        stripePriceId = addon.stripe_lifetime_price_id
        break
    }

    // Create checkout session
    const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        addon_id: addonId,
        plan_type: planType,
        price,
        stripe_price_id: stripePriceId,
        success_url: `${window.location.origin}/profile?addon=success`,
        cancel_url: `${window.location.origin}/profile?addon=cancelled`
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
    logger.error('Error in subscribeToAddOn:', error)
    return false
  }
}

export async function cancelAddOn(addonId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in')
      return false
    }

    const { data: addon } = await supabase
      .from('user_add_ons')
      .select('*')
      .eq('user_id', user.id)
      .eq('addon_id', addonId)
      .eq('status', 'active')
      .single()

    if (!addon) {
      toast.error('Add-on not found')
      return false
    }

    // Cancel via Stripe
    const { error } = await supabase.functions.invoke('cancel-subscription', {
      body: {
        subscription_id: addon.stripe_subscription_id
      }
    })

    if (error) {
      logger.error('Error canceling add-on:', error)
      toast.error('Failed to cancel add-on')
      return false
    }

    toast.success('Add-on will be canceled at the end of the billing period')
    return true
  } catch (error) {
    logger.error('Error in cancelAddOn:', error)
    return false
  }
}

// ==================== Add-On Usage Tracking ====================

export interface AddOnUsageTracking {
  id: string
  user_id: string
  addon_id: string
  usage_type: string
  usage_value: number
  usage_limit: number | null
  period_start: string
  period_end: string
  tracked_at: string
  created_at: string
}

export async function getAddOnUsage(addonId: string): Promise<AddOnUsageTracking[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('addon_usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('addon_id', addonId)
      .order('tracked_at', { ascending: false })
      .limit(30)

    if (error) {
      logger.error('Error fetching add-on usage:', error)
      return []
    }

    return (data || []) as AddOnUsageTracking[]
  } catch (error) {
    logger.error('Error in getAddOnUsage:', error)
    return []
  }
}

