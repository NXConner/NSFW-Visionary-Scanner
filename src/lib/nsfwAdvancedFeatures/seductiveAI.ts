import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { isLovablePolicyBuild } from "@/lib/featureFlags";
import { appendAuditLogEntry } from "@/lib/auditLogStorage";
import type {
  SeductiveAIMessageMedia,
  SeductiveAIResponse,
  SeductiveAISession,
  SeductiveAIMessageRow,
  JsonObject,
} from "./types";

type AiEdgeResponse = {
  message: string;
  confidence?: number;
  sentiment?: string;
  suggestions?: string[];
  context?: JsonObject;
  policy?: {
    action: "allow" | "deescalate" | "block";
    reason?: string;
    category?: string;
    severity?: string;
    matched?: string[];
    message?: string;
  };
  rateLimit?: {
    limit: number;
    remaining: number;
    resetAt: string;
    retryAfterSeconds?: number;
  };
  provider?: {
    name: string;
    model: string;
    latencyMs?: number;
  };
};

export async function createSeductiveAISession(
  personality: SeductiveAISession["ai_personality"] = "seductive",
  intensity: SeductiveAISession["ai_intensity"] = "medium",
  partnerId: string | null = null,
  sessionName?: string | null,
): Promise<SeductiveAISession | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in");
      return null;
    }

    const { data, error } = await supabase
      .from("seductive_ai_sessions")
      .insert({
        user_id: user.id,
        partner_id: partnerId,
        session_type: partnerId ? "partner" : "solo",
        ai_personality: personality,
        ai_intensity: intensity,
        session_name: typeof sessionName === "string" ? sessionName : null,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("Error creating AI session", { error: error.message });
      toast.error("Failed to create session");
      return null;
    }

    return data as unknown as SeductiveAISession;
  } catch (error) {
    logger.error("Error in createSeductiveAISession", { error });
    return null;
  }
}

export async function sendSeductiveAIMessage(
  sessionId: string,
  message: string,
  media?: SeductiveAIMessageMedia,
): Promise<SeductiveAIResponse | null> {
  try {
    // Lovable-safe policy: never allow explicit companion chat on Lovable/store builds.
    if (isLovablePolicyBuild()) {
      toast.error("This feature isn’t available in this build.");
      return null;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: userMessage, error: userError } = await fromExtended("seductive_ai_messages")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        message_type: "user",
        message_content: message,
        images_urls: media?.images ?? null,
        gifs_urls: media?.gifs ?? null,
        videos_urls: media?.videos ?? null,
        voice_message_url: media?.voiceMessage ?? null,
        adult_emojis: media?.emojis ?? null,
      })
      .select("*")
      .single();

    if (userError || !userMessage) {
      logger.error("Error saving user message", { error: userError?.message });
      return null;
    }

    const { data: aiResponseData, error: aiError } = await supabase.functions.invoke(
      "seductive-ai-chat",
      {
        body: {
          session_id: sessionId,
          user_message: message,
          media,
          client_context: {
            app_version: import.meta.env?.VITE_APP_VERSION,
            app_env: import.meta.env?.VITE_APP_ENV,
            distribution_channel: import.meta.env?.VITE_DISTRIBUTION_CHANNEL,
          },
        },
      },
    );

    if (aiError || !aiResponseData) {
      const status = (aiError as any)?.context?.status as number | undefined;
      if (status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment.");
      } else if (status === 402) {
        toast.error("AI credits exhausted. Please try again later.");
      } else {
        toast.error("Failed to get AI response");
      }
      logger.error("Error getting AI response", { error: aiError?.message, status });
      return null;
    }

    const aiPayload = aiResponseData as AiEdgeResponse;
    if (aiPayload.policy?.action === "block") {
      toast.error(aiPayload.policy.message || "Message blocked by safety policy.");
      void appendAuditLogEntry({
        action: "nsfw_policy_block",
        category: "nsfw",
        details: aiPayload.policy.message || "Message blocked by safety policy",
        metadata: {
          sessionId,
          category: aiPayload.policy.category,
          severity: aiPayload.policy.severity,
        },
      });
    } else if (aiPayload.policy?.action === "deescalate") {
      void appendAuditLogEntry({
        action: "nsfw_policy_deescalate",
        category: "nsfw",
        details: aiPayload.policy.message || "Message deescalated by safety policy",
        metadata: {
          sessionId,
          category: aiPayload.policy.category,
          severity: aiPayload.policy.severity,
        },
      });
    }

    const { data: aiMessage, error: aiMessageError } = await fromExtended("seductive_ai_messages")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        message_type: "ai",
        message_content: aiPayload.message,
        ai_confidence: aiPayload.confidence ?? null,
        ai_sentiment: aiPayload.sentiment ?? null,
        ai_suggestions: aiPayload.suggestions ?? null,
        context_data: aiPayload.context ?? null,
      })
      .select("*")
      .single();

    if (aiMessageError || !aiMessage) {
      logger.error("Error saving AI message", { error: aiMessageError?.message });
      return null;
    }

    // Touch the parent session for "recent activity" ordering (best-effort).
    try {
      await supabase
        .from("seductive_ai_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sessionId);
    } catch {
      // ignore
    }

    return {
      userMessage: userMessage as unknown as SeductiveAIMessageRow,
      aiResponse: aiMessage as unknown as SeductiveAIMessageRow,
    };
  } catch (error) {
    logger.error("Error in sendSeductiveAIMessage", { error });
    return null;
  }
}

export async function getSeductiveAISessions(opts?: {
  includeInactive?: boolean;
  limit?: number;
}): Promise<SeductiveAISession[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const limit = Math.max(1, Math.min(50, opts?.limit ?? 25));
    let q = supabase
      .from("seductive_ai_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (!opts?.includeInactive) q = q.eq("is_active", true);

    const { data, error } = await q;
    if (error) {
      logger.error("Error fetching seductive AI sessions", { error: error.message });
      return [];
    }
    return (data ?? []) as unknown as SeductiveAISession[];
  } catch (error) {
    logger.error("Error in getSeductiveAISessions", { error });
    return [];
  }
}

export async function getSeductiveAIMessages(
  sessionId: string,
  opts?: { limit?: number },
): Promise<SeductiveAIMessageRow[]> {
  try {
    const limit = Math.max(1, Math.min(400, opts?.limit ?? 200));
    const { data, error } = await fromExtended("seductive_ai_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) {
      logger.error("Error fetching seductive AI messages", { error: error.message, sessionId });
      return [];
    }
    return (data ?? []) as unknown as SeductiveAIMessageRow[];
  } catch (error) {
    logger.error("Error in getSeductiveAIMessages", { error, sessionId });
    return [];
  }
}

export async function renameSeductiveAISession(
  sessionId: string,
  name: string | null,
): Promise<boolean> {
  try {
    const safeName = name?.trim() ? name.trim().slice(0, 80) : null;
    const { error } = await supabase
      .from("seductive_ai_sessions")
      .update({ session_name: safeName, updated_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (error) {
      logger.error("Error renaming seductive AI session", { error: error.message, sessionId });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("Error in renameSeductiveAISession", { error, sessionId });
    return false;
  }
}

export async function archiveSeductiveAISession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("seductive_ai_sessions")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (error) {
      logger.error("Error archiving seductive AI session", { error: error.message, sessionId });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("Error in archiveSeductiveAISession", { error, sessionId });
    return false;
  }
}
