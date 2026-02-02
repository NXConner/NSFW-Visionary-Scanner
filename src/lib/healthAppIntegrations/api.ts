import { supabase } from "@/integrations/supabase/client";
import type { HealthAppIntegration } from "./types";

type JsonObject = Record<string, unknown>;

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function nowIso() {
  return new Date().toISOString();
}

export async function connectHealthApp(
  integrationType: HealthAppIntegration["integration_type"],
  integrationName: string,
  syncDataTypes: string[],
): Promise<HealthAppIntegration | null> {
  const userId = await requireUserId();

  // Persist a connection configuration record. Token exchange happens via platform/OAuth flows.
  const { data, error } = await supabase

    .from("health_app_integrations" as any)
    .upsert(
      {
        user_id: userId,
        integration_type: integrationType,
        integration_name: integrationName,
        is_connected: false,
        connection_status: "disconnected",
        last_sync_at: null,
        last_sync_status: null,
        last_error: null,
        auto_sync_enabled: true,
        sync_frequency_minutes: 60,
        sync_data_types: syncDataTypes,
        permissions_granted: null,
        permissions_required: null,
        updated_at: nowIso(),
      },
      { onConflict: "user_id,integration_type" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as HealthAppIntegration | null;
}

export async function getHealthAppIntegrations(): Promise<HealthAppIntegration[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase

    .from("health_app_integrations" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as HealthAppIntegration[];
}

export async function syncHealthAppData(integrationId: string): Promise<boolean> {
  const userId = await requireUserId();
  // Record a sync attempt (actual external connector handled separately).
  const { data: integration, error: getErr } = await supabase

    .from("health_app_integrations" as any)
    .select("*")
    .eq("id", integrationId)
    .eq("user_id", userId)
    .single();
  if (getErr) throw getErr;

  const integrationData = integration as any;
  const missingCredentials =
    !integrationData?.access_token_encrypted && !integrationData?.api_key_encrypted;

  const historyPayload: JsonObject = {
    integration_id: integrationId,
    user_id: userId,
    sync_type: "import",
    data_type: (integrationData?.sync_data_types?.[0] ?? "unknown") as string,
    records_synced: 0,
    records_added: 0,
    records_updated: 0,
    records_failed: 0,
    sync_status: missingCredentials ? "failed" : "completed",
    started_at: nowIso(),
    completed_at: nowIso(),
    error_message: missingCredentials
      ? "No connector credentials configured for this integration."
      : null,
    error_details: missingCredentials ? { reason: "missing_credentials" } : null,
  };

  await supabase.from("health_data_sync_history" as any).insert(historyPayload);

  await supabase

    .from("health_app_integrations" as any)
    .update({
      last_sync_at: nowIso(),
      last_sync_status: missingCredentials ? "failed" : "success",
      last_error: missingCredentials ? "Missing credentials" : null,
      updated_at: nowIso(),
    })
    .eq("id", integrationId)
    .eq("user_id", userId);

  return !missingCredentials;
}

export async function disconnectHealthApp(integrationId: string): Promise<boolean> {
  const userId = await requireUserId();
  const { error } = await supabase

    .from("health_app_integrations" as any)
    .update({
      is_connected: false,
      connection_status: "disconnected",
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      api_key_encrypted: null,
      updated_at: nowIso(),
    })
    .eq("id", integrationId)
    .eq("user_id", userId);
  if (error) throw error;
  return true;
}
