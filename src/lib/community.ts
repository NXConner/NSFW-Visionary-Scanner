/**
 * Community System
 * Handles forums, posts, comments, likes, follows, messages, and challenges
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

export interface Forum {
  id: string
  name: string
  description: string | null
  category: 'general' | 'health' | 'progress' | 'support' | 'nsfw' | 'education'
  icon_url: string | null
  is_nsfw: boolean
  is_active: boolean
  member_count: number
  post_count: number
  created_at: string
  updated_at: string
}

export interface ForumPost {
  id: string
  forum_id: string
  user_id: string
  title: string
  content: string
  is_anonymous: boolean
  is_pinned: boolean
  is_locked: boolean
  view_count: number
  like_count: number
  comment_count: number
  tags: string[]
  created_at: string
  updated_at: string
  author?: {
    display_name: string
    is_anonymous: boolean
  }
}

export interface ForumComment {
  id: string
  post_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  is_anonymous: boolean
  like_count: number
  created_at: string
  updated_at: string
  author?: {
    display_name: string
    is_anonymous: boolean
  }
  replies?: ForumComment[]
}

export interface DirectMessage {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface CommunityChallenge {
  id: string
  title: string
  description: string
  challenge_type: 'streak' | 'goal' | 'milestone' | 'community'
  start_date: string
  end_date: string
  rules: Record<string, any> | null
  rewards: Record<string, any> | null
  participant_count: number
  is_active: boolean
  created_at: string
}

/**
 * Get all forums
 */
export async function getForums(category?: string): Promise<Forum[]> {
  try {
    let query = supabase
      .from('community_forums')
      .select('*')
      .eq('is_active', true)
      .order('post_count', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching forums:', error)
      return []
    }

    return (data || []) as Forum[]
  } catch (error) {
    logger.error('Error getting forums:', error)
    return []
  }
}

/**
 * Get forum posts
 */
export async function getForumPosts(
  forumId: string,
  limit: number = 20
): Promise<ForumPost[]> {
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('forum_id', forumId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching posts:', error)
      return []
    }

    return (data || []) as ForumPost[]
  } catch (error) {
    logger.error('Error getting forum posts:', error)
    return []
  }
}

/**
 * Create forum post
 */
export async function createForumPost(
  forumId: string,
  title: string,
  content: string,
  tags: string[] = [],
  isAnonymous: boolean = false
): Promise<ForumPost | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create a post')
      return null
    }

    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        forum_id: forumId,
        user_id: user.id,
        title,
        content,
        tags,
        is_anonymous: isAnonymous
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating post:', error)
      toast.error('Failed to create post')
      return null
    }

    toast.success('Post created successfully!')
    return data as ForumPost
  } catch (error) {
    logger.error('Error in createForumPost:', error)
    return null
  }
}

/**
 * Get post comments
 */
export async function getPostComments(postId: string): Promise<ForumComment[]> {
  try {
    const { data, error } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('post_id', postId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching comments:', error)
      return []
    }

    // Get replies for each comment
    const comments = (data || []) as ForumComment[]
    for (const comment of comments) {
      const { data: replies } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('parent_comment_id', comment.id)
        .order('created_at', { ascending: true })
      comment.replies = (replies || []) as ForumComment[]
    }

    return comments
  } catch (error) {
    logger.error('Error getting post comments:', error)
    return []
  }
}

/**
 * Create comment
 */
export async function createComment(
  postId: string,
  content: string,
  parentCommentId?: string,
  isAnonymous: boolean = false
): Promise<ForumComment | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to comment')
      return null
    }

    const { data, error } = await supabase
      .from('forum_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_comment_id: parentCommentId || null,
        is_anonymous: isAnonymous
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating comment:', error)
      toast.error('Failed to create comment')
      return null
    }

    toast.success('Comment posted!')
    return data as ForumComment
  } catch (error) {
    logger.error('Error in createComment:', error)
    return null
  }
}

/**
 * Like/unlike post
 */
export async function togglePostLike(postId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to like posts')
      return false
    }

    // Check if already liked
    const { data: existing } = await supabase
      .from('forum_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Unlike
      const { error } = await supabase
        .from('forum_post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (error) throw error
      return false
    } else {
      // Like
      const { error } = await supabase
        .from('forum_post_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        })

      if (error) throw error
      return true
    }
  } catch (error) {
    logger.error('Error toggling post like:', error)
    return false
  }
}

/**
 * Get active challenges
 */
export async function getActiveChallenges(): Promise<CommunityChallenge[]> {
  try {
    const { data, error } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching challenges:', error)
      return []
    }

    return (data || []) as CommunityChallenge[]
  } catch (error) {
    logger.error('Error getting challenges:', error)
    return []
  }
}

/**
 * Join challenge
 */
export async function joinChallenge(challengeId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to join challenges')
      return false
    }

    const { error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: user.id
      })

    if (error) {
      logger.error('Error joining challenge:', error)
      toast.error('Failed to join challenge')
      return false
    }

    // Update participant count
    await supabase.rpc('increment_challenge_participants', {
      challenge_id: challengeId
    })

    toast.success('Challenge joined!')
    return true
  } catch (error) {
    logger.error('Error in joinChallenge:', error)
    return false
  }
}

/**
 * Get direct messages
 */
export async function getDirectMessages(userId?: string): Promise<DirectMessage[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const currentUserId = userId || user.id

    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      logger.error('Error fetching messages:', error)
      return []
    }

    return (data || []) as DirectMessage[]
  } catch (error) {
    logger.error('Error getting messages:', error)
    return []
  }
}

/**
 * Send direct message
 */
export async function sendDirectMessage(
  recipientId: string,
  content: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to send messages')
      return false
    }

    const { error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content
      })

    if (error) {
      logger.error('Error sending message:', error)
      toast.error('Failed to send message')
      return false
    }

    toast.success('Message sent!')
    return true
  } catch (error) {
    logger.error('Error in sendDirectMessage:', error)
    return false
  }
}

/**
 * Follow/unfollow user
 */
export async function toggleFollow(userId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to follow users')
      return false
    }

    if (user.id === userId) {
      toast.error('You cannot follow yourself')
      return false
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single()

    if (existing) {
      // Unfollow
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId)

      if (error) throw error
      toast.success('Unfollowed')
      return false
    } else {
      // Follow
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        })

      if (error) throw error
      toast.success('Following!')
      return true
    }
  } catch (error) {
    logger.error('Error toggling follow:', error)
    return false
  }
}

