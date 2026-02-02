import { decryptData, encryptData, isEncrypted } from "@/lib/encryption";
import type { CalibrationProfile } from "./types";
import { getCalibrationDeviceKey } from "./deviceKey";

const CALIBRATION_PROFILE_KEY = "morphoscan_calibration_profile_encrypted_v1";
const LEGACY_CALIBRATION_PROFILE_KEY = "morphoscan_calibration_profile_v1";

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const testKey = "__calibration_storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function safeParseJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function loadCalibrationProfile(): Promise<CalibrationProfile | null> {
  if (!isLocalStorageAvailable()) return null;

  const deviceKey = getCalibrationDeviceKey();

  try {
    const encrypted = localStorage.getItem(CALIBRATION_PROFILE_KEY);
    const legacy = localStorage.getItem(LEGACY_CALIBRATION_PROFILE_KEY);

    // Migrate legacy to encrypted if present.
    if (legacy && !encrypted) {
      const enc = await encryptData(legacy);
      localStorage.setItem(CALIBRATION_PROFILE_KEY, enc);
      localStorage.removeItem(LEGACY_CALIBRATION_PROFILE_KEY);
    }

    const stored = localStorage.getItem(CALIBRATION_PROFILE_KEY);
    if (!stored) return null;

    const decrypted = isEncrypted(stored) ? await decryptData(stored) : stored;
    if (!decrypted) return null;
    const parsed = safeParseJson<CalibrationProfile>(decrypted);
    if (!parsed) return null;

    // Only apply calibration if it matches this device signature.
    if (parsed.deviceKey !== deviceKey) return null;
    if (parsed.schemaVersion !== 1) return null;
    if (!Number.isFinite(parsed.pixelsPerMm) || parsed.pixelsPerMm <= 0) return null;

    return parsed;
  } catch {
    return null;
  }
}

export async function saveCalibrationProfile(profile: CalibrationProfile): Promise<void> {
  if (!isLocalStorageAvailable()) return;
  try {
    const deviceKey = getCalibrationDeviceKey();
    const updated: CalibrationProfile = {
      ...profile,
      deviceKey,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    };
    const encrypted = await encryptData(JSON.stringify(updated));
    localStorage.setItem(CALIBRATION_PROFILE_KEY, encrypted);
  } catch {
    // ignore
  }
}

export async function clearCalibrationProfile(): Promise<void> {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.removeItem(CALIBRATION_PROFILE_KEY);
    localStorage.removeItem(LEGACY_CALIBRATION_PROFILE_KEY);
  } catch {
    // ignore
  }
}

export function isCalibrationStale(profile: CalibrationProfile, maxAgeDays: number = 60): boolean {
  const days = Math.max(7, Math.min(365, Math.round(maxAgeDays)));
  const updated = Date.parse(profile.updatedAt);
  if (!Number.isFinite(updated)) return true;
  const ageMs = Date.now() - updated;
  return ageMs > days * 24 * 60 * 60 * 1000;
}
