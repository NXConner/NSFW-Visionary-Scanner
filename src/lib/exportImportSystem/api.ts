import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import type { CloudServiceConnection, ExportJob, ImportJob } from "./types";

type JsonObject = Record<string, unknown>;

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function createExportJob(
  exportType: ExportJob["export_type"],
  exportName: string,
  exportConfig: JsonObject,
  dataSources: string[],
  options?: { cloudService?: string; emailRecipients?: string[] },
): Promise<ExportJob | null> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("export_jobs")
    .insert({
      user_id: userId,
      export_type: exportType,
      export_name: exportName,
      export_config: exportConfig,
      data_sources: dataSources,
      export_status: "pending",
      progress_percentage: 0,
      file_url: null,
      cloud_service: options?.cloudService ?? null,
      email_recipients: options?.emailRecipients ?? null,
      started_at: null,
      completed_at: null,
      failed_at: null,
      error_message: null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as ExportJob | null;
}

export async function getExportJobs(): Promise<ExportJob[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("export_jobs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as ExportJob[];
}

export async function createImportJob(
  importType: ImportJob["import_type"],
  importName: string,
  fileUrl: string,
  importConfig: JsonObject,
  dataMapping?: JsonObject,
): Promise<ImportJob | null> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("import_jobs")
    .insert({
      user_id: userId,
      import_type: importType,
      import_name: importName,
      file_url: fileUrl,
      import_config: importConfig,
      data_mapping: dataMapping ?? null,
      import_status: "pending",
      progress_percentage: 0,
      records_total: 0,
      records_imported: 0,
      records_failed: 0,
      records_skipped: 0,
      validation_errors: null,
      import_errors: null,
      started_at: null,
      completed_at: null,
      failed_at: null,
      error_message: null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as ImportJob | null;
}

export async function getImportJobs(): Promise<ImportJob[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("import_jobs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as ImportJob[];
}

export async function connectCloudService(
  serviceType: CloudServiceConnection["service_type"],
  serviceName: string,
): Promise<CloudServiceConnection | null> {
  const userId = await requireUserId();
  // This function persists a connection request record. OAuth/token exchange is handled elsewhere.
  const { data, error } = await fromExtended("cloud_service_connections")
    .upsert(
      {
        user_id: userId,
        service_type: serviceType,
        service_name: serviceName,
        is_connected: false,
        connection_status: "disconnected",
        last_sync_at: null,
        permissions_granted: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,service_type" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return (data ?? null) as unknown as CloudServiceConnection | null;
}

export async function getCloudServiceConnections(): Promise<CloudServiceConnection[]> {
  const userId = await requireUserId();
  const { data, error } = await fromExtended("cloud_service_connections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as CloudServiceConnection[];
}
