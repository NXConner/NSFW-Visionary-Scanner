/**
 * Live Support Chat System
 * Handles real-time support chat with AI-powered responses and human escalation
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Support Chat Sessions ====================

export interface SupportChatSession {
  id: string
  user_id: string
  status: 'active' | 'waiting' | 'assigned' | 'resolved' | 'closed'
  assigned_to: string | null
  assigned_at: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_premium_user: boolean
  ai_handled: boolean
  escalated_to_human: boolean
  escalated_at: string | null
  escalation_reason: string | null
  resolved_at: string | null
  resolution_summary: string | null
  satisfaction_rating: number | null
  feedback_text: string | null
  user_agent: string | null
  ip_address: string | null
  language: string
  created_at: string
  updated_at: string
  last_message_at: string | null
}

export interface SupportChatMessage {
  id: string
  session_id: string
  sender_type: 'user' | 'ai' | 'staff'
  sender_id: string | null
  content: string
  is_ai_generated: boolean
  ai_model: string | null
  ai_confidence: number | null
  quick_actions: any[] | null
  attachments: any[] | null
  is_read: boolean
  read_at: string | null
  suggested_escalation: boolean
  suggested_escalation_reason: string | null
  created_at: string
}

export interface QuickResponse {
  id: string
  title: string
  content: string
  category: 'greeting' | 'technical' | 'billing' | 'account' | 'feature' | 'general' | null
  is_ai_enabled: boolean
  is_staff_only: boolean
  usage_count: number
  success_rate: number | null
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Create a new support chat session
 */
export async function createSupportChatSession(
  priority: SupportChatSession['priority'] = 'normal'
): Promise<SupportChatSession | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to start a chat')
      return null
    }

    // Check if user has premium subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    const isPremium = subscription?.tier === 'premium' || subscription?.tier === 'enterprise'

    const { data, error } = await supabase
      .from('support_chat_sessions')
      .insert({
        user_id: user.id,
        priority: isPremium ? 'high' : priority,
        is_premium_user: isPremium,
        language: navigator.language || 'en'
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating chat session:', error)
      toast.error('Failed to start chat')
      return null
    }

    return data as SupportChatSession
  } catch (error) {
    logger.error('Error in createSupportChatSession:', error)
    return null
  }
}

/**
 * Get active support chat session for current user
 */
export async function getActiveSupportChatSession(): Promise<SupportChatSession | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('support_chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'waiting', 'assigned'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No active session found
        return null
      }
      logger.error('Error fetching chat session:', error)
      return null
    }

    return data as SupportChatSession
  } catch (error) {
    logger.error('Error in getActiveSupportChatSession:', error)
    return null
  }
}

/**
 * Get all support chat sessions for current user
 */
export async function getSupportChatSessions(): Promise<SupportChatSession[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('support_chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching chat sessions:', error)
      return []
    }

    return (data || []) as SupportChatSession[]
  } catch (error) {
    logger.error('Error in getSupportChatSessions:', error)
    return []
  }
}

/**
 * Get messages for a support chat session
 */
export async function getSupportChatMessages(sessionId: string): Promise<SupportChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('support_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching chat messages:', error)
      return []
    }

    return (data || []) as SupportChatMessage[]
  } catch (error) {
    logger.error('Error in getSupportChatMessages:', error)
    return []
  }
}

/**
 * Send a user message in support chat
 */
export async function sendSupportChatMessage(
  sessionId: string,
  content: string,
  attachments?: any[]
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to send a message')
      return false
    }

    const { error } = await supabase
      .from('support_chat_messages')
      .insert({
        session_id: sessionId,
        sender_type: 'user',
        sender_id: user.id,
        content,
        attachments: attachments || null
      })

    if (error) {
      logger.error('Error sending message:', error)
      toast.error('Failed to send message')
      return false
    }

    // Update session last_message_at
    await supabase
      .from('support_chat_sessions')
      .update({ 
        last_message_at: new Date().toISOString(),
        status: 'active'
      })
      .eq('id', sessionId)

    // Trigger AI response (this would be handled by a Supabase Edge Function)
    // For now, we'll just return success
    return true
  } catch (error) {
    logger.error('Error in sendSupportChatMessage:', error)
    return false
  }
}

/**
 * Get AI response for a user message
 * This would typically be handled by a Supabase Edge Function
 */
export async function getAIResponse(
  sessionId: string,
  userMessage: string
): Promise<string | null> {
  try {
    // Call Supabase Edge Function for AI response
    const { data, error } = await supabase.functions.invoke('support-chat-ai', {
      body: {
        session_id: sessionId,
        message: userMessage
      }
    })

    if (error) {
      logger.error('Error getting AI response:', error)
      return null
    }

    return data.response || null
  } catch (error) {
    logger.error('Error in getAIResponse:', error)
    return null
  }
}

/**
 * Escalate chat to human support
 */
export async function escalateToHuman(
  sessionId: string,
  reason?: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to escalate')
      return false
    }

    const { error } = await supabase
      .from('support_chat_sessions')
      .update({
        escalated_to_human: true,
        escalated_at: new Date().toISOString(),
        escalation_reason: reason || 'User requested human support',
        status: 'waiting',
        ai_handled: false
      })
      .eq('id', sessionId)

    if (error) {
      logger.error('Error escalating chat:', error)
      toast.error('Failed to escalate chat')
      return false
    }

    toast.success('Chat escalated to human support')
    return true
  } catch (error) {
    logger.error('Error in escalateToHuman:', error)
    return false
  }
}

/**
 * Get quick responses (templates)
 */
export async function getQuickResponses(
  category?: QuickResponse['category']
): Promise<QuickResponse[]> {
  try {
    let query = supabase
      .from('support_chat_quick_responses')
      .select('*')
      .eq('is_staff_only', false)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('usage_count', { ascending: false })

    if (error) {
      logger.error('Error fetching quick responses:', error)
      return []
    }

    return (data || []) as QuickResponse[]
  } catch (error) {
    logger.error('Error in getQuickResponses:', error)
    return []
  }
}

/**
 * Close a support chat session
 */
export async function closeSupportChatSession(
  sessionId: string,
  resolutionSummary?: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to close chat')
      return false
    }

    const { error } = await supabase
      .from('support_chat_sessions')
      .update({
        status: 'closed',
        resolved_at: new Date().toISOString(),
        resolution_summary: resolutionSummary || null
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)

    if (error) {
      logger.error('Error closing chat session:', error)
      toast.error('Failed to close chat')
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in closeSupportChatSession:', error)
    return false
  }
}

/**
 * Submit feedback for a support chat session
 */
export async function submitChatFeedback(
  sessionId: string,
  rating: number,
  feedbackText?: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to submit feedback')
      return false
    }

    const { error } = await supabase
      .from('support_chat_sessions')
      .update({
        satisfaction_rating: rating,
        feedback_text: feedbackText || null
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)

    if (error) {
      logger.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
      return false
    }

    toast.success('Thank you for your feedback!')
    return true
  } catch (error) {
    logger.error('Error in submitChatFeedback:', error)
    return false
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(sessionId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('support_chat_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .neq('sender_type', 'user')
      .is('read_at', null)

    if (error) {
      logger.error('Error marking messages as read:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in markMessagesAsRead:', error)
    return false
  }
}

