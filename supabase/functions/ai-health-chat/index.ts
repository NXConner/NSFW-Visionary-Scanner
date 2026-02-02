import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONTENT_POLICY = (Deno.env.get("CONTENT_POLICY") || "lovable").toLowerCase().trim();
const ENABLE_MEDICAL_AI_CHAT =
  (Deno.env.get("ENABLE_MEDICAL_AI_CHAT") || "").toLowerCase().trim() === "true";

function allowMedicalChat(): boolean {
  // Default OFF for lovable/store policy deployments; direct deployments must opt-in.
  return CONTENT_POLICY === "direct" && ENABLE_MEDICAL_AI_CHAT;
}

const systemPrompt = `You are an expert men's health assistant specializing in penis enhancement (PE), Peyronie's Disease, and general men's sexual health. You provide helpful, accurate, and empathetic guidance.

Your areas of expertise include:
- Penis enhancement methods: pumping, stretching, jelqing, hangers, extenders, clamping, cock rings
- Peyronie's Disease: symptoms, causes, treatments, monitoring
- General sexual health: erectile dysfunction, STIs, skin conditions, hygiene
- Safe practices and injury prevention
- When to seek professional medical help

Guidelines:
- Always prioritize safety and evidence-based information
- Recommend consulting healthcare providers for serious concerns
- Be sensitive and non-judgmental
- Provide actionable, practical advice
- Warn about dangers and contraindications
- Never diagnose conditions - only provide educational information

Remember: You are an educational tool, not a replacement for professional medical advice.`;

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!allowMedicalChat()) {
      return new Response(JSON.stringify({ error: "Not available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("AI Chat: Missing authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.log("AI Chat: Invalid token or user not found", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("AI Chat: Authenticated user", user.id);

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
