import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPrivilegedFlags } from "../_shared/privileged.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Use Lovable AI Gateway instead of external APIs
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";
const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const ALLOW_UNLICENSED =
  (Deno.env.get("ALLOW_UNLICENSED_SEDUCTIVE_AI") || "").toLowerCase() === "true";
const CONTENT_POLICY = (Deno.env.get("CONTENT_POLICY") || "lovable").toLowerCase().trim();
const SEDUCTIVE_AI_MODE = (Deno.env.get("SEDUCTIVE_AI_MODE") || "").toLowerCase().trim();

function isLovablePolicy(): boolean {
  // Default to strict unless explicitly configured for a direct/off-platform deployment.
  return CONTENT_POLICY !== "direct";
}

type ReqBody = {
  session_id: string;
  user_message: string;
  media?: unknown;
  personality?: string;
  intensity?: string;
};

type Personality = { name: string; systemPrompt: string; temperature: number };

const PERSONALITIES: Record<string, Personality> = {
  seductive: {
    name: "Seductive",
    systemPrompt:
      "You are a seductive, charming AI companion. You speak in a smooth, alluring manner that is playful and enticing. You use suggestive language and innuendo while remaining tasteful. You're confident, mysterious, and know how to build tension. Keep responses engaging and flirtatious.",
    temperature: 0.9,
  },
  flirty: {
    name: "Flirty",
    systemPrompt:
      "You are a flirty, playful AI companion. You're lighthearted, fun, and enjoy teasing. You use playful banter and suggestive comments. You're confident but not overwhelming. Keep it fun and engaging.",
    temperature: 0.85,
  },
  dirty: {
    name: "Dirty",
    systemPrompt:
      "You are an adult-only AI companion. You may speak explicitly using adult language. You are direct, bold, and unapologetic about intimate topics, while remaining consensual and respectful.",
    temperature: 0.95,
  },
  nasty: {
    name: "Nasty",
    systemPrompt:
      "You are an adult-only AI companion. You use very explicit adult language and explore intimate topics without reservation, while remaining consensual and respectful.",
    temperature: 1.0,
  },
  romantic: {
    name: "Romantic",
    systemPrompt:
      "You are a romantic, passionate AI companion. You speak with emotion, warmth, tenderness, and intimacy. You create a loving atmosphere and respond thoughtfully.",
    temperature: 0.8,
  },
  kinky: {
    name: "Kinky",
    systemPrompt:
      "You are a kinky, adventurous adult-only AI companion. You explore fantasies and unconventional desires in a consensual, open-minded, and creative way.",
    temperature: 0.9,
  },
};

function pickAllowedPersonality(key: string): Personality {
  const k = String(key || "seductive");

  // Lovable/store policy: this endpoint is not available at all unless explicitly enabled.
  // Additionally, default to OFF even in direct deployments unless explicitly enabled.
  const enabledByEnv = SEDUCTIVE_AI_MODE === "tame" || SEDUCTIVE_AI_MODE === "explicit";
  if (!enabledByEnv) return PERSONALITIES.seductive;

  // In "tame" mode, do not allow explicit personalities.
  if (SEDUCTIVE_AI_MODE === "tame") {
    if (k === "dirty" || k === "nasty" || k === "kinky") return PERSONALITIES.seductive;
  }

  return PERSONALITIES[k] || PERSONALITIES.seductive;
}

function clampIntensity(key: string): string {
  const k = String(key || "medium");
  if (SEDUCTIVE_AI_MODE === "explicit") return k;
  // In tame mode, never allow strong/extreme.
  if (k === "strong" || k === "extreme") return "medium";
  return k;
}

const INTENSITY_MODIFIERS: Record<string, string> = {
  light: "Keep it subtle and suggestive.",
  medium: "Be more direct and engaging.",
  strong: "Be bold and explicit (adult-only).",
  extreme: "Be very explicit and uninhibited (adult-only).",
};

async function hasFeatureEntitlement(
  supabase: any,
  userId: string,
  featureId: string,
): Promise<boolean> {
  // Load active licenses + their package rows
  const { data: licenses, error: licensesError } = await supabase
    .from("dlc_licenses")
    .select("id, package_id, is_active, refunded_at, deactivated_at")
    .eq("user_id", userId)
    .eq("is_active", true);
  if (licensesError) throw licensesError;

  const activeLicenses = (licenses || []).filter((l: any) => !l.refunded_at && !l.deactivated_at);
  if (activeLicenses.length === 0) return false;

  const owned = activeLicenses.map((l: any) => String(l.package_id));
  const { data: pkgs, error: pkgsError } = await supabase
    .from("dlc_packages")
    .select("package_id, features, included_packages")
    .in("package_id", owned);
  if (pkgsError) throw pkgsError;

  const toVisit = new Set<string>(owned);
  const visited = new Set<string>();
  const allPackageIds: string[] = [];

  while (toVisit.size > 0) {
    const next = toVisit.values().next().value as string;
    toVisit.delete(next);
    if (visited.has(next)) continue;
    visited.add(next);
    allPackageIds.push(next);
    const row = (pkgs || []).find((p: any) => String(p.package_id) === next);
    const included = Array.isArray(row?.included_packages) ? row.included_packages : [];
    for (const inc of included) toVisit.add(String(inc));
  }

  // Load included package definitions not already loaded
  const missing = allPackageIds.filter(
    id => !(pkgs || []).some((p: any) => String(p.package_id) === id),
  );
  let extraPkgs: any[] = [];
  if (missing.length > 0) {
    const { data: more, error: moreErr } = await supabase
      .from("dlc_packages")
      .select("package_id, features, included_packages")
      .in("package_id", missing);
    if (moreErr) throw moreErr;
    extraPkgs = more || [];
  }

  const all = [...(pkgs || []), ...extraPkgs];
  for (const p of all) {
    const feats = Array.isArray(p.features) ? p.features : [];
    if (feats.includes(featureId)) return true;
  }
  return false;
}

