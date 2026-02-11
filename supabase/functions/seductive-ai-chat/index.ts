import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";
import {
  AiProviderError,
  buildContextPayload,
  buildPolicyResponse,
  buildRateLimitHeaders,
  buildSuggestions,
  callAiProvider,
  checkSeductiveAiRateLimit,
  clampNumber,
  defaultModelFor,
  enforceResponseSafety,
  hasFeatureEntitlement,
  normalizeProvider,
  prepareSeductiveAiContext,
  sentimentFor,
} from "../_shared/index.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ALLOW_UNLICENSED =
  (Deno.env.get("ALLOW_UNLICENSED_SEDUCTIVE_AI") || "").toLowerCase() === "true";
const CONTENT_POLICY = (Deno.env.get("CONTENT_POLICY") || "lovable").toLowerCase().trim();
const SEDUCTIVE_AI_MODE = (Deno.env.get("SEDUCTIVE_AI_MODE") || "").toLowerCase().trim();
const PROVIDER = normalizeProvider(Deno.env.get("SEDUCTIVE_AI_PROVIDER") || "lovable-gateway");
const MODEL = Deno.env.get("SEDUCTIVE_AI_MODEL") || defaultModelFor(PROVIDER);
const BASE_MAX_TOKENS = Number(Deno.env.get("SEDUCTIVE_AI_MAX_TOKENS") || "550");
const TOP_P = Number(Deno.env.get("SEDUCTIVE_AI_TOP_P") || "0.9");
const PRESENCE_PENALTY = Number(Deno.env.get("SEDUCTIVE_AI_PRESENCE_PENALTY") || "0.1");
const FREQUENCY_PENALTY = Number(Deno.env.get("SEDUCTIVE_AI_FREQUENCY_PENALTY") || "0.1");
const MEMORY_WINDOW = Math.max(8, Number(Deno.env.get("SEDUCTIVE_AI_MEMORY_WINDOW") || "18"));
const MEMORY_MAX_CUES = Math.max(4, Number(Deno.env.get("SEDUCTIVE_AI_MEMORY_MAX") || "12"));
const MAX_MESSAGE_CHARS = Math.max(
  400,
  Number(Deno.env.get("SEDUCTIVE_AI_MAX_MESSAGE_CHARS") || "2000"),
);
type ReqBody = {
  session_id: string;
  user_message: string;
  media?: unknown;
  personality?: string;
  intensity?: string;
  client_context?: Record<string, unknown>;
};
function isLovablePolicy(): boolean {
  return CONTENT_POLICY !== "direct";
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rateLimitResponse = await applyRateLimit({
    req,
    endpoint: "seductive-ai-chat",
    ...DEFAULT_EDGE_RATE_LIMIT,
    headers: corsHeaders,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    if (isLovablePolicy() || !(SEDUCTIVE_AI_MODE === "tame" || SEDUCTIVE_AI_MODE === "explicit")) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase not configured");

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userRes, error: authError } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: age, error: ageError } = await supabase
      .from("dlc_age_verifications")
      .select("is_verified, adult_content_consent, terms_accepted")
      .eq("user_id", user.id)
      .maybeSingle();
    if (ageError) throw ageError;
    const okAge = Boolean(age?.is_verified && age?.adult_content_consent && age?.terms_accepted);
    if (!okAge) {
      return new Response(JSON.stringify({ error: "Age verification required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ALLOW_UNLICENSED) {
      const ok = await hasFeatureEntitlement(supabase, user.id, "ai_companion");
      if (!ok) {
        return new Response(JSON.stringify({ error: "AI Companion entitlement required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = (await req.json()) as ReqBody;
    const sessionId = String(body.session_id || "");
    const userMessage = String(body.user_message || "").trim();

    if (!sessionId || !userMessage) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (userMessage.length > MAX_MESSAGE_CHARS) {
      return new Response(JSON.stringify({ error: "Message too long" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: session } = await supabase
      .from("seductive_ai_sessions")
      .select("id, user_id, ai_personality, ai_intensity, session_type, session_name")
      .eq("id", sessionId)
      .maybeSingle();
    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (session.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not permitted" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateLimit = await checkSeductiveAiRateLimit(supabase, user.id);
    if (!rateLimit.allowed) {
      const headers = {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": rateLimit.windowSeconds.toString(),
        ...buildRateLimitHeaders(rateLimit),
      };
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfterSeconds: rateLimit.windowSeconds,
          rateLimit,
        }),
        { status: 429, headers },
      );
    }

    const { data: messages, error: messagesError } = await supabase
      .from("seductive_ai_messages")
      .select("message_type, message_content, context_data, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(MEMORY_WINDOW);
    if (messagesError) throw messagesError;

    const chronological = (messages || []).slice().reverse();
    const mode = SEDUCTIVE_AI_MODE as "tame" | "explicit";
    const context = prepareSeductiveAiContext({
      mode,
      userMessage,
      sessionId,
      body,
      session,
      chronological,
      memoryMaxCues: MEMORY_MAX_CUES,
      provider: { name: PROVIDER, model: MODEL },
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    });

    if (context.policy.action === "block") {
      const message = buildPolicyResponse(context.policy, mode);
      const suggestions = buildSuggestions(context.intensity, mode);
      const headers = {
        ...corsHeaders,
        "Content-Type": "application/json",
        ...buildRateLimitHeaders(rateLimit),
      };
      return new Response(
        JSON.stringify({
          message,
          confidence: 0.3,
          sentiment: "neutral",
          suggestions,
          context: context.contextPayloadBase,
          policy: context.policy,
          rateLimit,
          provider: { name: PROVIDER, model: MODEL },
        }),
        { status: 200, headers },
      );
    }

    const llmMessages = [
      { role: "system", content: context.systemPrompt },
      ...context.history.map(item => ({
        role: (item.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
        content: item.content,
      })),
      { role: "user", content: context.userContent },
    ] as Array<{ role: "system" | "user" | "assistant"; content: string }>;

    const temperature = clampNumber(
      context.personality.temperature + context.intensityProfile.temperatureBoost,
      0.2,
      1.2,
    );
    const maxTokens = clampNumber(
      BASE_MAX_TOKENS + context.intensityProfile.maxTokensBoost,
      120,
      1200,
    );

    const providerResponse = await callAiProvider(PROVIDER, {
      messages: llmMessages,
      model: MODEL,
      temperature,
      maxTokens,
      topP: TOP_P,
      frequencyPenalty: FREQUENCY_PENALTY,
      presencePenalty: PRESENCE_PENALTY,
    });

    const safe = enforceResponseSafety(providerResponse.text, mode);
    const sentiment = sentimentFor(safe.text);
    const suggestions = buildSuggestions(context.intensity, mode);
    const policy = safe.modified ? safe.policy : context.policy;

    const headers = {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...buildRateLimitHeaders(rateLimit),
    };

    const providerMeta = {
      name: PROVIDER,
      model: providerResponse.model,
      latencyMs: providerResponse.latencyMs,
    };

    return new Response(
      JSON.stringify({
        message: safe.text,
        confidence: sentiment.confidence,
        sentiment: sentiment.sentiment,
        suggestions,
        context: buildContextPayload({
          ...context.contextPayloadBase,
          policy,
          provider: providerMeta,
        }),
        policy,
        rateLimit,
        provider: providerMeta,
      }),
      { status: 200, headers },
    );
  } catch (error) {
    if (error instanceof AiProviderError) {
      const status = error.status || 500;
      const headers = { ...corsHeaders, "Content-Type": "application/json" };
      if (status === 429) headers["Retry-After"] = "60";
      return new Response(
        JSON.stringify({
          error: "AI provider error",
          details: error.details || error.message,
        }),
        { status, headers },
      );
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("seductive-ai-chat error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
