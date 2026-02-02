/**
 * Supabase Edge Function: verify-webhook
 *
 * Server-side webhook verification (avoids browser CORS).
 * - Authenticates caller (must own the webhook)
 * - Sends a verification POST with token + signature
 * - Marks webhook verified on 2xx
 * - Records a delivery row
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

function base64Url(bytes: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function randomSecret(len: number = 24) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function hmacSha256Base64Url(secret: string, payload: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return base64Url(new Uint8Array(sig));
}

serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !anonKey || !serviceKey) return json(500, { error: "Server not configured" });

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseAuth = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: auth, error: authErr } = await supabaseAuth.auth.getUser();
    if (authErr) return json(401, { error: "Unauthorized" });
    if (!auth.user) return json(401, { error: "Unauthorized" });

    const { webhook_id } = await req.json().catch(() => ({}));
    if (!webhook_id) return json(400, { error: "webhook_id is required" });

    const supabaseAdmin = createClient(url, serviceKey);
    const { data: hook, error: hookErr } = await supabaseAdmin
      .from("webhooks")
      .select("*")
      .eq("id", webhook_id)
      .maybeSingle();
    if (hookErr) return json(500, { error: hookErr.message });
    if (!hook) return json(404, { error: "Webhook not found" });
    if (hook.user_id !== auth.user.id) return json(403, { error: "Forbidden" });

    const verificationToken = hook.verification_token || randomSecret(18);
    const webhookSecret = hook.webhook_secret || randomSecret(24);

    const payload = JSON.stringify({
      event: "webhook.verify",
      webhook_id,
      token: verificationToken,
      timestamp: nowIso(),
    });
    const signature = await hmacSha256Base64Url(webhookSecret, payload);

    let ok = false;
    let status = 0;
    let responseBody = "";
    try {
      const res = await fetch(hook.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": "webhook.verify",
          "X-Webhook-Token": verificationToken,
          "X-Webhook-Signature": signature,
        },
        body: payload,
      });
      status = res.status;
      responseBody = await res.text();
      ok = res.ok;
    } catch (e) {
      status = 0;
      responseBody = e instanceof Error ? e.message : "Network error";
      ok = false;
    }

    await supabaseAdmin.from("webhook_deliveries").insert({
      webhook_id,
      event_type: "webhook.verify",
      event_data: { verification: true },
      payload: JSON.parse(payload),
      delivery_status: ok ? "delivered" : "failed",
      http_status_code: status || null,
      response_body: responseBody || null,
      retry_count: 0,
      next_retry_at: null,
      attempted_at: nowIso(),
      delivered_at: ok ? nowIso() : null,
      failed_at: ok ? null : nowIso(),
    });

    await supabaseAdmin
      .from("webhooks")
      .update({
        webhook_secret: webhookSecret,
        verification_token: verificationToken,
        is_verified: ok,
        updated_at: nowIso(),
      })
      .eq("id", webhook_id);

    return json(200, { verified: ok, status, response: responseBody });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
