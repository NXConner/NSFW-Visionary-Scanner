/**
 * Persisted user role cache (browser-only).
 *
 * Purpose:
 * - Provide a synchronous "early" privileged check on cold starts (before auth/DB resolves),
 *   without trusting stale roles across different users.
 * - Keep backward-compat with older builds that stored `user_roles` as a raw string[].
 */
export const USER_ROLES_STORAGE_KEY = "user_roles";
export const LAST_USER_ID_STORAGE_KEY = "lovable_last_user_id";

export type PersistedRolesPayloadV1 = {
  v: 1;
  userId: string | null;
  roles: string[];
  updatedAtMs: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeRole(role: unknown): string | null {
  const r = String(role ?? "")
    .trim()
    .toLowerCase();
  return r ? r : null;
}

function normalizeRoles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of value) {
    const n = normalizeRole(r);
    if (!n) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function safeGetItem(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getLastKnownUserId(): string | null {
  const raw = safeGetItem(LAST_USER_ID_STORAGE_KEY);
  const id = String(raw ?? "").trim();
  return id ? id : null;
}

/**
 * Read persisted roles.
 * Supports legacy formats:
 * - string[] (no userId binding)
 * - { v: 1, userId, roles, updatedAtMs }
 */
export function readPersistedRolesPayload(): PersistedRolesPayloadV1 | null {
  const raw = safeGetItem(USER_ROLES_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;

    // Legacy: raw array of roles
    if (Array.isArray(parsed)) {
      const roles = normalizeRoles(parsed);
      if (roles.length === 0) return null;
      return { v: 1, userId: null, roles, updatedAtMs: 0 };
    }

    if (!isRecord(parsed)) return null;
    const roles = normalizeRoles((parsed as any).roles);
    if (roles.length === 0) return null;
    const userIdRaw = (parsed as any).userId;
    const userId = userIdRaw == null ? null : String(userIdRaw).trim();
    const updatedAtMsRaw = Number((parsed as any).updatedAtMs ?? 0);
    const updatedAtMs = Number.isFinite(updatedAtMsRaw) ? updatedAtMsRaw : 0;
    return { v: 1, userId: userId || null, roles, updatedAtMs };
  } catch {
    return null;
  }
}

export function writePersistedRolesPayload(userId: string, roles: string[]): void {
  const normalized = normalizeRoles(roles);
  if (!userId || normalized.length === 0) {
    clearPersistedRoles();
    return;
  }

  const payload: PersistedRolesPayloadV1 = {
    v: 1,
    userId,
    roles: normalized,
    updatedAtMs: Date.now(),
  };
  safeSetItem(USER_ROLES_STORAGE_KEY, JSON.stringify(payload));
}

export function clearPersistedRoles(): void {
  safeRemoveItem(USER_ROLES_STORAGE_KEY);
}

/**
 * Return roles only if they can be safely attributed to `expectedUserId`.
 * If `expectedUserId` is omitted, we use the last known user id from localStorage
 * to avoid treating roles from a different user as current.
 */
export function getPersistedRolesForUser(expectedUserId?: string | null): string[] {
  const payload = readPersistedRolesPayload();
  if (!payload) return [];

  const expected = (expectedUserId ?? getLastKnownUserId()) || null;
  if (!expected) return [];

  // New format: enforce userId match.
  if (payload.userId && payload.userId !== expected) return [];

  // Legacy format: no userId binding; only trust when we at least have a last user id.
  return payload.roles.slice();
}

export function hasPrivilegedRole(roles: readonly string[]): boolean {
  return roles.includes("super_admin") || roles.includes("admin");
}

export function isAnyPrivilegedRolePersisted(): boolean {
  const roles = getPersistedRolesForUser(getLastKnownUserId());
  return hasPrivilegedRole(roles);
}

