/**
 * Comprehensive Sexual Health Education System
 * Manages educational content, interactive learning, Q&A, and expert content
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'

export interface EducationModule {
  id?: string
  title: string
  description?: string
  category: 'anatomy' | 'function' | 'conditions' | 'treatment' | 'prevention' | 'wellness' | 'relationships' | 'myths'
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  age_group?: '18-25' | '26-35' | '36-45' | '46-55' | '56+' | 'all'
  estimated_duration_minutes?: number
  content_type?: 'article' | 'video' | 'interactive' | 'quiz' | 'assessment'
  content_text?: string
  content_html?: string
  video_url?: string
  thumbnail_url?: string
  author?: string
  expert_reviewed?: boolean
  view_count?: number
  rating_average?: number
  rating_count?: number
  order_index?: number
  is_featured?: boolean
  is_premium?: boolean
  created_at?: string
  updated_at?: string
}

export interface InteractiveContent {
  id?: string
  module_id?: string
  content_type: 'quiz' | 'assessment' | 'interactive_guide'
  title: string
  description?: string
  questions: any
  answers?: any
  passing_score?: number
  completion_count?: number
  average_score?: number
  created_at?: string
  updated_at?: string
}

export interface UserProgress {
  id?: string
  user_id?: string
  module_id: string
  progress_percentage?: number
  time_spent_minutes?: number
  last_accessed_at?: string
  completed_at?: string
  is_completed?: boolean
  quiz_score?: number
  quiz_attempts?: number
  quiz_completed_at?: string
  created_at?: string
  updated_at?: string
}

export interface EducationQA {
  id?: string
  question: string
  answer: string
  category?: string
  answered_by?: string
  expert_verified?: boolean
  source_url?: string
  view_count?: number
  helpful_count?: number
  not_helpful_count?: number
  tags?: string[]
  related_module_ids?: string[]
  created_at?: string
  updated_at?: string
}

export interface ExpertContent {
  id?: string
  expert_name: string
  expert_title?: string
  expert_credentials?: string
  expert_bio?: string
  expert_image_url?: string
  content_type?: 'interview' | 'article' | 'video' | 'webinar'
  title: string
  description?: string
  content_text?: string
  video_url?: string
  thumbnail_url?: string
  duration_minutes?: number
  transcript?: string
  topics?: string[]
  tags?: string[]
  is_premium?: boolean
  view_count?: number
  published_at?: string
  created_at?: string
  updated_at?: string
}

export interface ResearchUpdate {
  id?: string
  title: string
  summary: string
  full_article?: string
  source_url?: string
  source_name?: string
  category?: 'research' | 'news' | 'breakthrough' | 'study' | 'guideline'
  tags?: string[]
  published_date?: string
  relevance_score?: number
  created_at?: string
  updated_at?: string
}

/**
 * Get education modules
 */
export async function getEducationModules(
  category?: string,
  featured?: boolean,
  premiumOnly?: boolean
): Promise<EducationModule[]> {
  try {
    let query = supabase
      .from('sexual_health_education_modules')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }
    if (featured) {
      query = query.eq('is_featured', true)
    }
    if (premiumOnly !== undefined) {
      query = query.eq('is_premium', premiumOnly)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get education modules', { error })
    throw error
  }
}

/**
 * Get a single education module
 */
export async function getEducationModule(moduleId: string): Promise<EducationModule | null> {
  try {
    const { data, error } = await supabase
      .from('sexual_health_education_modules')
      .select('*')
      .eq('id', moduleId)
      .single()

    if (error) throw error

    // Increment view count
    if (data) {
      await supabase.rpc('increment_module_view_count', { module_id: moduleId })
    }

    return data
  } catch (error) {
    logger.error('Failed to get education module', { error, moduleId })
    return null
  }
}

/**
 * Get interactive content for a module
 */
