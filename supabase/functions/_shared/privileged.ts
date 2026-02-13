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

export async function getPrivilegedFlags(supabase: any, userId: string): Promise<PrivilegedFlags> {
  const roles = await fetchUserRoles(supabase, userId);
  return { roles, ...flagsFromRoles(roles) };
}

