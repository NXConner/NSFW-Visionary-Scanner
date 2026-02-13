import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { getDeviceId, getDevicePlatform } from "../device";
import type {
  AgeVerification,
  AppUpdateSource,
  DLCPackage,
  DLCLicense,
  DLCInstallation,
} from "../types";
import {
  serializeAgeVerification,
  serializeDLCInstallation,
  serializeDLCLicense,
  serializeDLCPackage,
} from "../serializers";

type DbRow = Record<string, unknown>;

async function safeSelectAll(table: string, filter?: (q: any) => any): Promise<DbRow[]> {
  try {
    let q = (supabase as any).from(table).select("*");
    if (filter) q = filter(q);
    const { data, error } = await q;
    if (error) {
      logger.warn("[dlc] db select failed", { table, error: error.message });
      return [];
    }
    return Array.isArray(data) ? (data as DbRow[]) : [];
  } catch (err) {
    logger.warn("[dlc] db select crashed", { table, error: err });
    return [];
  }
}

export async function fetchPackagesFromDb(): Promise<DLCPackage[]> {
  const rows = await safeSelectAll("dlc_packages", q => q.eq("is_active", true));
  return rows.map(serializeDLCPackage);
}

export async function fetchLicensesFromDb(userId: string): Promise<DLCLicense[]> {
  if (!userId) return [];
  const rows = await safeSelectAll("dlc_licenses", q =>
    q.eq("user_id", userId).eq("is_active", true),
  );
  return rows.map(serializeDLCLicense).filter(l => l.isActive && l.packageId);
}

export async function fetchInstallationsFromDb(userId: string): Promise<DLCInstallation[]> {
  if (!userId) return [];
  const deviceId = getDeviceId();
  const rows = await safeSelectAll("dlc_installations", q =>
    q.eq("user_id", userId).eq("device_id", deviceId),
  );
  return rows.map(serializeDLCInstallation).filter(i => i.isInstalled && i.packageId);
}

export async function fetchAgeVerificationFromDb(userId: string): Promise<AgeVerification | null> {
  if (!userId) return null;
  try {
    const { data, error } = await (supabase as any)
      .from("dlc_age_verifications")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return serializeAgeVerification(data as DbRow);
  } catch {
    return null;
  }
}

export async function upsertAgeVerification(params: {
  userId: string;
  declaredAge: number;
  consent: boolean;
  termsVersion?: string;
}): Promise<boolean> {
  const { userId } = params;
  if (!userId) return false;
  if (params.declaredAge < 18 || !params.consent) return false;

  try {
    const nowIso = new Date().toISOString();
    const devicePlatform = getDevicePlatform();

    const { error } = await (supabase as any).from("dlc_age_verifications").upsert(
      {
        user_id: userId,
        verification_method: "self_declared",
        verified_at: nowIso,
        is_verified: true,
        declared_age: params.declaredAge,
        terms_accepted: true,
        terms_accepted_at: nowIso,
        terms_version: params.termsVersion || "1.0",
        adult_content_consent: true,
        metadata: { devicePlatform },
      },
      { onConflict: "user_id" },
    );
    if (error) {
      logger.warn("[dlc] upsertAgeVerification failed", { error: error.message });
      return false;
    }
    return true;
  } catch (err) {
    logger.warn("[dlc] upsertAgeVerification crashed", { error: err });
    return false;
  }
}

export async function fetchUpdateSourceFromDb(params: {
  userId: string;
  deviceId: string;
}): Promise<AppUpdateSource | null> {
  if (!params.userId || !params.deviceId) return null;
  try {
    const { data, error } = await (supabase as any)
      .from("dlc_update_sources")
      .select("*")
      .eq("user_id", params.userId)
      .eq("device_id", params.deviceId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as DbRow;
    return {
      id: typeof row.id === "string" ? row.id : undefined,
      userId: String(row.user_id ?? params.userId),
      deviceId: String(row.device_id ?? params.deviceId),
      originalInstallSource: (row.original_install_source as any) ?? undefined,
      currentUpdateSource: (row.current_update_source as any) ?? "store",
      sourceChangedAt: row.source_changed_at ? new Date(String(row.source_changed_at)) : undefined,
      sourceChangeReason:
        typeof row.source_change_reason === "string" ? row.source_change_reason : undefined,
      updateSourceAcknowledged: Boolean(row.update_source_acknowledged),
      acknowledgedAt: row.acknowledged_at ? new Date(String(row.acknowledged_at)) : undefined,
    };
  } catch {
    return null;
  }
}

export async function acknowledgeUpdateSource(params: {
  userId: string;
  deviceId: string;
}): Promise<void> {
  if (!params.userId || !params.deviceId) return;
  const nowIso = new Date().toISOString();
  try {
    await (supabase as any).from("dlc_update_sources").upsert(
      {
        user_id: params.userId,
        device_id: params.deviceId,
        current_update_source: "website",
        source_changed_at: nowIso,
        source_change_reason: "dlc_installed",
        update_source_acknowledged: true,
        acknowledged_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "user_id,device_id" },
    );
  } catch (err) {
    logger.warn("[dlc] acknowledgeUpdateSource failed", { error: err });
  }
}

export async function upsertInstallation(params: {
  userId: string;
  packageId: string;
  licenseId: string;
  installedVersion: string;
  contentVersion?: string;
  installSource?: string;
}): Promise<DLCInstallation | null> {
  const { userId, packageId, licenseId } = params;
  if (!userId || !packageId || !licenseId) return null;

  const deviceId = getDeviceId();
  const devicePlatform = getDevicePlatform();
  const nowIso = new Date().toISOString();

  try {
    const { data, error } = await (supabase as any)
      .from("dlc_installations")
      .upsert(
        {
          user_id: userId,
          package_id: packageId,
          license_id: licenseId,
          device_id: deviceId,
          installed_version: params.installedVersion,
          content_version: params.contentVersion ?? null,
          install_date: nowIso,
          install_source: params.installSource ?? "manual",
          device_platform: devicePlatform,
          is_installed: true,
          is_corrupted: false,
          updated_at: nowIso,
        },
        { onConflict: "user_id,package_id,device_id" },
      )
      .select("*")
      .maybeSingle();

    if (error || !data) {
      logger.warn("[dlc] upsertInstallation failed", { error: error?.message });
      return null;
    }

    return serializeDLCInstallation(data as DbRow);
  } catch (err) {
    logger.warn("[dlc] upsertInstallation crashed", { error: err });
    return null;
  }
}

export async function deleteInstallation(params: {
  userId: string;
  packageId: string;
}): Promise<void> {
  if (!params.userId || !params.packageId) return;
  const deviceId = getDeviceId();
  try {
    await (supabase as any)
      .from("dlc_installations")
      .delete()
      .eq("user_id", params.userId)
      .eq("package_id", params.packageId)
      .eq("device_id", deviceId);
  } catch (err) {
    logger.warn("[dlc] deleteInstallation failed", { error: err });
  }
}
