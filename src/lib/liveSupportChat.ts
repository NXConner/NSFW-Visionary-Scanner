/**
 * Live Support Chat System - Supabase implementation
 *
 * Backed by tables created in `supabase/migrations/20251207000016_live_support_chat.sql`.
 * This module focuses on persistence + basic automation. If an AI edge function is available,
 * we attempt to fetch an AI response; otherwise we fall back to deterministic quick-response routing.
 */

import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";

export interface SupportChatSession {
  id: string;
  user_id: string;
  status: "active" | "waiting" | "assigned" | "resolved" | "closed";
  assigned_to: string | null;
  assigned_at: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  is_premium_user: boolean;
  ai_handled: boolean;
  escalated_to_human: boolean;
  escalated_at: string | null;
  escalation_reason: string | null;
  resolved_at: string | null;
  resolution_summary: string | null;
  satisfaction_rating: number | null;
  feedback_text: string | null;
  user_agent: string | null;
  ip_address: string | null;
  language: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
}

export interface SupportChatMessage {
  id: string;
  session_id: string;
  sender_type: "user" | "ai" | "staff";
  sender_id: string | null;
  content: string;
  is_ai_generated: boolean;
  ai_model: string | null;
  ai_confidence: number | null;
  quick_actions: any[] | null;
  attachments: any[] | null;
  is_read: boolean;
  read_at: string | null;
  suggested_escalation: boolean;
  suggested_escalation_reason: string | null;
  created_at: string;
}

export interface QuickResponse {
  id: string;
  title: string;
  content: string;
  category: "greeting" | "technical" | "billing" | "account" | "feature" | "general" | null;
  is_ai_enabled: boolean;
  is_staff_only: boolean;
  usage_count: number;
  success_rate: number | null;
  created_by: string | null;
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

function pickRuleBasedResponse(
  userMessage: string,
  quickResponses: QuickResponse[],
): string | null {
  const msg = userMessage.toLowerCase();
  const keywordToCategory: Array<{ k: string; cat: NonNullable<QuickResponse["category"]> }> = [
    { k: "billing", cat: "billing" },
    { k: "payment", cat: "billing" },
    { k: "subscription", cat: "billing" },
    { k: "cancel", cat: "billing" },
    { k: "refund", cat: "billing" },
    { k: "login", cat: "account" },
    { k: "sign in", cat: "account" },
    { k: "password", cat: "account" },
    { k: "account", cat: "account" },
    { k: "bug", cat: "technical" },
    { k: "crash", cat: "technical" },
    { k: "error", cat: "technical" },
    { k: "slow", cat: "technical" },
    { k: "feature", cat: "feature" },
  ];

  const hit = keywordToCategory.find(x => msg.includes(x.k));
  const cat = hit?.cat ?? "general";
  const match = quickResponses.find(r => r.category === cat && !r.is_staff_only);
  return match?.content ?? null;
}

export async function createSupportChatSession(
  priority: SupportChatSession["priority"] = "normal",
): Promise<SupportChatSession | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase

