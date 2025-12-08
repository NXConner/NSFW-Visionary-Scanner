/**
 * Marketplace System
 * Handles routine marketplace, expert consultations, custom reports, premium content access, equipment/supplement recommendations, and affiliate commissions
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Marketplace Items ====================

export interface MarketplaceItem {
  id: string
  creator_id: string
  category_id: string | null
  item_type: 'routine' | 'course' | 'video' | 'report_template' | 'other'
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
  is_free: boolean
  tags: string[] | null
  difficulty_level: string | null
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

export async function getMarketplaceItems(
  itemType?: MarketplaceItem['item_type'],
  categoryId?: string
): Promise<MarketplaceItem[]> {
  try {
    let query = supabase
      .from('marketplace_items')
      .select('*')
      .eq('is_active', true)
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('purchase_count', { ascending: false })

    if (itemType) {
      query = query.eq('item_type', itemType)
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching marketplace items:', error)
      return []
    }

    return (data || []) as MarketplaceItem[]
  } catch (error) {
    logger.error('Error in getMarketplaceItems:', error)
    return []
  }
}

export async function purchaseMarketplaceItem(itemId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to purchase')
      return false
    }

    // Get item details
    const { data: item } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('id', itemId)
      .single()

    if (!item) {
      toast.error('Item not found')
      return false
    }

    // Create checkout session
    const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        item_id: itemId,
        price: item.price,
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
    logger.error('Error in purchaseMarketplaceItem:', error)
    return false
  }
}

// ==================== Expert Consultations ====================

export interface ExpertConsultation {
  id: string
  expert_id: string
  user_id: string
  consultation_type: 'one_time' | 'follow_up' | 'group_workshop'
  scheduled_at: string | null
  duration_minutes: number
  consultation_status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  price: number
  currency: string
  payment_status: 'pending' | 'paid' | 'refunded'
  payment_intent_id: string | null
  user_concerns: string | null
  expert_notes: string | null
  recommendations: string[] | null
  follow_up_required: boolean
  follow_up_date: string | null
  recording_url: string | null
  recording_available: boolean
  user_rating: number | null
  user_feedback: string | null
  created_at: string
  updated_at: string
}

export async function bookExpertConsultation(
  expertId: string,
  scheduledAt: string,
  consultationType: ExpertConsultation['consultation_type'],
  userConcerns?: string
): Promise<ExpertConsultation | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to book consultation')
      return null
    }

    // Get expert pricing (would be stored in a separate table)
    const consultationPrice = 99.99 // Default price

    const { data, error } = await supabase
      .from('expert_consultations')
      .insert({
        expert_id: expertId,
        user_id: user.id,
        consultation_type: consultationType,
        scheduled_at: scheduledAt,
        price: consultationPrice,
        user_concerns: userConcerns || null
      })
      .select()
      .single()

    if (error) {
      logger.error('Error booking consultation:', error)
      toast.error('Failed to book consultation')
      return null
    }

    // Create checkout session
    const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        consultation_id: data.id,
        price: consultationPrice,
        success_url: `${window.location.origin}/consultations?booking=success`,
        cancel_url: `${window.location.origin}/consultations?booking=cancelled`
      }
    })

    if (sessionError) {
      logger.error('Error creating checkout:', sessionError)
      return null
    }

    if (sessionData.url) {
      window.location.href = sessionData.url
    }

    return data as ExpertConsultation
  } catch (error) {
    logger.error('Error in bookExpertConsultation:', error)
    return null
  }
}

export async function getUserConsultations(): Promise<ExpertConsultation[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('expert_consultations')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: false })

    if (error) {
      logger.error('Error fetching consultations:', error)
      return []
    }

    return (data || []) as ExpertConsultation[]
  } catch (error) {
    logger.error('Error in getUserConsultations:', error)
    return []
  }
}

// ==================== Custom Reports ====================

export interface CustomReport {
  id: string
  user_id: string
  report_type: 'health_summary' | 'progress_report' | 'medical_export' | 'custom'
  report_name: string
  report_config: any
  data_sources: string[]
  price: number
  currency: string
  payment_status: 'pending' | 'paid' | 'refunded'
  payment_intent_id: string | null
  generation_status: 'pending' | 'processing' | 'completed' | 'failed'
  generated_at: string | null
  file_url: string | null
  file_format: 'pdf' | 'excel' | 'csv' | 'json' | 'hl7_fhir' | null
  file_size_bytes: number | null
  is_shared: boolean
  shared_with: string[] | null
  created_at: string
  updated_at: string
}

export async function generateCustomReport(
  reportType: CustomReport['report_type'],
  reportName: string,
  reportConfig: any,
  dataSources: string[],
  fileFormat: CustomReport['file_format'] = 'pdf'
): Promise<CustomReport | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to generate report')
      return null
    }

    // Determine price based on report type and format
    let price = 9.99 // Default price
    if (reportType === 'medical_export') {
      price = 19.99
    }
    if (fileFormat === 'hl7_fhir') {
      price += 10.00
    }

    const { data, error } = await supabase
      .from('custom_reports')
      .insert({
        user_id: user.id,
        report_type: reportType,
        report_name: reportName,
        report_config: reportConfig,
        data_sources: dataSources,
        price,
        file_format: fileFormat
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating custom report:', error)
      toast.error('Failed to create report')
      return null
    }

    // Create checkout session
    const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        report_id: data.id,
        price,
        success_url: `${window.location.origin}/reports?generation=success`,
        cancel_url: `${window.location.origin}/reports?generation=cancelled`
      }
    })

    if (sessionError) {
      logger.error('Error creating checkout:', sessionError)
      return null
    }

    if (sessionData.url) {
      window.location.href = sessionData.url
    }

    return data as CustomReport
  } catch (error) {
    logger.error('Error in generateCustomReport:', error)
    return null
  }
}

// ==================== Equipment Recommendations ====================

export interface EquipmentRecommendation {
  id: string
  equipment_name: string
  equipment_description: string
  equipment_category: string | null
  affiliate_url: string
  affiliate_provider: string | null
  commission_rate: number | null
  price_range: string | null
  rating: number | null
  review_count: number
  image_url: string | null
  recommended_for: string[] | null
  effectiveness_rating: number | null
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export async function getEquipmentRecommendations(
  category?: string
): Promise<EquipmentRecommendation[]> {
  try {
    let query = supabase
      .from('equipment_recommendations')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('effectiveness_rating', { ascending: false })

    if (category) {
      query = query.eq('equipment_category', category)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching equipment recommendations:', error)
      return []
    }

    return (data || []) as EquipmentRecommendation[]
  } catch (error) {
    logger.error('Error in getEquipmentRecommendations:', error)
    return []
  }
}

// ==================== Supplement Recommendations ====================

export interface SupplementRecommendation {
  id: string
  supplement_name: string
  supplement_description: string
  supplement_type: string | null
  affiliate_url: string
  affiliate_provider: string | null
  commission_rate: number | null
  price_range: string | null
  rating: number | null
  review_count: number
  image_url: string | null
  health_benefits: string[] | null
  recommended_dosage: string | null
  warnings: string[] | null
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export async function getSupplementRecommendations(
  supplementType?: string
): Promise<SupplementRecommendation[]> {
  try {
    let query = supabase
      .from('supplement_recommendations')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false })

    if (supplementType) {
      query = query.eq('supplement_type', supplementType)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching supplement recommendations:', error)
      return []
    }

    return (data || []) as SupplementRecommendation[]
  } catch (error) {
    logger.error('Error in getSupplementRecommendations:', error)
    return []
  }
}

