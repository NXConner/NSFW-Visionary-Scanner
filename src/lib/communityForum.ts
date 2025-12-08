/**
 * Community Forum System
 * Manages discussion boards, threads, posts, replies, moderation, and user engagement
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'

export interface ForumCategory {
  id?: string
  name: string
  description?: string
  slug: string
  icon?: string
  color?: string
  order_index?: number
  is_nsfw?: boolean
  is_private?: boolean
  requires_premium?: boolean
  post_count?: number
  thread_count?: number
  last_activity_at?: string
  created_at?: string
  updated_at?: string
}

export interface ForumThread {
  id?: string
  category_id: string
  user_id?: string
  title: string
  content: string
  is_anonymous?: boolean
  is_pinned?: boolean
  is_locked?: boolean
  is_expert_qa?: boolean
  is_success_story?: boolean
  view_count?: number
  reply_count?: number
  like_count?: number
  helpful_count?: number
  is_approved?: boolean
  last_reply_at?: string
  last_reply_by?: string
  created_at?: string
  updated_at?: string
}

export interface ForumPost {
  id?: string
  thread_id: string
  user_id?: string
  parent_post_id?: string
  content: string
  is_anonymous?: boolean
  is_expert_answer?: boolean
  like_count?: number
  helpful_count?: number
  is_approved?: boolean
  created_at?: string
  updated_at?: string
}

export interface ForumInteraction {
  id?: string
  user_id?: string
  content_type: 'thread' | 'post'
  content_id: string
  interaction_type: 'like' | 'helpful' | 'bookmark'
  created_at?: string
}

export interface UserReputation {
  id?: string
  user_id?: string
  reputation_points?: number
  post_count?: number
  thread_count?: number
  helpful_marks_received?: number
  expert_answers_count?: number
  badges?: string[]
  level?: number
  updated_at?: string
}

/**
 * Get forum categories
 */
export async function getForumCategories(): Promise<ForumCategory[]> {
  try {
    const { data, error } = await supabase
      .from('forum_categories')
      .select('*')
      .order('order_index', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get forum categories', { error })
    throw error
  }
}

/**
 * Get threads for a category
 */
export async function getForumThreads(
  categoryId?: string,
  limit: number = 20,
  offset: number = 0
): Promise<ForumThread[]> {
  try {
    let query = supabase
      .from('forum_threads')
      .select('*')
      .eq('is_approved', true)
      .order('is_pinned', { ascending: false })
      .order('last_reply_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get forum threads', { error })
    throw error
  }
}

/**
 * Get a single thread with posts
 */
export async function getForumThread(threadId: string): Promise<{
  thread: ForumThread | null
  posts: ForumPost[]
}> {
  try {
    // Get thread
    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .select('*')
      .eq('id', threadId)
      .single()

    if (threadError) throw threadError

    // Increment view count
    if (thread) {
      await supabase
        .from('forum_threads')
        .update({ view_count: (thread.view_count || 0) + 1 })
        .eq('id', threadId)
    }

    // Get posts
    const { data: posts, error: postsError } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('thread_id', threadId)
      .eq('is_approved', true)
      .order('created_at', { ascending: true })

    if (postsError) throw postsError

    return {
      thread: thread || null,
      posts: posts || []
    }
  } catch (error) {
    logger.error('Failed to get forum thread', { error, threadId })
    throw error
  }
}

/**
 * Create a new thread
 */
export async function createForumThread(
  thread: Omit<ForumThread, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'view_count' | 'reply_count' | 'like_count' | 'helpful_count' | 'is_approved'>
): Promise<ForumThread> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('forum_threads')
      .insert({
        ...thread,
        user_id: thread.is_anonymous ? null : user.id,
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Forum thread created', { threadId: data.id })
    return data
  } catch (error) {
    logger.error('Failed to create forum thread', { error, thread })
    throw error
  }
}

/**
 * Create a post (reply)
 */
export async function createForumPost(
  post: Omit<ForumPost, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'like_count' | 'helpful_count' | 'is_approved'>
): Promise<ForumPost> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        ...post,
        user_id: post.is_anonymous ? null : user.id,
      })
      .select()
      .single()

    if (error) throw error

    logger.info('Forum post created', { postId: data.id })
    return data
  } catch (error) {
    logger.error('Failed to create forum post', { error, post })
    throw error
  }
}