export async function getInteractiveContent(moduleId: string): Promise<InteractiveContent[]> {
  try {
    const { data, error } = await supabase
      .from('education_interactive_content')
      .select('*')
      .eq('module_id', moduleId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get interactive content', { error, moduleId })
    throw error
  }
}

/**
 * Get user progress for modules
 */
export async function getUserProgress(moduleId?: string): Promise<UserProgress[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('education_user_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('last_accessed_at', { ascending: false })

    if (moduleId) {
      query = query.eq('module_id', moduleId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get user progress', { error })
    throw error
  }
}

/**
 * Update user progress
 */
export async function updateUserProgress(
  moduleId: string,
  progress: Partial<UserProgress>
): Promise<UserProgress> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('education_user_progress')
      .upsert({
        user_id: user.id,
        module_id: moduleId,
        ...progress,
        last_accessed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,module_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) throw error

    logger.info('User progress updated', { moduleId, progress })
    return data
  } catch (error) {
    logger.error('Failed to update user progress', { error, moduleId, progress })
    throw error
  }
}

/**
 * Mark module as completed
 */
export async function completeModule(moduleId: string): Promise<void> {
  try {
    await updateUserProgress(moduleId, {
      is_completed: true,
      completed_at: new Date().toISOString(),
      progress_percentage: 100,
    })
  } catch (error) {
    logger.error('Failed to complete module', { error, moduleId })
    throw error
  }
}

/**
 * Get Q&A entries
 */
export async function getEducationQA(
  category?: string,
  searchQuery?: string
): Promise<EducationQA[]> {
  try {
    let query = supabase
      .from('education_qa')
      .select('*')
      .order('view_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }
    if (searchQuery) {
      query = query.or(`question.ilike.%${searchQuery}%,answer.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get education Q&A', { error })
    throw error
  }
}

/**
 * Mark Q&A as helpful
 */
export async function markQAHelpful(qaId: string, helpful: boolean): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Record interaction
    await supabase
      .from('education_qa_interactions')
      .upsert({
        user_id: user.id,
        qa_id: qaId,
        was_helpful: helpful,
      }, {
        onConflict: 'user_id,qa_id',
        ignoreDuplicates: false
      })

    // Update helpful count
    const { error } = await supabase.rpc('increment_qa_helpful', {
      qa_id: qaId,
      is_helpful: helpful
    })

    if (error) throw error
  } catch (error) {
    logger.error('Failed to mark Q&A helpful', { error, qaId, helpful })
    throw error
  }
}

/**
 * Get expert content
 */
export async function getExpertContent(
  limit?: number
): Promise<ExpertContent[]> {
  try {
    let query = supabase
      .from('education_expert_content')
      .select('*')
      .order('published_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get expert content', { error })
    throw error
  }
}

/**
 * Get research updates
 */
export async function getResearchUpdates(
  category?: string,
  limit?: number
): Promise<ResearchUpdate[]> {
  try {
    let query = supabase
      .from('education_research_updates')
      .select('*')
      .order('published_date', { ascending: false })
      .order('relevance_score', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get research updates', { error })
    throw error
  }
}

/**
 * Get user's education completion percentage
 */
export async function getUserEducationCompletion(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase.rpc('get_user_education_completion', {
      user_id: user.id
    })

    if (error) throw error
    return data || 0
  } catch (error) {
    logger.error('Failed to get education completion', { error })
    return 0
  }
}

/**
 * Bookmark content
 */
export async function bookmarkContent(
  contentType: 'module' | 'qa' | 'expert_content' | 'research_update',
  contentId: string,
  notes?: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('education_bookmarks')
      .upsert({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        notes,
      }, {
        onConflict: 'user_id,content_type,content_id',
        ignoreDuplicates: false
      })

    if (error) throw error
  } catch (error) {
    logger.error('Failed to bookmark content', { error, contentType, contentId })
    throw error
  }
}

/**
 * Get bookmarks
 */
export async function getBookmarks(
  contentType?: string
): Promise<any[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('education_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get bookmarks', { error })
    throw error
  }
}

