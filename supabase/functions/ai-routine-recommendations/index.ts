import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = await applyRateLimit({
    req,
    endpoint: "ai-routine-recommendations",
    ...DEFAULT_EDGE_RATE_LIMIT,
    headers: corsHeaders,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { scanHistory, goals, experienceLevel, preferences } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert PE (Penis Enhancement) coach specializing in personalized workout routines. Based on the user's scan history, goals, and experience level, generate tailored PE routine recommendations.

IMPORTANT GUIDELINES:
- Always prioritize safety and gradual progression
- Consider the user's current measurements and progress trends
- Recommend appropriate exercises for their experience level
- Include warm-up and cool-down in every routine
- Provide specific timing, sets, and reps
- Warn about overtraining and injury prevention

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "analysis": "Brief analysis of user's current state and progress",
  "recommendedRoutine": {
    "name": "Custom routine name",
    "level": "beginner|intermediate|advanced",
    "goal": "length|girth|both",
    "daysPerWeek": 3-5,
    "totalDuration": minutes,
    "exercises": [
      {
        "name": "Exercise name",
        "type": "warmup|stretch|jelq|pump|kegel|cooldown",
        "duration": minutes,
        "sets": number,
        "reps": number,
        "intensity": "low|medium|high",
        "instructions": ["step1", "step2"],
        "warnings": ["warning1"]
      }
    ]
  },
  "weeklySchedule": ["Day 1 focus", "Rest", "Day 2 focus", ...],
  "progressMilestones": ["Week 1 goal", "Week 4 goal", "Week 12 goal"],
  "safetyTips": ["tip1", "tip2"],
  "adjustments": "Personalized adjustments based on their data"
}`;

    const userPrompt = `Generate a personalized PE routine for this user:

SCAN HISTORY:
${JSON.stringify(scanHistory || [], null, 2)}

USER GOALS:
${JSON.stringify(goals || { primary: "both", targetLength: null, targetGirth: null }, null, 2)}

EXPERIENCE LEVEL: ${experienceLevel || "beginner"}

PREFERENCES:
${JSON.stringify(preferences || { availableTime: 30, hasEquipment: false, focusArea: "balanced" }, null, 2)}

Please analyze their progress and create a personalized routine that will help them achieve their goals safely and effectively.`;

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let recommendation;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      recommendation = JSON.parse(jsonStr.trim());
    } catch {
      // If parsing fails, return the raw content
      recommendation = { rawResponse: content, parseError: true };
    }

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("AI routine recommendation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
