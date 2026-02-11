import { applyRateLimit, DEFAULT_EDGE_RATE_LIMIT } from "../_shared/rateLimit.ts";
/**
 * Supabase Edge Function: Apply Referral Code
 *
 * Securely creates a `referral_tracking` row and increments code usage using service role.
 * This is required because `referral_tracking` is service-role managed by RLS.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function nowIso() {
  return new Date().toISOString();
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !serviceKey) return json(500, { error: "Server not configured" });

    const supabaseAdmin = createClient(url, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Missing Authorization header" });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData.user) return json(401, { error: "Invalid user token" });
    const referredId = userData.user.id;

    const payload = await req.json().catch(() => ({}));
    const codeRaw = typeof payload.code === "string" ? payload.code.trim().toUpperCase() : "";
    if (!codeRaw) return json(400, { error: "code is required" });

    // Fetch active code
    const { data: codeRow, error: codeErr } = await supabaseAdmin
      .from("referral_codes")
      .select("*")
      .eq("code", codeRaw)
      .eq("is_active", true)
      .maybeSingle();

    if (codeErr) return json(500, { error: codeErr.message });
    if (!codeRow) return json(404, { error: "Invalid referral code" });

    const referrerId = codeRow.user_id as string;
    if (!referrerId) return json(500, { error: "Referral code is malformed" });
    if (referrerId === referredId) return json(400, { error: "You cannot refer yourself" });

    // Expiry + max uses checks
    if (codeRow.expires_at && new Date(codeRow.expires_at as string).getTime() < Date.now()) {
      return json(400, { error: "Referral code has expired" });
    }

    const rateLimitResponse = await applyRateLimit({
      req,
      endpoint: "apply-referral-code",
      ...DEFAULT_EDGE_RATE_LIMIT,
      headers: corsHeaders,
    });
    if (rateLimitResponse) return rateLimitResponse;
    const maxUses = codeRow.max_uses as number | null;
    const usageCount = (codeRow.usage_count as number | null) ?? 0;
    if (maxUses != null && usageCount >= maxUses)
      return json(400, { error: "Referral code has reached max uses" });

    // Prevent duplicate referral application for this user
    const { data: existing } = await supabaseAdmin
      .from("referral_tracking")
      .select("id")
      .eq("referred_id", referredId)
      .limit(1);

    if (existing && existing.length > 0) {
      return json(200, { success: true, alreadyApplied: true });
    }

    // Create tracking row
    const { data: tracking, error: trackingErr } = await supabaseAdmin
      .from("referral_tracking")
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
        referral_code_id: codeRow.id,
        status: "pending",
        reward_applied: false,
        referred_subscribed: false,
      })
      .select("*")
      .single();

    if (trackingErr) return json(500, { error: trackingErr.message });

    // Increment usage count
    await supabaseAdmin
      .from("referral_codes")
      .update({ usage_count: usageCount + 1, updated_at: nowIso() })
      .eq("id", codeRow.id);

    return json(200, { success: true, tracking });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