    .from("support_chat_sessions" as any)
    .insert({
      user_id: userId,
      priority,
      is_premium_user: false,
      ai_handled: true,
      escalated_to_human: false,
      language: (typeof navigator !== "undefined" ? navigator.language : "en") || "en",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      last_message_at: nowIso(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as SupportChatSession | null;
}

export async function getActiveSupportChatSession(): Promise<SupportChatSession | null> {
  const userId = await requireUserId();

  const { data, error } = await fromExtended("support_chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "waiting", "assigned"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as SupportChatSession | null;
}

export async function getSupportChatSessions(): Promise<SupportChatSession[]> {
  const userId = await requireUserId();

  const { data, error } = await fromExtended("support_chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as SupportChatSession[];
}

export async function getSupportChatMessages(sessionId: string): Promise<SupportChatMessage[]> {
  const { data, error } = await supabase

    .from("support_chat_messages" as any)
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as SupportChatMessage[];
}

export async function sendSupportChatMessage(
  sessionId: string,
  content: string,
  attachments?: any[],
): Promise<boolean> {
  const userId = await requireUserId();
  const trimmed = content.trim();
  if (!trimmed) return false;

  const { error: insertErr } = await supabase.from("support_chat_messages" as any).insert({
    session_id: sessionId,
    sender_type: "user",
    sender_id: userId,
    content: trimmed,
    attachments: attachments ?? null,
    is_ai_generated: false,
    is_read: true,
    read_at: nowIso(),
  });
  if (insertErr) throw insertErr;

  // Attempt to create an AI response (best-effort).
  try {
    const ai = await getAIResponse(sessionId, trimmed);
    if (ai) {
      await supabase.from("support_chat_messages" as any).insert({
        session_id: sessionId,
        sender_type: "ai",
        sender_id: null,
        content: ai,
        is_ai_generated: true,
        ai_model: "assistant_rule_or_edge",
        ai_confidence: 0.65,
        is_read: false,
        quick_actions: null,
      });
    }
  } catch {
    // ignore AI failure; user message still persisted
  }

  // Update session last_message_at (may be blocked by RLS in some cases; ignore)
  try {
    await supabase

      .from("support_chat_sessions" as any)
      .update({ last_message_at: nowIso() })
      .eq("id", sessionId);
  } catch {
    // ignore
  }

  return true;
}

export async function getAIResponse(
  sessionId: string,
  userMessage: string,
): Promise<string | null> {
  // 1) Try an edge function if one exists (best-effort; some deployments may return JSON).
  try {
    const { data, error } = await supabase.functions.invoke("ai-health-chat", {
      body: {
        messages: [{ role: "user", content: userMessage }],
      },
    });
    if (!error && data) {
      if (typeof data === "string") return data;
      if (typeof data.response === "string") return data.response;
      if (typeof data.message === "string") return data.message;
    }
  } catch {
    // ignore
  }

  // 2) Rule-based fallback from quick responses (deterministic; no mock data).
  const responses = await getQuickResponses();
  const picked = pickRuleBasedResponse(userMessage, responses);
  return (
    picked ??
    "Thanks for reaching out. Can you share what you were trying to do, what you expected, and what actually happened? If it's a bug, include steps to reproduce."
  );
}

export async function escalateToHuman(sessionId: string, reason?: string): Promise<boolean> {
  const userId = await requireUserId();
  const { error } = await supabase

    .from("support_chat_sessions" as any)
    .update({
      escalated_to_human: true,
      escalated_at: nowIso(),
      escalation_reason: reason ?? "User requested escalation",
      status: "waiting",
      ai_handled: false,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}

export async function getQuickResponses(
  category?: QuickResponse["category"],
): Promise<QuickResponse[]> {
  let q = supabase
    .from("support_chat_quick_responses" as any)
    .select("*")
    .eq("is_staff_only", false);
  if (category) q = q.eq("category", category);
  const { data, error } = await q
    .order("usage_count", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as QuickResponse[];
}

export async function closeSupportChatSession(
  sessionId: string,
  resolutionSummary?: string,
): Promise<boolean> {
  const userId = await requireUserId();
  const { error } = await supabase

    .from("support_chat_sessions" as any)
    .update({
      status: "closed",
      resolved_at: nowIso(),
      resolution_summary: resolutionSummary ?? null,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}

export async function submitChatFeedback(
  sessionId: string,
  rating: number,
  feedbackText?: string,
): Promise<boolean> {
  const userId = await requireUserId();
  const { error } = await supabase

    .from("support_chat_sessions" as any)
    .update({
      satisfaction_rating: rating,
      feedback_text: feedbackText ?? null,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}

export async function markMessagesAsRead(sessionId: string): Promise<boolean> {
  const userId = await requireUserId();
  // Mark non-user messages as read for this user's session
  const { error } = await supabase

    .from("support_chat_messages" as any)
    .update({ is_read: true, read_at: nowIso() })
    .eq("session_id", sessionId)
    .eq("is_read", false)
    .neq("sender_type", "user");
  if (error) {
    // If RLS blocks (e.g., user doesn't own session), treat as non-fatal.
    return false;
  }

  // Touch session updated_at / last_active (best-effort)
  try {
    await supabase

      .from("support_chat_sessions" as any)
      .update({ updated_at: nowIso() })
      .eq("id", sessionId)
      .eq("user_id", userId);
  } catch {
    // ignore
  }

  return true;
}
