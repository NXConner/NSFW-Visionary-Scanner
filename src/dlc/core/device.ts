/**
 * DLC Device Utilities
 * - Generates a stable per-device identifier for device binding
 * - Detects platform for license/device records
 */
import type { DevicePlatform } from './types';

const DEVICE_ID_STORAGE_KEY = 'dlc_device_id';

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const testKey = '__dlc_device_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

let memoryDeviceId: string | null = null;

export const getDevicePlatform = (): DevicePlatform => {
  if (typeof window === 'undefined') return 'web';
  try {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/i.test(userAgent)) return 'android';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  } catch {
    // Ignore errors accessing navigator
  }
  return 'web';
};

export const getDeviceId = (): string => {
  if (typeof window === 'undefined') {
    return memoryDeviceId || (memoryDeviceId = `web-${crypto.randomUUID()}`);
  }

  if (isLocalStorageAvailable()) {
    try {
      const stored = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
      if (stored) return stored;

      const deviceId = `${getDevicePlatform()}-${crypto.randomUUID()}`;
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
      return deviceId;
    } catch {
      // Fall through to memory fallback
    }
  }

  if (!memoryDeviceId) {
    memoryDeviceId = `${getDevicePlatform()}-${crypto.randomUUID()}`;
  }
  return memoryDeviceId;
};
