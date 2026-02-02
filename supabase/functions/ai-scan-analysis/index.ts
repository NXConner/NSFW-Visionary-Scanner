import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CONTENT_POLICY = (Deno.env.get("CONTENT_POLICY") || "lovable").toLowerCase().trim();
const ENABLE_GENITAL_HEALTH_AI =
  (Deno.env.get("ENABLE_GENITAL_HEALTH_AI") || "").toLowerCase().trim() === "true";

function allowMedicalAi(): boolean {
  return CONTENT_POLICY === "direct" && ENABLE_GENITAL_HEALTH_AI;
}

const systemPrompt = `You are an AI medical image analysis assistant specialized in men's genital health assessment. Analyze the provided image and provide a structured health assessment.

IMPORTANT DISCLAIMERS:
- This is for educational purposes only
- This is NOT a medical diagnosis
- Always recommend consulting a healthcare provider
- Be sensitive and professional

When analyzing images, assess for:
1. **Curvature Assessment**: Estimate angle and direction if visible
2. **Skin Health**: Look for any visible skin conditions, discoloration, or abnormalities
3. **General Observations**: Note any visible concerns

Provide your response in this JSON format:
{
  "overallHealth": "good" | "fair" | "concerning",
  "confidenceLevel": 0-100,
  "curvatureAssessment": {
    "detected": boolean,
    "estimatedAngle": number | null,
    "direction": string | null,
    "severity": "none" | "mild" | "moderate" | "severe" | null
  },
  "skinHealth": {
    "status": "healthy" | "minor_concerns" | "needs_attention",
    "observations": string[]
  },
  "recommendations": string[],
  "urgency": "routine" | "soon" | "urgent",
  "disclaimer": "This assessment is for educational purposes only and is not a medical diagnosis. Please consult a healthcare provider for proper evaluation."
}

Always be professional, educational, and emphasize the importance of professional medical consultation.`;

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!allowMedicalAi()) {
      return new Response(JSON.stringify({ error: "Not available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64 } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageBase64) {
      throw new Error("No image provided");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this health scan image and provide a structured assessment in JSON format as specified.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:")
                    ? imageBase64
                    : `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      analysis = JSON.parse(jsonMatch[1].trim());
    } catch {
      // If parsing fails, return structured error response
      analysis = {
        overallHealth: "fair",
        confidenceLevel: 50,
        curvatureAssessment: {
          detected: false,
          estimatedAngle: null,
          direction: null,
          severity: null,
        },
        skinHealth: { status: "healthy", observations: ["Unable to fully analyze image"] },
        recommendations: [
          "Please ensure image is clear and well-lit",
          "Consider retaking the scan",
        ],
        urgency: "routine",
        disclaimer:
          "This assessment is for educational purposes only. Please consult a healthcare provider.",
        rawResponse: content,
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Scan analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
