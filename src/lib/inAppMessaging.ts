/**
 * In-App Messaging System - Supabase implementation
 *
 * Backed by tables created in:
 * - `supabase/migrations/20251207000015_in_app_messaging.sql` (tickets/consultations/groups)
 * - `supabase/migrations/20251207000008_community_system.sql` (direct_messages)
 */

import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";

type JsonObject = Record<string, unknown>;

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category:
    | "technical"
    | "billing"
    | "feature_request"
    | "bug_report"
    | "account"
    | "general"
    | "premium_support";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  assigned_to: string | null;
  assigned_at: string | null;
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  satisfaction_rating: number | null;
  feedback_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  user_id: string | null;
  is_staff: boolean;
  content: string;
  attachments: JsonObject[] | null;
  is_internal: boolean;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ExpertConsultation {
  id: string;
  user_id: string;
  expert_id: string;
  consultation_type: "video_call" | "voice_call" | "text_chat" | "email";
  topic: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  price: number;
  payment_status: "pending" | "paid" | "refunded" | "failed";
  payment_intent_id: string | null;
  meeting_link: string | null;
  meeting_id: string | null;
  notes: string | null;
  rating: number | null;
  review_text: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  category: "support" | "health_condition" | "treatment" | "recovery" | "general" | "premium";
  created_by: string;
  is_private: boolean;
  is_premium: boolean;
  member_count: number;
  message_count: number;
  last_message_at: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  attachments: JsonObject[] | null;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  reply_to_message_id: string | null;
  created_at: string;
  updated_at: string;
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function nowIso() {
  return new Date().toISOString();
}

export async function createSupportTicket(
  subject: string,
  description: string,
  category: SupportTicket["category"],
  priority: SupportTicket["priority"] = "medium",
): Promise<SupportTicket | null> {
  const userId = await requireUserId();

  const { data: ticket, error: ticketErr } = await fromExtended("support_tickets")
    .insert({
      user_id: userId,
      subject,
      description,
      category,
      priority,
      status: "open",
    })
    .select("*")
    .single();

  if (ticketErr) throw ticketErr;

  const ticketData = ticket as Record<string, unknown>;

  // Seed a first message with the description (so the thread has a message timeline).
  try {
    await fromExtended("support_ticket_messages").insert({
      ticket_id: ticketData?.id,
      user_id: userId,
      is_staff: false,
      content: description,
      attachments: null,
      is_internal: false,
      is_read: true,
      read_at: nowIso(),
    });
  } catch {
    // non-fatal
  }

  return (ticket ?? null) as unknown as SupportTicket | null;
}

export async function getSupportTickets(
  status?: SupportTicket["status"],
): Promise<SupportTicket[]> {
  const userId = await requireUserId();

  let q = fromExtended("support_tickets")
    .select("*")
    .eq("user_id", userId);
  if (status) q = q.eq("status", status);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as SupportTicket[];
}

export async function getSupportTicketMessages(
  ticketId: string,
  limit = 100,
): Promise<SupportTicketMessage[]> {
  const { data, error } = await fromExtended("support_ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as SupportTicketMessage[];
}

export async function sendTicketMessage(
  ticketId: string,
  content: string,
  attachments?: JsonObject[],
): Promise<boolean> {
  const userId = await requireUserId();
  const trimmed = content.trim();
  if (!trimmed) return false;

  const { error } = await fromExtended("support_ticket_messages").insert({
    ticket_id: ticketId,
    user_id: userId,
    is_staff: false,
    content: trimmed,
    attachments: attachments ?? null,
    is_internal: false,
    is_read: true,
    read_at: nowIso(),
  });
  if (error) throw error;

  // Touch ticket updated_at and nudge status if needed (best-effort).
  try {
    await fromExtended("support_tickets")
      .update({ updated_at: nowIso(), status: "open" })
      .eq("id", ticketId)
      .eq("user_id", userId);
  } catch {
    // ignore
  }

  return true;
}

export async function bookExpertConsultation(
  expertId: string,
  consultationType: ExpertConsultation["consultation_type"],
  topic: string,
  scheduledAt: string,
  durationMinutes: number = 30,
  price: number,
  description?: string,
): Promise<ExpertConsultation | null> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("expert_consultations")
    .insert({
      user_id: userId,
      expert_id: expertId,
      consultation_type: consultationType,
      topic,
      description: description ?? null,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      price,
      payment_status: "pending",
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as ExpertConsultation | null;
}

export async function getExpertConsultations(): Promise<ExpertConsultation[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("expert_consultations")
    .select("*")
    .or(`user_id.eq.${userId},expert_id.eq.${userId}`)
    .order("scheduled_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as ExpertConsultation[];
}

export async function createGroupChat(
  name: string,
  description: string,
  category: GroupChat["category"],
  isPrivate: boolean = false,
  isPremium: boolean = false,
): Promise<GroupChat | null> {
  const userId = await requireUserId();
  const { data: group, error: groupErr } = await fromExtended("group_chats")
    .insert({
      name,
      description,
      category,
      created_by: userId,
      is_private: isPrivate,
      is_premium: isPremium,
      member_count: 1,
    })
    .select("*")
    .single();
  if (groupErr) throw groupErr;

  const groupData = group as Record<string, unknown>;

  // Add creator as an admin member (may fail for private groups depending on RLS; we handle separately in migrations).
  try {
    await fromExtended("group_chat_members")
      .insert({ group_id: groupData?.id, user_id: userId, role: "admin" });
  } catch {
    // ignore; user may need an explicit policy to self-join private groups
  }

  return (group ?? null) as unknown as GroupChat | null;
}

export async function getGroupChats(category?: GroupChat["category"]): Promise<GroupChat[]> {
  let q = fromExtended("group_chats").select("*");
  if (category) q = q.eq("category", category);
  const { data, error } = await q
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as GroupChat[];
}

export async function joinGroupChat(groupId: string): Promise<boolean> {
  const userId = await requireUserId();
  const { error } = await fromExtended("group_chat_members")
    .insert({ group_id: groupId, user_id: userId, role: "member" });
  if (error) throw error;
  return true;
}

export async function getGroupChatMessages(
  groupId: string,
  limit: number = 50,
): Promise<GroupChatMessage[]> {
  const { data, error } = await fromExtended("group_chat_messages")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as GroupChatMessage[];
}

export async function sendGroupChatMessage(
  groupId: string,
  content: string,
  attachments?: JsonObject[],
  replyToMessageId?: string,
): Promise<boolean> {
  const userId = await requireUserId();
  const trimmed = content.trim();
  if (!trimmed) return false;

  const { error } = await fromExtended("group_chat_messages").insert({
    group_id: groupId,
    user_id: userId,
    content: trimmed,
    attachments: attachments ?? null,
    reply_to_message_id: replyToMessageId ?? null,
  });
  if (error) throw error;

  // Touch group last_message_at (best-effort)
  try {
    await fromExtended("group_chats")
      .update({ last_message_at: nowIso(), updated_at: nowIso() })
      .eq("id", groupId);
  } catch {
    // ignore
  }

  return true;
}

// Re-export stubs for direct messages
export async function getDirectMessages(): Promise<JsonObject[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("direct_messages")
    .select("*")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as JsonObject[];
}

export async function getDirectConversationMessages(
  otherUserId: string,
  limit = 100,
): Promise<JsonObject[]> {
  const userId = await requireUserId();
  const lim = Math.max(1, Math.min(500, Number(limit || 100)));
  const other = String(otherUserId || "").trim();
  if (!other) return [];

  const { data, error } = await fromExtended("direct_messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${userId})`,
    )
    .order("created_at", { ascending: true })
    .limit(lim);

  if (error) throw error;
  return (data ?? []) as unknown as JsonObject[];
}

export async function markDirectMessagesRead(fromUserId: string): Promise<boolean> {
  const userId = await requireUserId();
  const from = String(fromUserId || "").trim();
  if (!from) return false;

  const { error } = await fromExtended("direct_messages")
    .update({ is_read: true, read_at: nowIso() })
    .eq("recipient_id", userId)
    .eq("sender_id", from)
    .eq("is_read", false);

  if (error) throw error;
  return true;
}

export async function sendDirectMessage(recipientId: string, content: string): Promise<boolean> {
  const senderId = await requireUserId();
  const recipient = String(recipientId || "").trim();
  const trimmed = String(content || "").trim();
  if (!recipient || !trimmed) return false;
  if (recipient === senderId) throw new Error("Cannot message yourself");

  const { error } = await fromExtended("direct_messages").insert({
    sender_id: senderId,
    recipient_id: recipient,
    content: trimmed,
    is_read: false,
    read_at: null,
  });

  if (error) throw error;
  return true;
}
