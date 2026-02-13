import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyRateLimit } from "../_shared/rateLimit.ts";
import { validateOutboundWebhookUrl } from "../_shared/webhookSecurity.ts";

/**
 * Supabase Edge Function: deliver-webhook
 *
 * Sends a test (or custom) webhook event server-side (avoids browser CORS) and records a
 * `webhook_deliveries` row.
 *
 * Security:
 * - Authenticated caller must own the webhook.
 * - SSRF protections (block private networks + metadata endpoints + DNS rebinding).
 * - Per-user rate limiting.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, ...(headers ?? {}), "Content-Type": "application/json" },
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

function truncate(text: string, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

type ReqBody = {
  webhook_id: string;
  event_type?: string;
  payload?: unknown;
};

serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !anonKey || !serviceKey)
      return json(500, { error: "Server not configured" });

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json(401, { error: "Unauthorized" });

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: auth, error: authErr } = await supabaseAuth.auth.getUser();
    if (authErr || !auth.user) return json(401, { error: "Unauthorized" });

    const rateLimitResponse = await applyRateLimit({
      req,
      endpoint: "deliver-webhook",
      userId: auth.user.id,
      windowSeconds: 60,
      maxRequests: 20,
      headers: corsHeaders,
    });
    if (rateLimitResponse) return rateLimitResponse;

    const body = (await req.json().catch(() => ({}))) as Partial<ReqBody>;
    const webhookId = String(body.webhook_id || "").trim();
    if (!webhookId) return json(400, { error: "webhook_id is required" });

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: hook, error: hookErr } = await supabaseAdmin
      .from("webhooks")
      .select("*")
      .eq("id", webhookId)
      .maybeSingle();
    if (hookErr) return json(500, { error: hookErr.message });
    if (!hook) return json(404, { error: "Webhook not found" });
    if (hook.user_id !== auth.user.id) return json(403, { error: "Forbidden" });

    const allowHttp = (Deno.env.get("ALLOW_INSECURE_WEBHOOKS") ?? "").toLowerCase() === "true";
    const validated = await validateOutboundWebhookUrl(String(hook.webhook_url || ""), {
      allowInsecureHttp: allowHttp,
    });
    if (!validated.ok) {
      return json(400, { error: validated.error });
    }

    const webhookSecret = String(hook.webhook_secret || "") || randomSecret(24);
    if (!hook.webhook_secret) {
      await supabaseAdmin
        .from("webhooks")
        .update({ webhook_secret: webhookSecret, updated_at: nowIso() })
        .eq("id", webhookId);
    }

    const eventType = String(body.event_type || "webhook.test").trim() || "webhook.test";
    const eventPayload = body.payload ?? { test: true };

    const envelope = {
      event: eventType,
      webhook_id: webhookId,
      timestamp: nowIso(),
      data: eventPayload,
    };
    const payloadStr = JSON.stringify(envelope);
    const signature = await hmacSha256Base64Url(webhookSecret, payloadStr);

    let ok = false;
    let status = 0;
    let responseBody = "";
    const started = performance.now();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      const res = await fetch(validated.normalizedUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": eventType,
          "X-Webhook-ID": webhookId,
          "X-Webhook-Timestamp": envelope.timestamp,
          "X-Webhook-Signature": signature,
        },
        body: payloadStr,
        signal: controller.signal,
      });
      status = res.status;
      responseBody = await res.text().catch(() => "");
      ok = res.ok;
    } catch (e) {
      status = 0;
      responseBody = e instanceof Error ? e.message : "Network error";
      ok = false;
    } finally {
      clearTimeout(timeout);
    }

    const durationMs = Math.max(0, Math.round(performance.now() - started));
    const attemptedAt = nowIso();
    const deliveredAt = ok ? nowIso() : null;
    const failedAt = ok ? null : nowIso();

    await supabaseAdmin.from("webhook_deliveries").insert({
      webhook_id: webhookId,
      event_type: eventType,
      event_data: { test: eventType === "webhook.test" },
      payload: envelope,
      delivery_status: ok ? "delivered" : "failed",
      http_status_code: status || null,
      response_body: truncate(responseBody || "", 4000) || null,
      retry_count: 0,
      next_retry_at: null,
      attempted_at: attemptedAt,
      delivered_at: deliveredAt,
      failed_at: failedAt,
    });

    // Update aggregate stats on the webhook row.
    await supabaseAdmin
      .from("webhooks")
      .update({
        total_deliveries: Number(hook.total_deliveries || 0) + 1,
        successful_deliveries: Number(hook.successful_deliveries || 0) + (ok ? 1 : 0),
        failed_deliveries: Number(hook.failed_deliveries || 0) + (ok ? 0 : 1),
        last_delivery_at: attemptedAt,
        updated_at: attemptedAt,
      })
      .eq("id", webhookId);

    return json(200, {
      ok: true,
      delivered: ok,
      status,
      durationMs,
      response: truncate(responseBody || "", 800),
    });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
