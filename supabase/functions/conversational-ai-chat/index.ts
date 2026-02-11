import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONTENT_POLICY = (Deno.env.get("CONTENT_POLICY") || "lovable").toLowerCase().trim();
const ENABLE_MEDICAL_AI_CHAT =
  (Deno.env.get("ENABLE_MEDICAL_AI_CHAT") || "").toLowerCase().trim() === "true";

function allowMedicalChat(): boolean {
  return CONTENT_POLICY === "direct" && ENABLE_MEDICAL_AI_CHAT;
}

type ReqBody = {
  sessionId: string;
  message: string;
  messageType?: "text" | "voice" | "image" | "mixed";
};

const systemPrompt = `You are an expert men's health assistant specializing in penis enhancement (PE), Peyronie's Disease, and general men's sexual health. You provide helpful, accurate, and empathetic guidance.

Guidelines:
- Always prioritize safety and evidence-based information
- Recommend consulting healthcare providers for serious concerns
- Be sensitive and non-judgmental
- Provide actionable, practical advice
- Warn about dangers and contraindications
- Never diagnose conditions - only provide educational information

Remember: You are an educational tool, not a replacement for professional medical advice.`;

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!allowMedicalChat()) {
      return new Response(JSON.stringify({ error: "Not available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rateLimitResponse = await applyRateLimit({
      req,
      endpoint: "conversational-ai-chat",
      ...DEFAULT_EDGE_RATE_LIMIT,
      headers: corsHeaders,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: userRes, error: authError } = await supabaseClient.auth.getUser(token);
    const user = userRes?.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ReqBody;
    const sessionId = String(body.sessionId || "");
    const message = String(body.message || "").trim();
    const messageType = (body.messageType ?? "text") as ReqBody["messageType"];

    if (!sessionId || !message) {
      return new Response(JSON.stringify({ error: "Missing sessionId or message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure session belongs to user
    const { data: session, error: sessionErr } = await supabaseClient
      .from("ai_conversation_sessions")
      .select("id, conversation_mode, language")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (sessionErr || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load recent messages for context
    const { data: prior } = await supabaseClient
      .from("ai_conversation_messages")
      .select("sender_type, content_text")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const history = (prior || []).reverse().map((m: any) => ({
      role: m.sender_type === "ai" ? "assistant" : "user",
      content: String(m.content_text ?? ""),
    }));

    // Insert user message
    const { data: userMsg, error: insUserErr } = await supabaseClient
      .from("ai_conversation_messages")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        message_type: messageType,
        content_text: message,
        sender_type: "user",
      })
      .select("*")
      .single();

    if (insUserErr) throw insUserErr;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: false,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message },
        ],
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResp.json();
    const reply = String(json?.choices?.[0]?.message?.content ?? "").trim();

    const { data: aiMsg, error: insAiErr } = await supabaseClient
      .from("ai_conversation_messages")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        message_type: "text",
        content_text: reply,
        sender_type: "ai",
        ai_model_version: "google/gemini-2.5-flash",
      })
      .select("*")
      .single();

    if (insAiErr) throw insAiErr;

    await supabaseClient
      .from("ai_conversation_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ userMessage: userMsg, aiMessage: aiMsg }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("conversational-ai-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
