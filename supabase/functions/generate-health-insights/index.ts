/**
 * Supabase Edge Function: Generate Health Insights
 * Generates daily AI-powered health insights for users
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's recent health data
    const [prostate, testicular, sexual, urinary, wellness] = await Promise.all([
      supabaseClient
        .from("prostate_health")
        .select("*")
        .eq("user_id", user_id)
        .order("entry_date", { ascending: false })
        .limit(30),
      supabaseClient
        .from("testicular_health")
        .select("*")
        .eq("user_id", user_id)
        .order("entry_date", { ascending: false })
        .limit(30),
      supabaseClient
        .from("sexual_health_metrics")
        .select("*")
        .eq("user_id", user_id)
        .order("entry_date", { ascending: false })
        .limit(30),
      supabaseClient
        .from("urinary_health")
        .select("*")
        .eq("user_id", user_id)
        .order("entry_date", { ascending: false })
        .limit(30),
      supabaseClient
        .from("sexual_wellness_scores")
        .select("*")
        .eq("user_id", user_id)
        .order("entry_date", { ascending: false })
        .limit(30),
    ]);

    // Prepare context for AI
    const context = {
      prostate_health: prostate.data || [],
      testicular_health: testicular.data || [],
      sexual_health: sexual.data || [],
      urinary_health: urinary.data || [],
      wellness_scores: wellness.data || [],
    };

    // Call AI to generate insights
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an AI health insights assistant. Analyze the user's health data and generate personalized daily insights.

Generate 1-3 insights that are:
- Actionable and specific
- Based on patterns in the data
- Encouraging and supportive
- Educational

Return JSON array of insights:
[
  {
    "insight_type": "pattern|prediction|recommendation|warning|celebration",
    "title": "Brief title",
    "content": "Detailed insight",
    "category": "prostate|testicular|sexual|urinary|general|routine",
    "confidence": 0-100,
    "actionable": true/false,
    "action_items": ["item1", "item2"]
  }
]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze this health data and generate insights:\n${JSON.stringify(context, null, 2)}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Parse insights
    let insights: any[];
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      insights = JSON.parse(jsonMatch[1] || content);
    } catch {
      insights = [];
    }

    // Save insights
    const today = new Date().toISOString().split("T")[0];
    const insightsToInsert = insights.map(insight => ({
      user_id,
      insight_date: today,
      ...insight,
    }));

    if (insightsToInsert.length > 0) {
      await supabaseClient.from("daily_health_insights").upsert(insightsToInsert, {
        onConflict: "user_id,insight_date,title",
      });
    }

    return new Response(JSON.stringify({ success: true, insights: insightsToInsert }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
