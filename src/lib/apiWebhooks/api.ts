import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import type { APIKey, Webhook, WebhookDelivery } from "./types";
import { randomApiKey, sha256Hex } from "./crypto";
import { validateWebhookUrl } from "@/lib/urlValidation";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function tierLimits(tier: APIKey["access_tier"]) {
  if (tier === "enterprise") return { minute: 1200, hour: 50000, day: 500000 };
  if (tier === "pro") return { minute: 300, hour: 10000, day: 100000 };
  return { minute: 60, hour: 1000, day: 10000 };
}

function randomSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function createAPIKey(
  keyName: string,
  accessTier: APIKey["access_tier"] = "basic",
): Promise<{ api_key: string; apiKeyRecord: APIKey } | null> {
  const userId = await requireUserId();
  const apiKey = randomApiKey();
  const apiKeyHash = await sha256Hex(apiKey);
  const apiKeyPrefix = apiKey.split("_")[1] ?? apiKey.slice(0, 8);
  const limits = tierLimits(accessTier);

  const { data, error } = await fromExtended("api_keys")
    .insert({
      user_id: userId,
      key_name: keyName,
      api_key_hash: apiKeyHash,
      api_key_prefix: apiKeyPrefix,
      access_tier: accessTier,
      rate_limit_per_minute: limits.minute,
      rate_limit_per_hour: limits.hour,
      rate_limit_per_day: limits.day,
      allowed_endpoints: null,
      allowed_methods: ["GET", "POST"],
      is_active: true,
      expires_at: null,
      last_used_at: null,
      total_requests: 0,
      last_request_at: null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return { api_key: apiKey, apiKeyRecord: data as unknown as APIKey };
}

export async function getAPIKeys(): Promise<APIKey[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("api_keys")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as APIKey[];
}

export async function revokeAPIKey(keyId: string): Promise<boolean> {
  const userId = await requireUserId();
  const { error } = await fromExtended("api_keys")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}

/**
 * Rotate an API key: generates a new secret, replaces the stored hash, and returns the new key once.
 */
export async function rotateAPIKey(
  keyId: string,
): Promise<{ api_key: string; apiKeyRecord: APIKey } | null> {
  const userId = await requireUserId();
  const apiKey = randomApiKey();
  const apiKeyHash = await sha256Hex(apiKey);
  const apiKeyPrefix = apiKey.split("_")[1] ?? apiKey.slice(0, 8);

  const { data, error } = await fromExtended("api_keys")
    .update({
      api_key_hash: apiKeyHash,
      api_key_prefix: apiKeyPrefix,
      is_active: true,
      updated_at: new Date().toISOString(),
      last_used_at: null,
      last_request_at: null,
      total_requests: 0,
    })
    .eq("id", keyId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error || !data) throw error ?? new Error("API key not found");
  return { api_key: apiKey, apiKeyRecord: data as unknown as APIKey };
}

export async function createWebhook(
  webhookName: string,
  webhookUrl: string,
  subscribedEvents: string[],
): Promise<Webhook | null> {
  // Validate webhook name
  if (!webhookName || webhookName.trim().length < 1) {
    throw new Error("Webhook name is required");
  }
  if (webhookName.length > 100) {
    throw new Error("Webhook name must be 100 characters or less");
  }

  const events = Array.isArray(subscribedEvents) ? subscribedEvents.filter(Boolean) : [];
  if (events.length === 0) {
    throw new Error("Select at least one event");
  }

  // Validate webhook URL for security (SSRF prevention)
  const urlValidation = validateWebhookUrl(webhookUrl);
  if (!urlValidation.isValid) {
    throw new Error(urlValidation.error || "Invalid webhook URL");
  }

  const userId = await requireUserId();
  const secret = randomSecret();
  const token = randomSecret();
  const { data, error } = await fromExtended("webhooks")
    .insert({
      user_id: userId,
      webhook_name: webhookName.trim(),
      webhook_url: urlValidation.normalizedUrl,
      webhook_secret: secret,
      subscribed_events: events,
      is_active: true,
      is_verified: false,
      verification_token: token,
      max_retries: 3,
      retry_delay_seconds: 60,
      total_deliveries: 0,
      successful_deliveries: 0,
      failed_deliveries: 0,
      last_delivery_at: null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as Webhook | null;
}

export async function getWebhooks(): Promise<Webhook[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("webhooks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as Webhook[];
}

export async function verifyWebhook(webhookId: string): Promise<boolean> {
  const { error } = await supabase.functions.invoke("verify-webhook", {
    body: { webhook_id: webhookId },
  });
  if (error) throw error;
  return true;
}

export async function deliverTestWebhook(webhookId: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke("deliver-webhook", {
    body: { webhook_id: webhookId, event_type: "webhook.test", payload: { test: true } },
  });
  if (error) throw error;
  return Boolean((data as any)?.ok);
}

export async function deleteWebhook(webhookId: string): Promise<boolean> {
  const userId = await requireUserId();
  const { error } = await fromExtended("webhooks")
    .delete()
    .eq("id", webhookId)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}

export async function getWebhookDeliveries(params: {
  webhookId: string;
  limit?: number;
}): Promise<WebhookDelivery[]> {
  const { webhookId, limit = 25 } = params;
  if (!webhookId) return [];
  await requireUserId(); // ensures authenticated (RLS enforces ownership)

  const { data, error } = await fromExtended("webhook_deliveries")
    .select("*")
    .eq("webhook_id", webhookId)
    .order("attempted_at", { ascending: false })
    .limit(Math.max(1, Math.min(100, limit)));
  if (error) throw error;
  return (data ?? []) as unknown as WebhookDelivery[];
}