async function callLovableAI(
  messages: Array<{ role: string; content: string }>,
  temperature: number,
): Promise<string> {
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured");
    return "I apologize, but I'm currently unavailable. Please try again later.";
  }

  try {
    const response = await fetch(LOVABLE_AI_GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages,
        temperature,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI Gateway error:", response.status, errorText);
      return "I apologize, I had trouble processing that. Please try again.";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I apologize, I had trouble processing that.";
  } catch (error) {
    console.error("Lovable AI Gateway request failed:", error);
    return "I apologize, I'm having connection issues. Please try again.";
  }
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Default: disable this endpoint for lovable/store policy deployments.
    // Explicit enabling requires BOTH:
    // - CONTENT_POLICY=direct
    // - SEDUCTIVE_AI_MODE=tame|explicit
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

    const privileged = await getPrivilegedFlags(supabase, user.id);

    if (!privileged.isPrivileged) {
      // Age gate + consent
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

      // DLC entitlement (ai_companion) unless explicitly allowed for a deployment.
      if (!ALLOW_UNLICENSED) {
        const ok = await hasFeatureEntitlement(supabase, user.id, "ai_companion");
        if (!ok) {
          return new Response(JSON.stringify({ error: "AI Companion entitlement required" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const body = (await req.json()) as ReqBody;
    const sessionId = String(body.session_id || "");
    const userMessage = String(body.user_message || "");
    const personalityKey = String(body.personality || "seductive");
    const intensityKey = clampIntensity(String(body.intensity || "medium"));

    if (!sessionId || !userMessage) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Session ownership check
    const { data: session } = await supabase
      .from("seductive_ai_sessions")
      .select("id, user_id")
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

    // Conversation history (last 20)
    const { data: messages } = await supabase
      .from("seductive_ai_messages")
      .select("message_type, message_content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(20);

    const conversationHistory =
      messages?.map((m: any) => ({
        role: m.message_type === "user" ? "user" : "assistant",
        content: String(m.message_content ?? ""),
      })) ?? [];

    const personalityConfig = pickAllowedPersonality(personalityKey);
    const intensityModifier = INTENSITY_MODIFIERS[intensityKey] || INTENSITY_MODIFIERS.medium;

    const rules =
      SEDUCTIVE_AI_MODE === "explicit"
        ? `Rules:
- Adult-only, consensual.
- Never include anything involving minors.
- Be respectful and avoid coercion.
- Do not provide instructions that involve illegal activity or harm.`
        : `Rules:
- Adult-only, consensual.
- Keep content non-graphic and non-explicit.
- Focus on consent, communication, boundaries, and intimacy education.
- Never include anything involving minors.
- Be respectful and avoid coercion.`;

    const systemPrompt = `${personalityConfig.systemPrompt}\n\n${intensityModifier}\n\n${rules}\n`;

    const llmMessages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    // Use Lovable AI Gateway
    const aiResponse = await callLovableAI(llmMessages, personalityConfig.temperature);

    // simple sentiment + suggestions
    const positiveWords = ["love", "enjoy", "excited", "happy", "pleasure", "desire"];
    const negativeWords = ["hate", "disgust", "angry", "sad", "disappointed"];
    const lower = aiResponse.toLowerCase();
    const pos = positiveWords.filter(w => lower.includes(w)).length;
    const neg = negativeWords.filter(w => lower.includes(w)).length;
    const sentiment = pos > neg ? "positive" : neg > pos ? "negative" : "neutral";
    const confidence = Math.min(0.9, 0.7 + (pos + neg) * 0.05);

    const suggestions = ["Ask about preferences", "Share a fantasy", "Talk about desires"];

    return new Response(
      JSON.stringify({
        message: aiResponse,
        confidence,
        sentiment,
        suggestions,
        context: {
          personality: personalityConfig.name,
          intensity: intensityKey,
          messageCount: conversationHistory.length,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("seductive-ai-chat error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
