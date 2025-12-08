/**
 * Premium Content Marketplace
 * Handles premium position packs, video content, educational courses, expert-created content, ratings, reviews, and purchases
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Premium Content Items ====================

export interface PremiumContentItem {
  id: string
  creator_id: string
  content_type: 'position_pack' | 'video' | 'course' | 'expert_content' | 'bundle'
  title: string
  description: string
  content_data: any
  preview_content: any
  preview_images: string[] | null
  preview_video_url: string | null
  thumbnail_url: string | null
  price: number
  currency: string
  is_subscription: boolean
  subscription_duration_days: number | null
  category: string | null
  tags: string[] | null
  difficulty_level: string | null
  content_rating: string | null
  target_audience: string[] | null
  expert_name: string | null
  expert_credentials: string | null
  expert_bio: string | null
  view_count: number
  purchase_count: number
  revenue_total: number
  average_rating: number | null
  rating_count: number
  review_count: number
  is_active: boolean
  is_featured: boolean
  is_verified: boolean
  is_trending: boolean
  is_approved: boolean
  moderation_notes: string | null
  created_at: string
  updated_at: string
}

export async function getPremiumContent(
  contentType?: PremiumContentItem['content_type'],
  category?: string
): Promise<PremiumContentItem[]> {
  try {
    let query = supabase
      .from('premium_content_items')
      .select('*')
      .eq('is_active', true)
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('purchase_count', { ascending: false })

    if (contentType) {
      query = query.eq('content_type', contentType)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching premium content:', error)
      return []
    }

    return (data || []) as PremiumContentItem[]
  } catch (error) {
    logger.error('Error in getPremiumContent:', error)
    return []
  }
}

// ==================== Premium Content Purchases ====================

export interface PremiumContentPurchase {
  id: string
  content_id: string
  user_id: string
  purchase_type: 'one_time' | 'subscription'
  price_paid: number
  payment_intent_id: string | null
  access_granted_at: string
  access_expires_at: string | null
  is_active: boolean
  download_enabled: boolean
  stream_enabled: boolean
  purchased_at: string
}

export async function purchasePremiumContent(contentId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to purchase content')
      return false
    }

    // Get content details
    const { data: content } = await supabase
      .from('premium_content_items')
      .select('*')
      .eq('id', contentId)
      .single()

    if (!content) {
      toast.error('Content not found')
      return false
    }

    // Create checkout session
    const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        content_id: contentId,
        price: content.price,
        success_url: `${window.location.origin}/marketplace?purchase=success`,
        cancel_url: `${window.location.origin}/marketplace?purchase=cancelled`
      }
    })

    if (sessionError) {
      logger.error('Error creating checkout:', sessionError)
      toast.error('Failed to start purchase')
      return false
    }

    // Redirect to checkout
    if (sessionData.url) {
      window.location.href = sessionData.url
    }

    return true
  } catch (error) {
    logger.error('Error in purchasePremiumContent:', error)
    return false
  }
}

// ==================== Premium Content Reviews ====================

export interface PremiumContentReview {
  id: string
  content_id: string
  user_id: string
  rating: number
  review_text: string | null
  pros: string[] | null
  cons: string[] | null
  has_used_content: boolean
  usage_duration_days: number | null
  results_achieved: string | null
  helpful_count: number
  is_verified_purchase: boolean
  is_approved: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export async function createPremiumContentReview(
  contentId: string,
  rating: number,
  reviewText?: string,
  pros?: string[],
  cons?: string[]
): Promise<PremiumContentReview | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create review')
      return null
    }

    // Check if user has purchased this content
    const { data: purchase } = await supabase
      .from('premium_content_purchases')
      .select('id')
      .eq('content_id', contentId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    const { data, error } = await supabase
      .from('premium_content_reviews')
      .upsert({
        content_id: contentId,
        user_id: user.id,
        rating,
        review_text: reviewText || null,
        pros: pros || null,
        cons: cons || null,
        is_verified_purchase: !!purchase
      }, {
        onConflict: 'content_id,user_id'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating review:', error)
      toast.error('Failed to create review')
      return null
    }

    toast.success('Review submitted!')
    return data as PremiumContentReview
  } catch (error) {
    logger.error('Error in createPremiumContentReview:', error)
    return null
  }
}

// ==================== Premium Content Wishlist ====================

export async function addToWishlist(contentId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to add to wishlist')
      return false
    }

    const { error } = await supabase
      .from('premium_content_wishlist')
      .insert({
        content_id: contentId,
        user_id: user.id
      })

    if (error) {
      if (error.code === '23505') {
        toast.info('Already in wishlist')
        return true
      }
      logger.error('Error adding to wishlist:', error)
      toast.error('Failed to add to wishlist')
      return false
    }

    toast.success('Added to wishlist!')
    return true
  } catch (error) {
    logger.error('Error in addToWishlist:', error)
    return false
  }
}

export async function getWishlist(): Promise<PremiumContentItem[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: wishlistItems, error: wishlistError } = await supabase
      .from('premium_content_wishlist')
      .select('content_id')
      .eq('user_id', user.id)

    if (wishlistError || !wishlistItems || wishlistItems.length === 0) {
      return []
    }

    const contentIds = wishlistItems.map(item => item.content_id)
    const { data, error } = await supabase
      .from('premium_content_items')
      .select('*')
      .in('id', contentIds)

    if (error) {
      logger.error('Error fetching wishlist:', error)
      return []
    }

    return (data || []) as PremiumContentItem[]
  } catch (error) {
    logger.error('Error in getWishlist:', error)
    return []
  }
}

