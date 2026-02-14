/**
 * Shared privileged-access helpers for Edge Functions.
 *
 * Privileged == user has admin OR super_admin in public.user_roles.
 * This file intentionally avoids hardcoded email allowlists; roles are the source of truth.
 */
export type PrivilegedFlags = {
  roles: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPrivileged: boolean;
};

export async function getPrivilegedFlags(supabase: any, userId: string): Promise<PrivilegedFlags> {
  if (!userId) return { roles: [], isAdmin: false, isSuperAdmin: false, isPrivileged: false };

  try {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (error) return { roles: [], isAdmin: false, isSuperAdmin: false, isPrivileged: false };

    const roles = (data || [])
      .map((r: any) => String(r?.role ?? "").trim())
      .filter((r: string) => r.length > 0);

    const isSuperAdmin = roles.includes("super_admin");
    const isAdmin = isSuperAdmin || roles.includes("admin");

    return {
      roles,
      isAdmin,
      isSuperAdmin,
      isPrivileged: isAdmin || isSuperAdmin,
    };
  } catch {
    return { roles: [], isAdmin: false, isSuperAdmin: false, isPrivileged: false };
  }
}
