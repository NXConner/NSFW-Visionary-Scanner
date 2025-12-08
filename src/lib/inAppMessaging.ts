/**
 * In-App Messaging System
 * Handles direct messaging, support tickets, expert consultations, and group chats
 */

import { supabase } from '@/integrations/supabase/client'
import { logger } from './logger'
import { toast } from 'sonner'

// ==================== Support Tickets ====================

export interface SupportTicket {
  id: string
  user_id: string
  subject: string
  description: string
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'account' | 'general' | 'premium_support'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed'
  assigned_to: string | null
  assigned_at: string | null
  resolution: string | null
  resolved_at: string | null
  resolved_by: string | null
  satisfaction_rating: number | null
  feedback_text: string | null
  created_at: string
  updated_at: string
}

export interface SupportTicketMessage {
  id: string
  ticket_id: string
  user_id: string | null
  is_staff: boolean
  content: string
  attachments: any[] | null
  is_internal: boolean
  is_read: boolean
  read_at: string | null
  created_at: string
}

export async function createSupportTicket(
  subject: string,
  description: string,
  category: SupportTicket['category'],
  priority: SupportTicket['priority'] = 'medium'
): Promise<SupportTicket | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create a support ticket')
      return null
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        subject,
        description,
        category,
        priority
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating support ticket:', error)
      toast.error('Failed to create support ticket')
      return null
    }

    toast.success('Support ticket created!')
    return data as SupportTicket
  } catch (error) {
    logger.error('Error in createSupportTicket:', error)
    return null
  }
}

export async function getSupportTickets(status?: SupportTicket['status']): Promise<SupportTicket[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching support tickets:', error)
      return []
    }

    return (data || []) as SupportTicket[]
  } catch (error) {
    logger.error('Error in getSupportTickets:', error)
    return []
  }
}

export async function getSupportTicketMessages(ticketId: string): Promise<SupportTicketMessage[]> {
  try {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching ticket messages:', error)
      return []
    }

    return (data || []) as SupportTicketMessage[]
  } catch (error) {
    logger.error('Error in getSupportTicketMessages:', error)
    return []
  }
}

export async function sendTicketMessage(
  ticketId: string,
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
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        content,
        attachments: attachments || null
      })

    if (error) {
      logger.error('Error sending ticket message:', error)
      toast.error('Failed to send message')
      return false
    }

    // Update ticket updated_at
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    return true
  } catch (error) {
    logger.error('Error in sendTicketMessage:', error)
    return false
  }
}

// ==================== Expert Consultations ====================

export interface ExpertConsultation {
  id: string
  user_id: string
  expert_id: string
  consultation_type: 'video_call' | 'voice_call' | 'text_chat' | 'email'
  topic: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  price: number
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed'
  payment_intent_id: string | null
  meeting_link: string | null
  meeting_id: string | null
  notes: string | null
  rating: number | null
  review_text: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export async function bookExpertConsultation(
  expertId: string,
  consultationType: ExpertConsultation['consultation_type'],
  topic: string,
  scheduledAt: string,
  durationMinutes: number = 30,
  price: number,
  description?: string
): Promise<ExpertConsultation | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to book a consultation')
      return null
    }

    const { data, error } = await supabase
      .from('expert_consultations')
      .insert({
        user_id: user.id,
        expert_id: expertId,
        consultation_type: consultationType,
        topic,
        description,
        scheduled_at: scheduledAt,
        duration_minutes: durationMinutes,
        price
      })
      .select()
      .single()

    if (error) {
      logger.error('Error booking consultation:', error)
      toast.error('Failed to book consultation')
      return null
    }

    toast.success('Consultation booked!')
    return data as ExpertConsultation
  } catch (error) {
    logger.error('Error in bookExpertConsultation:', error)
    return null
  }
}

export async function getExpertConsultations(): Promise<ExpertConsultation[]> {
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
    logger.error('Error in getExpertConsultations:', error)
    return []
  }
}

// ==================== Group Chats ====================