/**
 * Like or mark content as helpful
 */
export async function interactWithContent(
  contentType: 'thread' | 'post',
  contentId: string,
  interactionType: 'like' | 'helpful' | 'bookmark'
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if interaction already exists
    const { data: existing } = await supabase
      .from('forum_interactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('interaction_type', interactionType)
      .single()

    if (existing) {
      // Remove interaction (toggle off)
      await supabase
        .from('forum_interactions')
        .delete()
        .eq('id', existing.id)

      // Decrement count
      const table = contentType === 'thread' ? 'forum_threads' : 'forum_posts'
      const countField = interactionType === 'like' ? 'like_count' : 'helpful_count'
      
      const { data: content } = await supabase
        .from(table)
        .select(countField)
        .eq('id', contentId)
        .single()

      if (content) {
        await supabase
          .from(table)
          .update({ [countField]: Math.max((content[countField] || 0) - 1, 0) })
          .eq('id', contentId)
      }
    } else {
      // Add interaction
      await supabase
        .from('forum_interactions')
        .insert({
          user_id: user.id,
          content_type: contentType,
          content_id: contentId,
          interaction_type: interactionType,
        })

      // Increment count
      const table = contentType === 'thread' ? 'forum_threads' : 'forum_posts'
      const countField = interactionType === 'like' ? 'like_count' : 'helpful_count'
      
      const { data: content } = await supabase
        .from(table)
        .select(countField)
        .eq('id', contentId)
        .single()

      if (content) {
        await supabase
          .from(table)
          .update({ [countField]: (content[countField] || 0) + 1 })
          .eq('id', contentId)
      }
    }
  } catch (error) {
    logger.error('Failed to interact with content', { error, contentType, contentId, interactionType })
    throw error
  }
}

/**
 * Get user reputation
 */
export async function getUserReputation(userId?: string): Promise<UserReputation | null> {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!targetUserId) return null

    const { data, error } = await supabase
      .from('forum_user_reputation')
      .select('*')
      .eq('user_id', targetUserId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data || null
  } catch (error) {
    logger.error('Failed to get user reputation', { error })
    return null
  }
}

/**
 * Search threads
 */
export async function searchForumThreads(
  query: string,
  categoryId?: string
): Promise<ForumThread[]> {
  try {
    let supabaseQuery = supabase
      .from('forum_threads')
      .select('*')
      .eq('is_approved', true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (categoryId) {
      supabaseQuery = supabaseQuery.eq('category_id', categoryId)
    }

    const { data, error } = await supabaseQuery

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to search forum threads', { error, query })
    throw error
  }
}

/**
 * Get user's threads
 */
export async function getUserThreads(userId?: string): Promise<ForumThread[]> {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!targetUserId) return []

    const { data, error } = await supabase
      .from('forum_threads')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get user threads', { error })
    throw error
  }
}

/**
 * Get user's posts
 */
export async function getUserPosts(userId?: string): Promise<ForumPost[]> {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id
    if (!targetUserId) return []

    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    logger.error('Failed to get user posts', { error })
    throw error
  }
}

/**
 * Check if user has interacted with content
 */
export async function hasUserInteracted(
  contentType: 'thread' | 'post',
  contentId: string,
  interactionType: 'like' | 'helpful' | 'bookmark'
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
      .from('forum_interactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .eq('interaction_type', interactionType)
      .single()

    return !!data
  } catch (error) {
    return false
  }
}

