import { logger } from "@/lib/logger";

// Check if localStorage is available and accessible
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const testKey = '__dlc_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function safeJsonStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function setLocalStorageJson(key: string, value: unknown): void {
  if (!isLocalStorageAvailable()) return;
  try {
    const payload = safeJsonStringify(value);
    if (payload == null) return;
    localStorage.setItem(key, payload);
  } catch {
    // ignore
  }
}

export function getLocalStorageJson<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    return safeJsonParse<T>(localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function asDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export function reviveDates<T extends Record<string, unknown>>(obj: T, keys: string[]): T {
  for (const k of keys) {
    const d = asDate(obj[k]);
    if (d) (obj as Record<string, unknown>)[k] = d;
  }
  return obj;
}

export function warnStorage(scope: string, error: unknown): void {
  logger.warn(scope, { error });
}