export interface GroupChat {
  id: string
  name: string
  description: string | null
  category: 'support' | 'health_condition' | 'treatment' | 'recovery' | 'general' | 'premium'
  created_by: string
  is_private: boolean
  is_premium: boolean
  member_count: number
  message_count: number
  last_message_at: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface GroupChatMessage {
  id: string
  group_id: string
  user_id: string
  content: string
  attachments: any[] | null
  is_edited: boolean
  edited_at: string | null
  is_deleted: boolean
  deleted_at: string | null
  reply_to_message_id: string | null
  created_at: string
  updated_at: string
}

export async function createGroupChat(
  name: string,
  description: string,
  category: GroupChat['category'],
  isPrivate: boolean = false,
  isPremium: boolean = false
): Promise<GroupChat | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to create a group')
      return null
    }

    const { data, error } = await supabase
      .from('group_chats')
      .insert({
        name,
        description,
        category,
        created_by: user.id,
        is_private: isPrivate,
        is_premium: isPremium
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating group chat:', error)
      toast.error('Failed to create group')
      return null
    }

    // Add creator as admin member
    await supabase
      .from('group_chat_members')
      .insert({
        group_id: data.id,
        user_id: user.id,
        role: 'admin'
      })

    toast.success('Group created!')
    return data as GroupChat
  } catch (error) {
    logger.error('Error in createGroupChat:', error)
    return null
  }
}

export async function getGroupChats(category?: GroupChat['category']): Promise<GroupChat[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('group_chats')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching group chats:', error)
      return []
    }

    // Filter to only show groups user is a member of or public groups
    const userGroups = await supabase
      .from('group_chat_members')
      .select('group_id')
      .eq('user_id', user.id)

    const userGroupIds = (userGroups.data || []).map(g => g.group_id)

    return (data || []).filter((group: GroupChat) => 
      !group.is_private || userGroupIds.includes(group.id)
    ) as GroupChat[]
  } catch (error) {
    logger.error('Error in getGroupChats:', error)
    return []
  }
}

export async function joinGroupChat(groupId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to join a group')
      return false
    }

    const { error } = await supabase
      .from('group_chat_members')
      .insert({
        group_id: groupId,
        user_id: user.id
      })

    if (error) {
      logger.error('Error joining group:', error)
      toast.error('Failed to join group')
      return false
    }

    // Update member count
    await supabase.rpc('increment', {
      table_name: 'group_chats',
      column_name: 'member_count',
      id: groupId
    })

    toast.success('Joined group!')
    return true
  } catch (error) {
    logger.error('Error in joinGroupChat:', error)
    return false
  }
}

export async function getGroupChatMessages(groupId: string, limit: number = 50): Promise<GroupChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('group_chat_messages')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching group messages:', error)
      return []
    }

    return (data || []).reverse() as GroupChatMessage[]
  } catch (error) {
    logger.error('Error in getGroupChatMessages:', error)
    return []
  }
}

export async function sendGroupChatMessage(
  groupId: string,
  content: string,
  attachments?: any[],
  replyToMessageId?: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in to send a message')
      return false
    }

    const { error } = await supabase
      .from('group_chat_messages')
      .insert({
        group_id: groupId,
        user_id: user.id,
        content,
        attachments: attachments || null,
        reply_to_message_id: replyToMessageId || null
      })

    if (error) {
      logger.error('Error sending group message:', error)
      toast.error('Failed to send message')
      return false
    }

    // Update group last_message_at and message_count
    await supabase
      .from('group_chats')
      .update({
        last_message_at: new Date().toISOString(),
        message_count: supabase.rpc('increment', {
          table_name: 'group_chats',
          column_name: 'message_count',
          id: groupId
        })
      })
      .eq('id', groupId)

    return true
  } catch (error) {
    logger.error('Error in sendGroupChatMessage:', error)
    return false
  }
}

// ==================== Direct Messages (from community.ts) ====================
// These functions already exist in community.ts, but we'll re-export them here for convenience

export { getDirectMessages, sendDirectMessage } from './community'

