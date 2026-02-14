import type { AppUpdateSource, AgeVerification, DLCPackage, DLCLicense, DLCInstallation } from "../types";
import { serializeAgeVerification, serializeDLCInstallation, serializeDLCLicense, serializeDLCPackage } from "../serializers";

const CACHE_KEY_PACKAGES = "dlc_cache_packages_v2";
const CACHE_KEY_LICENSES_BASE = "dlc_cache_licenses_v2";
const CACHE_KEY_INSTALLATIONS_BASE = "dlc_cache_installations_v2";
const CACHE_KEY_AGE_BASE = "dlc_cache_age_verification_v2";
const CACHE_KEY_UPDATE_SOURCE_BASE = "dlc_cache_update_source_v2";

function userKey(base: string, userId?: string | null): string {
  const id = String(userId || "").trim();
  return id ? `${base}:${id}` : base;
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export const dlcCache = {
  loadPackages(): DLCPackage[] {
    const raw = readJson(CACHE_KEY_PACKAGES);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(x => x && typeof x === "object")
      .map(x => serializeDLCPackage(x as Record<string, unknown>));
  },

  savePackages(packages: DLCPackage[]): void {
    writeJson(CACHE_KEY_PACKAGES, packages);
  },

  loadLicenses(userId?: string | null): DLCLicense[] {
    const raw = readJson(userKey(CACHE_KEY_LICENSES_BASE, userId));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(x => x && typeof x === "object")
      .map(x => serializeDLCLicense(x as Record<string, unknown>));
  },

  saveLicenses(userId: string | null | undefined, licenses: DLCLicense[]): void {
    writeJson(userKey(CACHE_KEY_LICENSES_BASE, userId), licenses);
  },

  loadInstallations(userId?: string | null): DLCInstallation[] {
    const raw = readJson(userKey(CACHE_KEY_INSTALLATIONS_BASE, userId));
    if (!Array.isArray(raw)) return [];
    return raw
      .filter(x => x && typeof x === "object")
      .map(x => serializeDLCInstallation(x as Record<string, unknown>));
  },

  saveInstallations(userId: string | null | undefined, installations: DLCInstallation[]): void {
    writeJson(userKey(CACHE_KEY_INSTALLATIONS_BASE, userId), installations);
  },

  loadAgeVerification(userId?: string | null): AgeVerification | null {
    const raw = readJson(userKey(CACHE_KEY_AGE_BASE, userId));
    if (!raw || typeof raw !== "object") return null;
    return serializeAgeVerification(raw as Record<string, unknown>);
  },

  saveAgeVerification(userId: string | null | undefined, v: AgeVerification): void {
    writeJson(userKey(CACHE_KEY_AGE_BASE, userId), v);
  },

  loadUpdateSource(userId?: string | null): AppUpdateSource | null {
    const raw = readJson(userKey(CACHE_KEY_UPDATE_SOURCE_BASE, userId));
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    return {
      id: typeof r.id === "string" ? r.id : undefined,
      userId: typeof r.userId === "string" ? r.userId : "",
      deviceId: typeof r.deviceId === "string" ? r.deviceId : "",
      originalInstallSource: (r.originalInstallSource as any) ?? undefined,
      currentUpdateSource: (r.currentUpdateSource as any) ?? "store",
      sourceChangedAt: r.sourceChangedAt ? new Date(String(r.sourceChangedAt)) : undefined,
      sourceChangeReason: typeof r.sourceChangeReason === "string" ? r.sourceChangeReason : undefined,
      updateSourceAcknowledged: Boolean(r.updateSourceAcknowledged),
      acknowledgedAt: r.acknowledgedAt ? new Date(String(r.acknowledgedAt)) : undefined,
    };
  },

  saveUpdateSource(userId: string | null | undefined, v: AppUpdateSource): void {
    writeJson(userKey(CACHE_KEY_UPDATE_SOURCE_BASE, userId), v);
  },
};

