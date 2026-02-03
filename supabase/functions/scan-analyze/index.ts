import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Calibration = {
  pixelsPerMm?: number;
  source: "reference-object" | "on-screen-ruler" | "none";
  referenceLabel?: string;
};

type ReqBody = {
  imageDataUrl?: string;
  imageObjectPath?: string;
  calibration?: Calibration;
  deterministic?: {
    curvatureAngleDeg: number;
    curvatureDirection: string;
    lengthPx: number;
    lengthMm?: number;
    confidence: number;
  };
};

const CONTENT_POLICY = (Deno.env.get("CONTENT_POLICY") || "lovable").toLowerCase().trim();
const ENABLE_GENITAL_HEALTH_AI =
  (Deno.env.get("ENABLE_GENITAL_HEALTH_AI") || "").toLowerCase().trim() === "true";

function allowMedicalAi(): boolean {
  // Default to OFF for lovable/store policy deployments.
  // Direct/off-platform deployments must explicitly enable with ENABLE_GENITAL_HEALTH_AI=true.
  return CONTENT_POLICY === "direct" && ENABLE_GENITAL_HEALTH_AI;
}

function parseDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } {
  const m = String(dataUrl || "").match(/^data:([^;]+);base64,(.*)$/);
  if (!m) throw new Error("Invalid data URL");
  const mime = m[1]!;
  const b64 = m[2]!;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { mime, bytes };
}

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

async function runAiHealthAnalysis(imageDataUrl: string): Promise<any | null> {
  if (!allowMedicalAi()) return null;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const systemPrompt = `You are an AI medical image analysis assistant specialized in men's genital health assessment. Analyze the provided image and provide a structured health assessment.

IMPORTANT DISCLAIMERS:
- This is for educational purposes only
- This is NOT a medical diagnosis
- Always recommend consulting a healthcare provider
- Be sensitive and professional

Provide your response in JSON with fields: overallHealth, confidenceLevel, curvatureAssessment, skinHealth, recommendations, urgency, disclaimer.`;

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
            { type: "text", text: "Analyze this scan image and respond with JSON only." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
    return JSON.parse(String(jsonMatch[1]).trim());
  } catch {
    return null;
  }
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  const rateLimitResponse = await applyRateLimit({
    req,
    endpoint: "scan-analyze",
    ...DEFAULT_EDGE_RATE_LIMIT,
    headers: corsHeaders,
  });
  if (rateLimitResponse) return rateLimitResponse;

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

    const body = (await req.json()) as ReqBody;

    let imagePath = body.imageObjectPath ? String(body.imageObjectPath) : "";
    let imageDataUrl = body.imageDataUrl ? String(body.imageDataUrl) : "";

    if (!imagePath && !imageDataUrl) {
      return new Response(JSON.stringify({ error: "Provide imageDataUrl or imageObjectPath" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If only data URL is provided, upload into scans bucket (private) and keep path.
    if (!imagePath && imageDataUrl) {
      const { mime, bytes } = parseDataUrl(imageDataUrl);
      if (!mime.startsWith("image/")) throw new Error("Only images are supported");
      if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("Image too large (max 10MB)");
      const ext = extForMime(mime);
      const ts = new Date().toISOString().replaceAll(":", "-");
      const objectPath = `${user.id}/${ts}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("scans").upload(objectPath, bytes, {
        contentType: mime,
        upsert: false,
      });
      if (uploadErr) throw uploadErr;
      imagePath = objectPath;
    }

    // Run AI (optional if configured)
    const ai = imageDataUrl ? await runAiHealthAnalysis(imageDataUrl) : null;

    const deterministic = body.deterministic ?? null;
    const calibration = body.calibration ?? null;

    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      scan_type: "measurement",
      scan_source: "camera",
      has_image: Boolean(imagePath),
      analysis_result: {
        ...(ai ? { ai } : {}),
        ...(deterministic ? { deterministic } : {}),
        ...(calibration ? { calibration } : {}),
        ...(imagePath ? { image: { bucket: "scans", path: imagePath } } : {}),
      },
      calibration_factor: calibration?.pixelsPerMm ? 1 / calibration.pixelsPerMm : null,
      reference_object: calibration?.referenceLabel ?? null,
      scanned_at: new Date().toISOString(),
    };

    if (deterministic?.lengthMm && Number.isFinite(deterministic.lengthMm)) {
      insertPayload.length = Number((deterministic.lengthMm / 10).toFixed(2)); // store cm
    }
    if (deterministic?.curvatureAngleDeg != null) {
      insertPayload.curvature_angle = Number(deterministic.curvatureAngleDeg);
      insertPayload.curvature_direction = String(deterministic.curvatureDirection || "");
    }
    if (deterministic?.confidence != null) {
      insertPayload.confidence_level = Math.max(
        0,
        Math.min(100, Math.round(deterministic.confidence)),
      );
    }

    // AI mapping (best-effort)
    if (ai?.overallHealth) insertPayload.overall_health = String(ai.overallHealth);
    if (typeof ai?.confidenceLevel === "number") {
      insertPayload.confidence_level = Math.max(0, Math.min(100, Math.round(ai.confidenceLevel)));
    }
    if (ai?.urgency) insertPayload.urgency = String(ai.urgency);
    if (ai?.curvatureAssessment?.detected != null) {
      insertPayload.curvature_detected = Boolean(ai.curvatureAssessment.detected);
    }

    const { data: scan, error: insErr } = await supabase
      .from("scans")
      .insert(insertPayload)
      .select("id")
      .single();
    if (insErr) throw insErr;

    return new Response(
      JSON.stringify({
        scanId: scan?.id,
        ai: ai ?? undefined,
        deterministic: deterministic ?? undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("scan-analyze error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
