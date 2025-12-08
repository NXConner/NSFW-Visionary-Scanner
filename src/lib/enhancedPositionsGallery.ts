/**
 * Enhanced Positions Gallery
 * Handles position difficulty ratings, effectiveness tracking, reviews, playlists, recommendations, and analytics
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Position Difficulty Ratings ====================

export interface PositionDifficultyRating {
  id: string
  position_id: string
  user_id: string
  difficulty_rating: number
  physical_difficulty: number | null
  coordination_difficulty: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function submitDifficultyRating(
  positionId: string,
  difficultyRating: number,
  physicalDifficulty?: number,
  coordinationDifficulty?: number,
  notes?: string
): Promise<PositionDifficultyRating | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to submit rating')
      return null
    }

    const { data, error } = await supabase
      .from('position_difficulty_ratings')
      .upsert({
        position_id: positionId,
        user_id: user.id,
        difficulty_rating: difficultyRating,
        physical_difficulty: physicalDifficulty || null,
        coordination_difficulty: coordinationDifficulty || null,
        notes: notes || null
      }, {
        onConflict: 'position_id,user_id'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error submitting rating:', error)
      toast.error('Failed to submit rating')
      return null
    }

    toast.success('Rating submitted!')
    return data as PositionDifficultyRating
  } catch (error) {
    logger.error('Error in submitDifficultyRating:', error)
    return null
  }
}

export async function getPositionDifficultyRatings(positionId: string): Promise<PositionDifficultyRating[]> {
  try {
    const { data, error } = await supabase
      .from('position_difficulty_ratings')
      .select('*')
      .eq('position_id', positionId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching ratings:', error)
      return []
    }

    return (data || []) as PositionDifficultyRating[]
  } catch (error) {
    logger.error('Error in getPositionDifficultyRatings:', error)
    return []
  }
}

// ==================== Position Effectiveness Tracking ====================

export interface PositionEffectivenessTracking {
  id: string
  position_id: string
  user_id: string
  effectiveness_rating: number
  pleasure_rating: number | null
  intensity_rating: number | null
  comfort_rating: number | null
  session_date: string | null
  partner_feedback: string | null
  notes: string | null
  created_at: string
}

export async function trackPositionEffectiveness(
  positionId: string,
  effectivenessRating: number,
  pleasureRating?: number,
  intensityRating?: number,
  comfortRating?: number,
  sessionDate?: string,
  notes?: string
): Promise<PositionEffectivenessTracking | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to track effectiveness')
      return null
    }

    const { data, error } = await supabase
      .from('position_effectiveness_tracking')
      .insert({
        position_id: positionId,
        user_id: user.id,
        effectiveness_rating: effectivenessRating,
        pleasure_rating: pleasureRating || null,
        intensity_rating: intensityRating || null,
        comfort_rating: comfortRating || null,
        session_date: sessionDate || new Date().toISOString().split('T')[0],
        notes: notes || null
      })
      .select()
      .single()

    if (error) {
      logger.error('Error tracking effectiveness:', error)
      toast.error('Failed to track effectiveness')
      return null
    }

    toast.success('Effectiveness tracked!')
    return data as PositionEffectivenessTracking
  } catch (error) {
    logger.error('Error in trackPositionEffectiveness:', error)
    return null
  }
}

// ==================== Position Reviews ====================

export interface PositionReview {
  id: string
  position_id: string
  user_id: string
  rating: number
  review_text: string | null
  tips: string[] | null
  pros: string[] | null
  cons: string[] | null
  times_tried: number
  would_recommend: boolean | null
  is_approved: boolean
  is_featured: boolean
  helpful_count: number
  created_at: string
  updated_at: string
}

export async function createPositionReview(
  positionId: string,
  rating: number,
  reviewText?: string,
  tips?: string[],
  pros?: string[],
  cons?: string[]
): Promise<PositionReview | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create review')
      return null
    }

    const { data, error } = await supabase
      .from('position_reviews')
      .upsert({
        position_id: positionId,
        user_id: user.id,
        rating,
        review_text: reviewText || null,
        tips: tips || null,
        pros: pros || null,
        cons: cons || null
      }, {
        onConflict: 'position_id,user_id'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating review:', error)
      toast.error('Failed to create review')
      return null
    }

    toast.success('Review submitted!')
    return data as PositionReview
  } catch (error) {
    logger.error('Error in createPositionReview:', error)
    return null
  }
}

export async function getPositionReviews(positionId: string): Promise<PositionReview[]> {
  try {
    const { data, error } = await supabase
      .from('position_reviews')
      .select('*')
      .eq('position_id', positionId)
      .eq('is_approved', true)
      .order('helpful_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching reviews:', error)
      return []
    }

    return (data || []) as PositionReview[]
  } catch (error) {
    logger.error('Error in getPositionReviews:', error)
    return []
  }
}

// ==================== Position Playlists ====================

export interface PositionPlaylist {
  id: string
  user_id: string
  playlist_name: string
  description: string | null
  is_public: boolean
  is_featured: boolean
  position_ids: string[]
  position_count: number
  view_count: number
  copy_count: number
  like_count: number
  created_at: string
  updated_at: string
}

export async function createPositionPlaylist(
  playlistName: string,
  positionIds: string[],
  description?: string,
  isPublic: boolean = false
): Promise<PositionPlaylist | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create playlist')
      return null
    }

    const { data, error } = await supabase
      .from('position_playlists')
      .insert({
        user_id: user.id,
        playlist_name: playlistName,
        description: description || null,
        is_public: isPublic,
        position_ids: positionIds,
        position_count: positionIds.length
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating playlist:', error)
      toast.error('Failed to create playlist')
      return null
    }

    toast.success('Playlist created!')
    return data as PositionPlaylist
  } catch (error) {
    logger.error('Error in createPositionPlaylist:', error)
    return null
  }
}

export async function getPositionPlaylists(includePublic: boolean = true): Promise<PositionPlaylist[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('position_playlists')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('like_count', { ascending: false })

    if (includePublic) {
      query = query.or(`is_public.eq.true,user_id.eq.${user.id}`)
    } else {
      query = query.eq('user_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching playlists:', error)
      return []
    }

    return (data || []) as PositionPlaylist[]
  } catch (error) {
    logger.error('Error in getPositionPlaylists:', error)
    return []
  }
}

// ==================== Position Recommendations ====================

export interface PositionRecommendation {
  id: string
  user_id: string
  position_id: string
  recommendation_type: 'similar' | 'next_level' | 'complementary' | 'trending' | 'personalized' | null
  confidence_score: number | null
  reasoning: string | null
  ai_model_version: string | null
  was_viewed: boolean
  was_tried: boolean
  user_feedback: string | null
  recommended_at: string
  created_at: string
}

export async function getPositionRecommendations(
  recommendationType?: PositionRecommendation['recommendation_type']
): Promise<PositionRecommendation[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('position_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('confidence_score', { ascending: false, nullsLast: true })
      .order('recommended_at', { ascending: false })

    if (recommendationType) {
      query = query.eq('recommendation_type', recommendationType)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching recommendations:', error)
      return []
    }

    return (data || []) as PositionRecommendation[]
  } catch (error) {
    logger.error('Error in getPositionRecommendations:', error)
    return []
  }
}

// ==================== Position Comparisons ====================

export interface PositionComparison {
  id: string
  user_id: string
  position_ids: string[]
  comparison_name: string | null
  comparison_results: any
  insights: string[] | null
  created_at: string
}

export async function createPositionComparison(
  positionIds: string[],
  comparisonName?: string
): Promise<PositionComparison | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create comparison')
      return null
    }

    // Get ratings and effectiveness data for positions
    const comparisonResults: any = {}
    const insights: string[] = []

    for (const positionId of positionIds) {
      const [ratings, effectiveness] = await Promise.all([
        getPositionDifficultyRatings(positionId),
        supabase
          .from('position_effectiveness_tracking')
          .select('*')
          .eq('position_id', positionId)
          .eq('user_id', user.id)
      ])

      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.difficulty_rating, 0) / ratings.length
        : null

      comparisonResults[positionId] = {
        average_difficulty: avgRating,
        effectiveness_data: effectiveness.data
      }
    }

    const { data, error } = await supabase
      .from('position_comparisons')
      .insert({
        user_id: user.id,
        position_ids: positionIds,
        comparison_name: comparisonName || `Comparison ${new Date().toLocaleDateString()}`,
        comparison_results: comparisonResults,
        insights
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating comparison:', error)
      toast.error('Failed to create comparison')
      return null
    }

    toast.success('Comparison created!')
    return data as PositionComparison
  } catch (error) {
    logger.error('Error in createPositionComparison:', error)
    return null
  }
}

