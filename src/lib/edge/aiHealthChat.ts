import { supabase, supabaseConfig, supabasePublicConfig } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { readTextFromSseResponse, type SseDeltaHandler } from "./sse";

export type AiHealthChatRole = "user" | "assistant";

export type AiHealthChatMessage = {
  role: AiHealthChatRole;
  content: string;
};

export type AiHealthChatResult =
  | { ok: true; text: string }
  | { ok: false; status?: number; error: string };

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function pickErrorMessage(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (typeof payload !== "object") return null;
  const anyPayload = payload as any;
  if (typeof anyPayload.error === "string") return anyPayload.error;
  if (typeof anyPayload.message === "string") return anyPayload.message;
  return null;
}

function pickResponseText(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (typeof payload !== "object") return null;
  const anyPayload = payload as any;
  if (typeof anyPayload.response === "string") return anyPayload.response;
  if (typeof anyPayload.message === "string") return anyPayload.message;
  if (typeof anyPayload.text === "string") return anyPayload.text;
  return null;
}

/**
 * Invoke the `ai-health-chat` Supabase Edge Function from the client.
 *
 * Why fetch instead of `supabase.functions.invoke()`?
 * - This function currently returns `text/event-stream` (SSE) for streaming responses.
 * - The supabase-js convenience wrapper does not support streaming response bodies.
 */
export async function invokeAiHealthChat(params: {
  messages: AiHealthChatMessage[];
  onDelta?: SseDeltaHandler;
  signal?: AbortSignal;
}): Promise<AiHealthChatResult> {
  if (!supabaseConfig.isConfigured) {
    return { ok: false, error: "Supabase is not configured (missing VITE_SUPABASE_URL / key)." };
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { ok: false, status: 401, error: "Not authenticated" };
    }
    const token = data.session?.access_token;
    if (!token) {
      return { ok: false, status: 401, error: "Not authenticated" };
    }

    const url = `${supabasePublicConfig.url}/functions/v1/ai-health-chat`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: supabasePublicConfig.publishableKey,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream, application/json",
      },
      body: JSON.stringify({ messages: params.messages }),
      signal: params.signal,
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => "");
      const parsed = safeJsonParse(bodyText);
      const msg = pickErrorMessage(parsed) || bodyText || "AI request failed";
      return { ok: false, status: res.status, error: msg };
    }

    const contentType = (res.headers.get("Content-Type") || "").toLowerCase();
    if (contentType.includes("text/event-stream")) {
      const text = await readTextFromSseResponse(res, {
        onDelta: params.onDelta,
        stopOnDone: true,
      });
      return { ok: true, text: text.trim() };
    }

    if (contentType.includes("application/json")) {
      const data = await res.json().catch(() => null);
      const text = pickResponseText(data) ?? "";
      return { ok: true, text: String(text).trim() };
    }

    const text = await res.text().catch(() => "");
    return { ok: true, text: text.trim() };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === "AbortError";
    if (aborted) return { ok: false, status: 499, error: "Request cancelled" };
    logger.error("invokeAiHealthChat: request failed", { error: err });
    return { ok: false, error: "AI request failed" };
  }
}
