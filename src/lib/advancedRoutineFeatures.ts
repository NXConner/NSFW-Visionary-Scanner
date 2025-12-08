/**
 * Advanced Routine Features
 * Handles routine templates library, adaptive routines, routine sharing, marketplace, video-guided routines, analytics, rest day recommendations, and multi-week programs
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Routine Templates ====================

export interface RoutineTemplate {
  id: string
  template_name: string
  description: string
  category: 'beginner' | 'intermediate' | 'advanced' | 'recovery' | 'maintenance' | 'intensive' | 'custom' | null
  exercises: any[]
  duration_weeks: number | null
  sessions_per_week: number | null
  estimated_time_per_session_minutes: number | null
  difficulty_level: number | null
  intensity_level: 'low' | 'moderate' | 'high' | 'very_high' | null
  target_goals: string[] | null
  expected_outcomes: string | null
  has_video_guidance: boolean
  video_urls: any
  equipment_required: string[] | null
  experience_required: string | null
  time_commitment: string | null
  created_by: string | null
  is_system_template: boolean
  is_premium: boolean
  is_featured: boolean
  is_verified: boolean
  usage_count: number
  success_rate: number | null
  average_rating: number | null
  rating_count: number
  review_count: number
  created_at: string
  updated_at: string
}

export async function getRoutineTemplates(
  category?: RoutineTemplate['category'],
  difficultyLevel?: number
): Promise<RoutineTemplate[]> {
  try {
    let query = supabase
      .from('routine_templates')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('usage_count', { ascending: false })
      .order('average_rating', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }
    if (difficultyLevel) {
      query = query.eq('difficulty_level', difficultyLevel)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching templates:', error)
      return []
    }

    return (data || []) as RoutineTemplate[]
  } catch (error) {
    logger.error('Error in getRoutineTemplates:', error)
    return []
  }
}

export async function createRoutineTemplate(
  templateName: string,
  description: string,
  exercises: any[],
  category: RoutineTemplate['category'],
  difficultyLevel: number
): Promise<RoutineTemplate | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create a template')
      return null
    }

    const { data, error } = await supabase
      .from('routine_templates')
      .insert({
        template_name: templateName,
        description,
        exercises,
        category,
        difficulty_level: difficultyLevel,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating template:', error)
      toast.error('Failed to create template')
      return null
    }

    toast.success('Template created!')
    return data as RoutineTemplate
  } catch (error) {
    logger.error('Error in createRoutineTemplate:', error)
    return null
  }
}

// ==================== Adaptive Routines ====================

export interface AdaptiveRoutine {
  id: string
  user_id: string
  base_template_id: string | null
  routine_name: string
  adaptation_reason: string | null
  user_profile: any
  adaptation_history: any
  current_exercises: any
  current_schedule: any
  difficulty_adjustment: number
  ai_model_version: string | null
  adaptation_confidence: number | null
  last_adapted_at: string | null
  adaptation_count: number
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  start_date: string | null
  target_end_date: string | null
  created_at: string
  updated_at: string
}

export async function createAdaptiveRoutine(
  baseTemplateId: string | null,
  routineName: string
): Promise<AdaptiveRoutine | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create a routine')
      return null
    }

    // Get user profile for adaptation
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Call AI adaptation Edge Function
    const { data: adaptationData, error: adaptationError } = await supabase.functions.invoke('adapt-routine', {
      body: {
        base_template_id: baseTemplateId,
        user_profile: userData
      }
    })

    if (adaptationError) {
      logger.error('Error adapting routine:', adaptationError)
      toast.error('Failed to adapt routine')
      return null
    }

    const { data, error } = await supabase
      .from('adaptive_routines')
      .insert({
        user_id: user.id,
        base_template_id: baseTemplateId,
        routine_name: routineName,
        user_profile: userData,
        current_exercises: adaptationData.exercises,
        current_schedule: adaptationData.schedule,
        difficulty_adjustment: adaptationData.difficulty_adjustment,
        ai_model_version: adaptationData.model_version,
        adaptation_confidence: adaptationData.confidence,
        adaptation_reason: adaptationData.reason
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating adaptive routine:', error)
      toast.error('Failed to create routine')
      return null
    }

    toast.success('Adaptive routine created!')
    return data as AdaptiveRoutine
  } catch (error) {
    logger.error('Error in createAdaptiveRoutine:', error)
    return null
  }
}

export async function adaptRoutine(routineId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Get current routine
    const { data: routine } = await supabase
      .from('adaptive_routines')
      .select('*')
      .eq('id', routineId)
      .eq('user_id', user.id)
      .single()

    if (!routine) {
      toast.error('Routine not found')
      return false
    }

    // Call adaptation Edge Function
    const { data: adaptationData, error } = await supabase.functions.invoke('adapt-routine', {
      body: {
        routine_id: routineId,
        current_routine: routine,
        user_profile: routine.user_profile
      }
    })

    if (error) {
      logger.error('Error adapting routine:', error)
      toast.error('Failed to adapt routine')
      return false
    }

    // Update routine
    await supabase
      .from('adaptive_routines')
      .update({
        current_exercises: adaptationData.exercises,
        current_schedule: adaptationData.schedule,
        difficulty_adjustment: adaptationData.difficulty_adjustment,
        last_adapted_at: new Date().toISOString(),
        adaptation_count: routine.adaptation_count + 1,
        adaptation_history: [
          ...(routine.adaptation_history || []),
          {
            adapted_at: new Date().toISOString(),
            reason: adaptationData.reason,
            changes: adaptationData.changes
          }
        ]
      })
      .eq('id', routineId)

    toast.success('Routine adapted!')
    return true
  } catch (error) {
    logger.error('Error in adaptRoutine:', error)
    return false
  }
}

// ==================== Routine Sharing ====================

export interface SharedRoutine {
  id: string
  routine_id: string | null
  user_id: string
  share_name: string
  description: string | null
  is_public: boolean
  share_token: string | null
  shared_with_users: string[] | null
  routine_data: any
  view_count: number
  copy_count: number
  rating_average: number | null
  rating_count: number
  created_at: string
  updated_at: string
}

export async function shareRoutine(
  routineId: string,
  shareName: string,
  description?: string,
  isPublic: boolean = false
): Promise<SharedRoutine | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to share routine')
      return null
    }

    // Get routine data
    const { data: routine } = await supabase
      .from('adaptive_routines')
      .select('*')
      .eq('id', routineId)
      .eq('user_id', user.id)
      .single()

    if (!routine) {
      toast.error('Routine not found')
      return null
    }

    // Generate share token
    const shareToken = `routine_${Date.now()}_${Math.random().toString(36).substring(7)}`

    const { data, error } = await supabase
      .from('shared_routines')
      .insert({
        routine_id: routineId,
        user_id: user.id,
        share_name: shareName,
        description,
        is_public: isPublic,
        share_token: shareToken,
        routine_data: routine
      })
      .select()
      .single()

    if (error) {
      logger.error('Error sharing routine:', error)
      toast.error('Failed to share routine')
      return null
    }

    toast.success('Routine shared!')
    return data as SharedRoutine
  } catch (error) {
    logger.error('Error in shareRoutine:', error)
    return null
  }
}

// ==================== Routine Marketplace ====================

export interface RoutineMarketplaceItem {
  id: string
  template_id: string | null
  creator_id: string
  price: number
  currency: string
  is_subscription: boolean
  subscription_duration_days: number | null
  marketplace_category: string | null
  tags: string[] | null
  featured_image_url: string | null
  preview_video_url: string | null
  sales_count: number
  revenue_total: number
  average_rating: number | null
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export async function getMarketplaceRoutines(
  category?: string,
  maxPrice?: number
): Promise<RoutineMarketplaceItem[]> {
  try {
    let query = supabase
      .from('routine_marketplace')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('sales_count', { ascending: false })

    if (category) {
      query = query.eq('marketplace_category', category)
    }
    if (maxPrice) {
      query = query.lte('price', maxPrice)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching marketplace:', error)
      return []
    }

    return (data || []) as RoutineMarketplaceItem[]
  } catch (error) {
    logger.error('Error in getMarketplaceRoutines:', error)
    return []
  }
}

export async function purchaseRoutine(marketplaceId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to purchase routine')
      return false
    }

    // Get marketplace item
    const { data: item } = await supabase
      .from('routine_marketplace')
      .select('*')
      .eq('id', marketplaceId)
      .single()

    if (!item) {
      toast.error('Routine not found')
      return false
    }

    // Create checkout session (Stripe)
    const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        price_id: item.price_id, // Would need price_id in marketplace table
        success_url: `${window.location.origin}/routines?purchase=success`,
        cancel_url: `${window.location.origin}/routines?purchase=cancelled`
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
    logger.error('Error in purchaseRoutine:', error)
    return false
  }
}

// ==================== Rest Day Recommendations ====================

export interface RestDayRecommendation {
  id: string
  user_id: string
  routine_id: string | null
  recommended_date: string
  recommendation_type: 'scheduled' | 'recovery' | 'injury_prevention' | 'overtraining' | 'fatigue' | null
  reason: string
  factors_considered: any
  confidence: number | null
  was_followed: boolean | null
  user_feedback: string | null
  recommended_at: string
  created_at: string
}

export async function getRestDayRecommendations(
  routineId?: string
): Promise<RestDayRecommendation[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('rest_day_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .gte('recommended_date', new Date().toISOString().split('T')[0])
      .order('recommended_date', { ascending: true })

    if (routineId) {
      query = query.eq('routine_id', routineId)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching recommendations:', error)
      return []
    }

    return (data || []) as RestDayRecommendation[]
  } catch (error) {
    logger.error('Error in getRestDayRecommendations:', error)
    return []
  }
}

// ==================== Multi-Week Programs ====================

export interface MultiWeekProgram {
  id: string
  user_id: string
  base_template_id: string | null
  program_name: string
  description: string | null
  total_weeks: number
  current_week: number
  phases: any[]
  start_date: string
  target_end_date: string | null
  actual_end_date: string | null
  completion_percentage: number
  weeks_completed: number
  status: 'active' | 'paused' | 'completed' | 'abandoned'
  program_goals: string[] | null
  milestones: any
  created_at: string
  updated_at: string
}

export async function createMultiWeekProgram(
  programName: string,
  totalWeeks: number,
  phases: any[],
  baseTemplateId?: string
): Promise<MultiWeekProgram | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create a program')
      return null
    }

    const startDate = new Date()
    const targetEndDate = new Date(startDate)
    targetEndDate.setDate(targetEndDate.getDate() + (totalWeeks * 7))

    const { data, error } = await supabase
      .from('multi_week_programs')
      .insert({
        user_id: user.id,
        program_name: programName,
        total_weeks: totalWeeks,
        phases,
        base_template_id: baseTemplateId || null,
        start_date: startDate.toISOString().split('T')[0],
        target_end_date: targetEndDate.toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating program:', error)
      toast.error('Failed to create program')
      return null
    }

    // Create program phases
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i]
      await supabase
        .from('program_phases')
        .insert({
          program_id: data.id,
          phase_number: i + 1,
          phase_name: phase.name,
          description: phase.description,
          duration_weeks: phase.duration_weeks,
          start_week: phase.start_week,
          end_week: phase.end_week,
          phase_routine: phase.routine,
          phase_goals: phase.goals
        })
    }

    toast.success('Multi-week program created!')
    return data as MultiWeekProgram
  } catch (error) {
    logger.error('Error in createMultiWeekProgram:', error)
    return null
  }
}

export async function getMultiWeekPrograms(): Promise<MultiWeekProgram[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('multi_week_programs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching programs:', error)
      return []
    }

    return (data || []) as MultiWeekProgram[]
  } catch (error) {
    logger.error('Error in getMultiWeekPrograms:', error)
    return []
  }
}

