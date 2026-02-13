import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";
import { getPrivilegedFlags } from "../_shared/privileged.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReqBody = {
  recording_id?: string;
  edit_type: string;
  edit_name?: string;
  edit_config?: Record<string, unknown>;
  camera_switches?: Record<string, unknown>;
  masking_data?: Record<string, unknown>;
  transitions?: Record<string, unknown>;
};

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
    endpoint: "video-editing",
    ...DEFAULT_EDGE_RATE_LIMIT,
    headers: corsHeaders,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
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

    const { isPrivileged } = await getPrivilegedFlags(supabase, user.id);

    // Ensure age gate for adult features (privileged users bypass verification gates)
    if (!isPrivileged) {
      const { data: age, error: ageError } = await supabase
        .from("dlc_age_verifications")
        .select("is_verified, adult_content_consent, terms_accepted")
        .eq("user_id", user.id)
        .maybeSingle();
      if (ageError) throw ageError;
      if (!(age?.is_verified && age?.adult_content_consent && age?.terms_accepted)) {
        return new Response(JSON.stringify({ error: "Age verification required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = (await req.json()) as ReqBody;
    const recordingId = body.recording_id ? String(body.recording_id) : "";
    const editType = String(body.edit_type || "");
    if (!recordingId || !editType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ownership check: recording must belong to user (or shared with partner, handled by RLS in app; here we enforce user ownership)
    const { data: rec, error: recError } = await supabase
      .from("video_recordings")
      .select("id, user_id")
      .eq("id", recordingId)
      .maybeSingle();
    if (recError) throw recError;
    if (!rec || rec.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not permitted" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      recording_id: recordingId,
      user_id: user.id,
      edit_name: body.edit_name ? String(body.edit_name) : null,
      edit_type: editType,
      edit_config: body.edit_config ?? {},
      camera_switches: body.camera_switches ?? null,
      masking_data: body.masking_data ?? null,
      transitions: body.transitions ?? null,
      edit_status: "pending",
    };

    const { data: edit, error } = await supabase
      .from("video_edits")
      .insert(payload)
      .select("id, edit_status, created_at")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: `Failed to create edit: ${error.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Note: This function records edit intent.
    // Actual media processing should be performed by a dedicated worker/service.
    return new Response(
      JSON.stringify({
        success: true,
        edit_id: edit.id,
        status: edit.edit_status,
        message: "Edit queued for processing.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("video-editing error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
