/**
 * Privileged role helpers (Edge Functions)
 *
 * "Privileged" means the caller has a DB-backed role of:
 * - admin
 * - super_admin
 *
 * These helpers intentionally do NOT depend on Postgres RPCs so they work
 * even in deployments where the public.has_role function isn't present.
 */
type RoleRow = { role?: unknown } | null | undefined;

export type PrivilegedFlags = {
  roles: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPrivileged: boolean;
};

export function normalizeRole(role: unknown): string {
  return String(role ?? "").trim().toLowerCase();
}

function normalizeEmail(email: unknown): string {
  return String(email ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
}

function safeEnv(key: string): string {
  try {
    // Edge runtime provides Deno.env; keep it safe for local tooling.
    return String((globalThis as any).Deno?.env?.get?.(key) ?? "");
  } catch {
    return "";
  }
}

function getCoreEmail(params: { envKey: string; fallback: string }): string {
  const direct = normalizeEmail(safeEnv(params.envKey));
  if (direct) return direct;
  // Some deployments reuse client env names.
  const vite = normalizeEmail(safeEnv(`VITE_${params.envKey}`));
  if (vite) return vite;
  return normalizeEmail(params.fallback);
}

const CORE_SUPER_ADMIN_EMAIL = getCoreEmail({
  envKey: "ADMIN_SUPER_EMAIL",
  fallback: "n8ter8@gmail.com",
});
const CORE_ADMIN_EMAIL = getCoreEmail({
  envKey: "ADMIN_EMAIL",
  fallback: "butterflii18@gmail.com",
});

export function flagsFromRoles(roles: string[]): Omit<PrivilegedFlags, "roles"> {
  const set = new Set(roles.map(r => String(r).trim().toLowerCase()).filter(Boolean));
  const isSuperAdmin = set.has("super_admin");
  const isAdmin = set.has("admin");
  return { isAdmin, isSuperAdmin, isPrivileged: isAdmin || isSuperAdmin };
}

export async function fetchUserRoles(supabase: any, userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (error) return [];
    return (data || []).map((r: RoleRow) => normalizeRole(r?.role)).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getPrivilegedFlags(
  supabase: any,
  userId: string,
  userEmail?: string | null,
): Promise<PrivilegedFlags> {
  const roles = await fetchUserRoles(supabase, userId);
  const set = new Set(roles.map(r => normalizeRole(r)).filter(Boolean));

  // Core email allowlist (defense-in-depth for internal admin accounts).
  const email = normalizeEmail(userEmail);
  if (email && CORE_ADMIN_EMAIL && email === CORE_ADMIN_EMAIL) set.add("admin");
  if (email && CORE_SUPER_ADMIN_EMAIL && email === CORE_SUPER_ADMIN_EMAIL) set.add("super_admin");

  // super_admin implies admin privileges.
  if (set.has("super_admin")) set.add("admin");

  const merged = Array.from(set.values());
  return { roles: merged, ...flagsFromRoles(merged) };
}

