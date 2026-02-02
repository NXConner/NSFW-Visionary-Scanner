/**
 * Conversational AI Enhancement (Supabase-backed)
 *
 * Backed by:
 * - supabase/migrations/20251207000032_conversational_ai_enhancement.sql
 *
 * For actual LLM replies, uses edge function:
 * - supabase/functions/conversational-ai-chat
 */

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";

// ==================== AI Conversation Sessions ====================

export interface AIConversationSession {
  id: string;
  user_id: string;
  session_name: string | null;
  conversation_mode: "casual" | "expert" | "medical" | "support";
  language: string;
  context_summary: string | null;
  user_preferences: any;
  is_active: boolean;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export async function createAIConversationSession(
  sessionName?: string,
  conversationMode: AIConversationSession["conversation_mode"] = "casual",
): Promise<AIConversationSession | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in");
      return null;
    }

    const { data, error } = await fromExtended("ai_conversation_sessions")
      .insert({
        user_id: auth.user.id,
        session_name: sessionName ?? null,
        conversation_mode: conversationMode,
        language: "en",
        context_summary: null,
        user_preferences: {},
        is_active: true,
        last_activity_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      logger.error("createAIConversationSession failed", { error: error.message });
      return null;
    }

    return (data ?? null) as AIConversationSession | null;
  } catch (error) {
    logger.error("createAIConversationSession error", { error });
    return null;
  }
}

export async function getAIConversationSessions(): Promise<AIConversationSession[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];

    const { data, error } = await fromExtended("ai_conversation_sessions")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("last_activity_at", { ascending: false })
      .limit(50);
    if (error) return [];
    return (data ?? []) as AIConversationSession[];
  } catch {
    return [];
  }
}

// ==================== AI Conversation Messages ====================

export interface AIConversationMessage {
  id: string;
  session_id: string;
  user_id: string;
  message_type: "text" | "voice" | "image" | "mixed";
  content_text: string | null;
  content_audio_url: string | null;
  content_image_url: string | null;
  transcription: string | null;
  sender_type: "user" | "ai";
  ai_model_version: string | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  emotional_tone: string | null;
  sentiment_score: number | null;
  context_references: string[] | null;
  referenced_data: any;
  proactive_suggestions: any;
  created_at: string;
}

export async function sendAIMessage(
  sessionId: string,
  content: string,
  messageType: AIConversationMessage["message_type"] = "text",
): Promise<AIConversationMessage | null> {
  try {
    const msg = String(content || "").trim();
    if (!msg) return null;

    const { data, error } = await supabase.functions.invoke("conversational-ai-chat", {
      body: { sessionId, message: msg, messageType },
    });

    if (error) {
      toast.error(error.message || "AI chat failed");
      return null;
    }

    // Return the AI message to match call sites (UI reloads full thread anyway).
    return (data?.aiMessage ?? null) as AIConversationMessage | null;
  } catch (error) {
    logger.error("sendAIMessage error", { error });
    toast.error("AI chat failed");
    return null;
  }
}

export async function getAIConversationMessages(
  sessionId: string,
): Promise<AIConversationMessage[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];

    const { data, error } = await fromExtended("ai_conversation_messages")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) return [];
    return (data ?? []) as AIConversationMessage[];
  } catch {
    return [];
  }
}

// ==================== AI Contextual Memory ====================

export interface AIContextualMemory {
  id: string;
  user_id: string;
  memory_type: "preference" | "fact" | "goal" | "concern" | "history";
  memory_key: string;
  memory_value: any;
  source_session_id: string | null;
  source_message_id: string | null;
  importance_score: number;
  access_count: number;
  last_accessed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getAIContextualMemory(
  memoryType?: AIContextualMemory["memory_type"],
): Promise<AIContextualMemory[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];

    let q = fromExtended("ai_contextual_memory")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("importance_score", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(200);
    if (memoryType) q = q.eq("memory_type", memoryType);
    const { data, error } = await q;
    if (error) return [];
    return (data ?? []) as AIContextualMemory[];
  } catch {
    return [];
  }
}

// ==================== AI Proactive Suggestions ====================

export interface AIProactiveSuggestion {
  id: string;
  user_id: string;
  suggestion_type:
    | "health_tip"
    | "reminder"
    | "routine_suggestion"
    | "data_review"
    | "goal_check"
    | "other";
  suggestion_title: string;
  suggestion_content: string;
  suggestion_action: any;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  trigger_condition: any;
  suggestion_status: "pending" | "shown" | "accepted" | "dismissed" | "expired";
  shown_at: string | null;
  accepted_at: string | null;
  dismissed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export async function getAIProactiveSuggestions(): Promise<AIProactiveSuggestion[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];

    const { data, error } = await fromExtended("ai_proactive_suggestions")
      .select("*")
      .eq("user_id", auth.user.id)
      .in("suggestion_status", ["pending", "shown"])
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return [];
    return (data ?? []) as AIProactiveSuggestion[];
  } catch {
    return [];
  }
}

export async function acceptAISuggestion(suggestionId: string): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in");
      return false;
    }

    const { error } = await fromExtended("ai_proactive_suggestions")
      .update({ suggestion_status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", suggestionId)
      .eq("user_id", auth.user.id);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}
