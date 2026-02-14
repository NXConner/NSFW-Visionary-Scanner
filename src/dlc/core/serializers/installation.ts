import type { DLCInstallation, DevicePlatform } from "../dlcTypes";
import { asBoolean, asDate, asNumber, asString } from "./utils";

function normalizePlatform(value: unknown): DevicePlatform | undefined {
  const s = asString(value, "").trim().toLowerCase();
  if (s === "android") return "android";
  if (s === "ios") return "ios";
  if (s === "web") return "web";
  return undefined;
}

export function serializeDLCInstallation(row: Record<string, unknown>): DLCInstallation {
  const createdAt = asDate(row.created_at ?? row.createdAt) ?? new Date();
  const updatedAt = asDate(row.updated_at ?? row.updatedAt) ?? createdAt;

  const installDate =
    asDate(row.install_date ?? row.installDate) ??
    asDate(row.installed_at ?? row.installedAt) ??
    createdAt;

  const isValid = row.is_valid != null ? asBoolean(row.is_valid, true) : true;

  return {
    id: asString(row.id, crypto.randomUUID()),
    userId: asString(row.user_id ?? row.userId, ""),
    licenseId: asString(row.license_id ?? row.licenseId, ""),
    packageId: asString(row.package_id ?? row.packageId, ""),
    deviceId: asString(row.device_id ?? row.deviceId, ""),

    installedVersion: asString(row.installed_version ?? row.installedVersion, "1.0.0"),
    contentVersion: asString(row.content_version ?? row.contentVersion, "").trim() || undefined,
    installDate,
    installSource: asString(row.install_source ?? row.installSource, "").trim() || undefined,

    devicePlatform: normalizePlatform(row.device_platform ?? row.devicePlatform),
    deviceModel: asString(row.device_model ?? row.deviceModel, "").trim() || undefined,
    appVersion: asString(row.app_version ?? row.appVersion, "").trim() || undefined,

    storageUsedBytes:
      row.storage_used_bytes != null ? asNumber(row.storage_used_bytes, 0) : undefined,
    cachedContentBytes:
      row.cached_content_bytes != null ? asNumber(row.cached_content_bytes, 0) : undefined,

    isInstalled: asBoolean(row.is_installed ?? row.isInstalled, true),
    isCorrupted: asBoolean(row.is_corrupted ?? row.isCorrupted, !isValid),
    lastIntegrityCheck:
      asDate(row.last_integrity_check ?? row.lastIntegrityCheck) || undefined,
    lastUsedAt: asDate(row.last_used_at ?? row.lastUsedAt) || undefined,

    createdAt,
    updatedAt,
  };
}

