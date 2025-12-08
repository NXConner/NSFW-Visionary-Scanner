/**
 * NSFW Community Forum
 * Handles NSFW discussion forums, anonymous posting, Q&A, success stories, support groups, and expert moderation
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== NSFW Forum Categories ====================

export interface NSFWForumCategory {
  id: string
  category_name: string
  description: string | null
  slug: string
  icon: string | null
  color: string | null
  allows_anonymous: boolean
  requires_moderation: boolean
  is_expert_moderated: boolean
  thread_count: number
  post_count: number
  last_activity_at: string | null
  created_at: string
  updated_at: string
}

export async function getNSFWForumCategories(): Promise<NSFWForumCategory[]> {
  try {
    const { data, error } = await supabase
      .from('nsfw_forum_categories')
      .select('*')
      .order('last_activity_at', { ascending: false, nullsLast: true })

    if (error) {
      logger.error('Error fetching categories:', error)
      return []
    }

    return (data || []) as NSFWForumCategory[]
  } catch (error) {
    logger.error('Error in getNSFWForumCategories:', error)
    return []
  }
}

// ==================== NSFW Forum Threads ====================

export interface NSFWForumThread {
  id: string
  category_id: string
  user_id: string | null
  title: string
  content: string
  is_anonymous: boolean
  is_qa_thread: boolean
  is_success_story: boolean
  is_support_group: boolean
  is_approved: boolean
  is_pinned: boolean
  is_locked: boolean
  moderation_notes: string | null
  moderated_by: string | null
  moderated_at: string | null
  view_count: number
  reply_count: number
  like_count: number
  helpful_count: number
  last_reply_at: string | null
  last_reply_by: string | null
  created_at: string
  updated_at: string
}

export async function createNSFWForumThread(
  categoryId: string,
  title: string,
  content: string,
  isAnonymous: boolean = false,
  isQAThread: boolean = false,
  isSuccessStory: boolean = false
): Promise<NSFWForumThread | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user && !isAnonymous) {
      toast.error('Please sign in to create a thread')
      return null
    }

    const { data, error } = await supabase
      .from('nsfw_forum_threads')
      .insert({
        category_id: categoryId,
        user_id: isAnonymous ? null : user?.id || null,
        title,
        content,
        is_anonymous: isAnonymous,
        is_qa_thread: isQAThread,
        is_success_story: isSuccessStory
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating thread:', error)
      toast.error('Failed to create thread')
      return null
    }

    toast.success('Thread created!')
    return data as NSFWForumThread
  } catch (error) {
    logger.error('Error in createNSFWForumThread:', error)
    return null
  }
}

export async function getNSFWForumThreads(
  categoryId?: string,
  isSuccessStory?: boolean
): Promise<NSFWForumThread[]> {
  try {
    let query = supabase
      .from('nsfw_forum_threads')
      .select('*')
      .eq('is_approved', true)
      .order('is_pinned', { ascending: false })
      .order('last_reply_at', { ascending: false, nullsLast: true })
      .order('created_at', { ascending: false })

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    if (isSuccessStory !== undefined) {
      query = query.eq('is_success_story', isSuccessStory)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching threads:', error)
      return []
    }

    return (data || []) as NSFWForumThread[]
  } catch (error) {
    logger.error('Error in getNSFWForumThreads:', error)
    return []
  }
}

// ==================== NSFW Forum Posts ====================

export interface NSFWForumPost {
  id: string
  thread_id: string
  user_id: string | null
  content: string
  is_anonymous: boolean
  is_expert_answer: boolean
  like_count: number
  helpful_count: number
  is_approved: boolean
  moderation_notes: string | null
  created_at: string
  updated_at: string
}

export async function createNSFWForumPost(
  threadId: string,
  content: string,
  isAnonymous: boolean = false
): Promise<NSFWForumPost | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user && !isAnonymous) {
      toast.error('Please sign in to post')
      return null
    }

    const { data, error } = await supabase
      .from('nsfw_forum_posts')
      .insert({
        thread_id: threadId,
        user_id: isAnonymous ? null : user?.id || null,
        content,
        is_anonymous: isAnonymous
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating post:', error)
      toast.error('Failed to create post')
      return null
    }

    // Update thread reply count
    await supabase.rpc('increment', {
      table_name: 'nsfw_forum_threads',
      column_name: 'reply_count',
      id: threadId
    })

    toast.success('Post created!')
    return data as NSFWForumPost
  } catch (error) {
    logger.error('Error in createNSFWForumPost:', error)
    return null
  }
}

export async function getNSFWForumPosts(threadId: string): Promise<NSFWForumPost[]> {
  try {
    const { data, error } = await supabase
      .from('nsfw_forum_posts')
      .select('*')
      .eq('thread_id', threadId)
      .eq('is_approved', true)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching posts:', error)
      return []
    }

    return (data || []) as NSFWForumPost[]
  } catch (error) {
    logger.error('Error in getNSFWForumPosts:', error)
    return []
  }
}

// ==================== NSFW Support Groups ====================

export interface NSFWSupportGroup {
  id: string
  user_id: string
  group_name: string
  description: string | null
  category: 'health_condition' | 'treatment' | 'recovery' | 'general_support' | 'anonymous' | null
  is_private: boolean
  requires_approval: boolean
  is_anonymous: boolean
  member_count: number
  post_count: number
  last_activity_at: string | null
  created_at: string
  updated_at: string
}

export async function createNSFWSupportGroup(
  groupName: string,
  description: string,
  category: NSFWSupportGroup['category'],
  isPrivate: boolean = false
): Promise<NSFWSupportGroup | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create a support group')
      return null
    }

    const { data, error } = await supabase
      .from('nsfw_support_groups')
      .insert({
        user_id: user.id,
        group_name: groupName,
        description,
        category,
        is_private: isPrivate
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating support group:', error)
      toast.error('Failed to create support group')
      return null
    }

    // Add creator as admin member
    await supabase
      .from('nsfw_support_group_members')
      .insert({
        group_id: data.id,
        user_id: user.id,
        role: 'admin'
      })

    toast.success('Support group created!')
    return data as NSFWSupportGroup
  } catch (error) {
    logger.error('Error in createNSFWSupportGroup:', error)
    return null
  }
}

// ==================== NSFW Community Challenges ====================

export interface NSFWCommunityChallenge {
  id: string
  challenge_name: string
  description: string
  category: string | null
  start_date: string
  end_date: string
  duration_days: number | null
  participant_count: number
  completion_count: number
  has_leaderboard: boolean
  is_anonymous_leaderboard: boolean
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export async function getNSFWCommunityChallenges(): Promise<NSFWCommunityChallenge[]> {
  try {
    const { data, error } = await supabase
      .from('nsfw_community_challenges')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('start_date', { ascending: false })

    if (error) {
      logger.error('Error fetching challenges:', error)
      return []
    }

    return (data || []) as NSFWCommunityChallenge[]
  } catch (error) {
    logger.error('Error in getNSFWCommunityChallenges:', error)
    return []
  }
}

