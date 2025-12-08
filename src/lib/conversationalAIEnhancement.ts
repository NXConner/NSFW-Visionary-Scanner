/**
 * Conversational AI Enhancement
 * Handles enhanced AI chatbot with voice interaction, multi-modal AI, contextual memory, and emotional intelligence
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== AI Conversation Sessions ====================

export interface AIConversationSession {
  id: string
  user_id: string
  session_name: string | null
  conversation_mode: 'casual' | 'expert' | 'medical' | 'support'
  language: string
  context_summary: string | null
  user_preferences: any
  is_active: boolean
  last_activity_at: string
  created_at: string
  updated_at: string
}

export async function createAIConversationSession(
  sessionName?: string,
  conversationMode: AIConversationSession['conversation_mode'] = 'casual'
): Promise<AIConversationSession | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to start conversation')
      return null
    }

    const { data, error } = await supabase
      .from('ai_conversation_sessions')
      .insert({
        user_id: user.id,
        session_name: sessionName || null,
        conversation_mode: conversationMode
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating session:', error)
      return null
    }

    return data as AIConversationSession
  } catch (error) {
    logger.error('Error in createAIConversationSession:', error)
    return null
  }
}

export async function getAIConversationSessions(): Promise<AIConversationSession[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('ai_conversation_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('last_activity_at', { ascending: false })

    if (error) {
      logger.error('Error fetching sessions:', error)
      return []
    }

    return (data || []) as AIConversationSession[]
  } catch (error) {
    logger.error('Error in getAIConversationSessions:', error)
    return []
  }
}

// ==================== AI Conversation Messages ====================

export interface AIConversationMessage {
  id: string
  session_id: string
  user_id: string
  message_type: 'text' | 'voice' | 'image' | 'mixed'
  content_text: string | null
  content_audio_url: string | null
  content_image_url: string | null
  transcription: string | null
  sender_type: 'user' | 'ai'
  ai_model_version: string | null
  ai_confidence: number | null
  ai_reasoning: string | null
  emotional_tone: string | null
  sentiment_score: number | null
  context_references: string[] | null
  referenced_data: any
  proactive_suggestions: any
  created_at: string
}

export async function sendAIMessage(
  sessionId: string,
  content: string,
  messageType: AIConversationMessage['message_type'] = 'text'
): Promise<AIConversationMessage | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to send message')
      return null
    }

    // Create user message
    const { data: userMessage, error: userError } = await supabase
      .from('ai_conversation_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        message_type: messageType,
        content_text: content,
        sender_type: 'user'
      })
      .select()
      .single()

    if (userError) {
      logger.error('Error sending message:', userError)
      return null
    }

    // Call AI Edge Function to get response
    const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-chat-response', {
      body: {
        session_id: sessionId,
        user_message: content,
        message_type: messageType
      }
    })

    if (aiError) {
      logger.error('Error getting AI response:', aiError)
      return userMessage as AIConversationMessage
    }

    // Create AI response message
    const { data: aiMessage, error: aiMessageError } = await supabase
      .from('ai_conversation_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        message_type: 'text',
        content_text: aiResponse.response,
        sender_type: 'ai',
        ai_model_version: aiResponse.model_version,
        ai_confidence: aiResponse.confidence,
        emotional_tone: aiResponse.emotional_tone,
        sentiment_score: aiResponse.sentiment_score,
        proactive_suggestions: aiResponse.proactive_suggestions
      })
      .select()
      .single()

    if (aiMessageError) {
      logger.error('Error saving AI response:', aiMessageError)
    }

    return userMessage as AIConversationMessage
  } catch (error) {
    logger.error('Error in sendAIMessage:', error)
    return null
  }
}

export async function getAIConversationMessages(sessionId: string): Promise<AIConversationMessage[]> {
  try {
    const { data, error } = await supabase
      .from('ai_conversation_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching messages:', error)
      return []
    }

    return (data || []) as AIConversationMessage[]
  } catch (error) {
    logger.error('Error in getAIConversationMessages:', error)
    return []
  }
}

// ==================== AI Contextual Memory ====================

export interface AIContextualMemory {
  id: string
  user_id: string
  memory_type: 'preference' | 'fact' | 'goal' | 'concern' | 'history'
  memory_key: string
  memory_value: any
  source_session_id: string | null
  source_message_id: string | null
  importance_score: number
  access_count: number
  last_accessed_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export async function getAIContextualMemory(
  memoryType?: AIContextualMemory['memory_type']
): Promise<AIContextualMemory[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('ai_contextual_memory')
      .select('*')
      .eq('user_id', user.id)
      .order('importance_score', { ascending: false })
      .order('last_accessed_at', { ascending: false, nullsLast: true })

    if (memoryType) {
      query = query.eq('memory_type', memoryType)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching memory:', error)
      return []
    }

    return (data || []) as AIContextualMemory[]
  } catch (error) {
    logger.error('Error in getAIContextualMemory:', error)
    return []
  }
}

// ==================== AI Proactive Suggestions ====================

export interface AIProactiveSuggestion {
  id: string
  user_id: string
  suggestion_type: 'health_tip' | 'reminder' | 'routine_suggestion' | 'data_review' | 'goal_check' | 'other'
  suggestion_title: string
  suggestion_content: string
  suggestion_action: any
  ai_confidence: number | null
  ai_reasoning: string | null
  trigger_condition: any
  suggestion_status: 'pending' | 'shown' | 'accepted' | 'dismissed' | 'expired'
  shown_at: string | null
  accepted_at: string | null
  dismissed_at: string | null
  expires_at: string | null
  created_at: string
}

export async function getAIProactiveSuggestions(): Promise<AIProactiveSuggestion[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('ai_proactive_suggestions')
      .select('*')
      .eq('user_id', user.id)
      .in('suggestion_status', ['pending', 'shown'])
      .order('ai_confidence', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching suggestions:', error)
      return []
    }

    return (data || []) as AIProactiveSuggestion[]
  } catch (error) {
    logger.error('Error in getAIProactiveSuggestions:', error)
    return []
  }
}

export async function acceptAISuggestion(suggestionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_proactive_suggestions')
      .update({
        suggestion_status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', suggestionId)

    if (error) {
      logger.error('Error accepting suggestion:', error)
      return false
    }

    return true
  } catch (error) {
    logger.error('Error in acceptAISuggestion:', error)
    return false
  }
}

