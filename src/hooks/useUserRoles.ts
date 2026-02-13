import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearSuperAdminCache } from "@/lib/superAdmin";
import { getAdminRoleByEmail } from "@/lib/auth/adminManager";
import {
  clearPersistedRoles,
  getLastKnownUserId,
  getPersistedRolesForUser,
  writePersistedRolesPayload,
} from "@/lib/auth/rolesCache";

type AppRole = "admin" | "super_admin" | "pro" | "user";

interface UseUserRolesReturn {
  user: any;
  roles: AppRole[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPro: boolean;
  isPremium: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Cache for roles to prevent excessive DB calls on re-renders
let cachedRoles: { userId: string; roles: AppRole[]; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds
const INITIAL_PERSISTED_ROLES = (() => {
  try {
    const lastUserId = getLastKnownUserId();
    const roles = getPersistedRolesForUser(lastUserId);
    return roles.filter(
      r => r === "admin" || r === "super_admin" || r === "pro" || r === "user",
    ) as AppRole[];
  } catch {
    return [] as AppRole[];
  }
})();

function mergeRolesWithEmailAdmin(roles: AppRole[], email?: string | null): AppRole[] {
  const set = new Set<AppRole>(roles);
  const emailRole = getAdminRoleByEmail(email);
  if (emailRole === "super_admin") {
    set.add("super_admin");
    set.add("admin");
  } else if (emailRole === "admin") {
    set.add("admin");
  }
  return Array.from(set.values());
}

export const useUserRoles = (): UseUserRolesReturn => {
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<AppRole[]>(INITIAL_PERSISTED_ROLES);
  // If we already have persisted roles, do SWR (don't block UI while we revalidate).
  const [isLoading, setIsLoading] = useState(INITIAL_PERSISTED_ROLES.length === 0);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const rolesRef = useRef<AppRole[]>(INITIAL_PERSISTED_ROLES);

  useEffect(() => {
    rolesRef.current = roles;
  }, [roles]);

  const fetchRoles = async () => {
    try {
      // Only block UI if we have no cached/persisted roles to render from.
      if (rolesRef.current.length === 0) setIsLoading(true);
      setError(null);

      // Race against a 2-second timeout to prevent UI blocking
      const userResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise<{ data: { user: null }; error: null }>(resolve =>
          setTimeout(() => resolve({ data: { user: null }, error: null }), 2000),
        ),
      ]);

      const {
        data: { user },
        error: userError,
      } = userResult;

      if (userError) {
        throw userError;
      }

      if (!mountedRef.current) return;
      setUser(user);

      if (!user) {
        setRoles([]);
        clearSuperAdminCache();
        clearPersistedRoles();
        return;
      }

      // Immediately apply user-bound persisted roles and email-derived core roles (SWR).
      // This prevents privileged core-email accounts from being "re-locked" if the DB role row
      // is missing, slow, or temporarily unavailable.
      try {
        const persisted = getPersistedRolesForUser(user.id).filter(
          r => r === "admin" || r === "super_admin" || r === "pro" || r === "user",
        ) as AppRole[];
        const mergedPersisted = mergeRolesWithEmailAdmin(persisted, user.email);
        if (mergedPersisted.length > 0) {
          setRoles(mergedPersisted);
          writePersistedRolesPayload(user.id, mergedPersisted);
        }
      } catch {
        // ignore
      }

      // Check cache first
      const now = Date.now();
      if (
        cachedRoles &&
        cachedRoles.userId === user.id &&
        now - cachedRoles.timestamp < CACHE_TTL
      ) {
        const merged = mergeRolesWithEmailAdmin(cachedRoles.roles, user.email);
        cachedRoles = { userId: user.id, roles: merged, timestamp: cachedRoles.timestamp };
        setRoles(merged);
        writePersistedRolesPayload(user.id, merged);
        return;
      }

      // Database-driven role check with 2s timeout
      const roleResult = await Promise.race([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        new Promise<{ data: null; error: { message: string } }>(resolve =>
          setTimeout(() => resolve({ data: null, error: { message: "Role check timeout" } }), 2000),
        ),
      ]);

      if (!mountedRef.current) return;

      const { data, error: fetchError } = roleResult;

      if (fetchError) {
        console.warn("[useUserRoles] Role fetch failed:", fetchError.message);
        // On timeout/error, prefer user-bound persisted roles, merged with email-derived core roles.
        const persisted = getPersistedRolesForUser(user.id).filter(
          r => r === "admin" || r === "super_admin" || r === "pro" || r === "user",
        ) as AppRole[];
        const base = cachedRoles && cachedRoles.userId === user.id ? cachedRoles.roles : persisted;
        const merged = mergeRolesWithEmailAdmin(base, user.email);
        if (merged.length > 0) {
          setRoles(merged);
          writePersistedRolesPayload(user.id, merged);
          if (cachedRoles && cachedRoles.userId === user.id) {
            cachedRoles = { userId: user.id, roles: merged, timestamp: cachedRoles.timestamp };
          }
        }
        setError(fetchError.message);
        return;
      }

      const dbRoles = (data?.map(r => r.role as AppRole) || []).filter(Boolean);
      const mergedDbRoles = mergeRolesWithEmailAdmin(dbRoles, user.email);

      // Update cache
      cachedRoles = { userId: user.id, roles: mergedDbRoles, timestamp: now };

      setRoles(mergedDbRoles);
      writePersistedRolesPayload(user.id, mergedDbRoles);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to fetch roles");
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Aggressive 1.5s fallback to prevent infinite loading
    const fallback = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }, 1500);

    fetchRoles();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        clearSuperAdminCache();
        cachedRoles = null;
      }
      fetchRoles();
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  // SUPER ADMIN EARLY CHECK: Use cached value for immediate access if available
  // This prevents locked flash during initial load
  const isSuperAdminCachedValue =
    roles.includes("super_admin") ||
    (cachedRoles?.userId === user?.id && cachedRoles?.roles.includes("super_admin"));

  return {
    user,
    roles,
    isAdmin: roles.includes("admin") || roles.includes("super_admin") || isSuperAdminCachedValue,
    isSuperAdmin: roles.includes("super_admin") || isSuperAdminCachedValue,
    isPro: roles.includes("pro"),
    isPremium:
      roles.includes("admin") ||
      roles.includes("super_admin") ||
      roles.includes("pro") ||
      isSuperAdminCachedValue,
    isLoading,
    error,
    refetch: fetchRoles,
  };
};
