type CachedPayload<T> = {
  value: T;
  expiresAt: number;
};

const CACHE_PREFIX = "partner_sync_cache";

function makeKey(key: string) {
  return `${CACHE_PREFIX}:${key}`;
}

export function setCachedValue<T>(key: string, value: T, ttlMs: number) {
  try {
    const payload: CachedPayload<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
    };
    localStorage.setItem(makeKey(key), JSON.stringify(payload));
  } catch {
    // ignore cache write failures
  }
}

export function getCachedValue<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(makeKey(key));
    if (!raw) return null;
    const payload = JSON.parse(raw) as CachedPayload<T>;
    if (Date.now() > payload.expiresAt) {
      localStorage.removeItem(makeKey(key));
      return null;
    }
    return payload.value;
  } catch {
    return null;
  }
}

export function clearCachedValue(key: string) {
  try {
    localStorage.removeItem(makeKey(key));
  } catch {
    // ignore
  }
}
