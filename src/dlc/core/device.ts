/**
 * DLC Device Utilities
 * - Generates a stable per-device identifier for device binding
 * - Detects platform for license/device records
 */
import { Capacitor } from "@capacitor/core";
import type { DevicePlatform } from "./types";

const DEVICE_ID_STORAGE_KEY = "dlc_device_id_v1";
const LEGACY_DEVICE_ID_STORAGE_KEY = "dlc_device_id";

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const testKey = "__dlc_device_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

let memoryDeviceId: string | null = null;

export const getDevicePlatform = (): DevicePlatform => {
  if (typeof window === "undefined") return "web";
  try {
    const platform = Capacitor.getPlatform();
    if (platform === "ios" || platform === "android") return platform;
  } catch {
    // ignore
  }
  return "web";
};

function generateDeviceId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  // Fallback: should be rare, but must be stable enough to bind a device.
  return `uuid-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

export const getDeviceId = (): string => {
  if (typeof window === "undefined") {
    return memoryDeviceId || (memoryDeviceId = generateDeviceId());
  }

  if (isLocalStorageAvailable()) {
    try {
      const stored =
        localStorage.getItem(DEVICE_ID_STORAGE_KEY) ??
        localStorage.getItem(LEGACY_DEVICE_ID_STORAGE_KEY);
      if (stored) {
        // Migrate legacy key forward.
        localStorage.setItem(DEVICE_ID_STORAGE_KEY, stored);
        return stored;
      }

      const deviceId = generateDeviceId();
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
      return deviceId;
    } catch {
      // Fall through to memory fallback
    }
  }

  if (!memoryDeviceId) {
    memoryDeviceId = generateDeviceId();
  }
  return memoryDeviceId;
};
