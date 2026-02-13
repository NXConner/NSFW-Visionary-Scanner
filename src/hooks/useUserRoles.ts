import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { clearSuperAdminCache } from "@/lib/superAdmin";

type AppRole = "admin" | "super_admin" | "pro" | "user";

interface UseUserRolesReturn {
  user: any;
  roles: AppRole[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isPro: boolean;
  isPremium: boolean;
  isLoading: boolean;
  rolesFetched: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// LocalStorage key for persisting roles across page loads
const ROLES_STORAGE_KEY = "lovable_user_roles";

// Persist roles to localStorage
function persistRoles(userId: string, roles: AppRole[]): void {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify({ userId, roles, timestamp: Date.now() }));
  } catch {
    // localStorage may not be available
  }
}

// Get persisted roles from localStorage
function getPersistedRoles(userId?: string): AppRole[] {
  try {
    const stored = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Check if cached for same user and not expired (5 min TTL for localStorage cache)
    if (userId && parsed?.userId === userId && parsed?.roles) {
      const age = Date.now() - (parsed.timestamp || 0);
      if (age < 300000) { // 5 minutes
        return parsed.roles as AppRole[];
      }
    }
    return [];
  } catch {
    return [];
  }
}

// Clear persisted roles (on logout)
function clearPersistedRoles(): void {
  try {
    localStorage.removeItem(ROLES_STORAGE_KEY);
  } catch {
    // localStorage may not be available
  }
}

// Get initial roles from localStorage synchronously
function getInitialRoles(): { roles: AppRole[]; userId: string | null } {
  try {
    const stored = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!stored) return { roles: [], userId: null };
    const parsed = JSON.parse(stored);
    const age = Date.now() - (parsed.timestamp || 0);
    if (parsed?.roles && age < 300000) { // 5 minutes
      return { roles: parsed.roles as AppRole[], userId: parsed.userId };
    }
    return { roles: [], userId: null };
  } catch {
    return { roles: [], userId: null };
  }
}

// Module-level initial roles - computed ONCE when module loads
const INITIAL_CACHED_STATE = getInitialRoles();

// Cache for roles to prevent excessive DB calls on re-renders
let cachedRoles: { userId: string; roles: AppRole[]; timestamp: number } | null = 
  INITIAL_CACHED_STATE.roles.length > 0 
    ? { userId: INITIAL_CACHED_STATE.userId || "", roles: INITIAL_CACHED_STATE.roles, timestamp: Date.now() }
    : null;
const CACHE_TTL = 30000; // 30 seconds

export const useUserRoles = (): UseUserRolesReturn => {
  const [user, setUser] = useState<any>(null);
  // CRITICAL: Initialize with persisted roles to prevent "Free" flash
  const [roles, setRoles] = useState<AppRole[]>(INITIAL_CACHED_STATE.roles);
  const [isLoading, setIsLoading] = useState(INITIAL_CACHED_STATE.roles.length === 0);
  const [rolesFetched, setRolesFetched] = useState(INITIAL_CACHED_STATE.roles.length > 0);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Race against a 2-second timeout to prevent UI blocking
      const userResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise<{ data: { user: null }; error: null }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null }, error: null }), 2000)
        ),
      ]);

      const { data: { user }, error: userError } = userResult;

      if (userError) {
        throw userError;
      }

      if (!mountedRef.current) return;
      setUser(user);

      if (!user) {
        setRoles([]);
        setRolesFetched(true);
        clearSuperAdminCache();
        clearPersistedRoles();
        cachedRoles = null;
        return;
      }

      // Check localStorage cache first for instant premium display
      const persistedRoles = getPersistedRoles(user.id);
      if (persistedRoles.length > 0) {
        setRoles(persistedRoles);
        setRolesFetched(true);
        // Update memory cache too
        cachedRoles = { userId: user.id, roles: persistedRoles, timestamp: Date.now() };
      }

      // Check memory cache
      const now = Date.now();
      if (
        cachedRoles &&
        cachedRoles.userId === user.id &&
        now - cachedRoles.timestamp < CACHE_TTL
      ) {
        setRoles(cachedRoles.roles);
        setRolesFetched(true);
        return;
      }

      // Database-driven role check with 3s timeout
      const roleResult = await Promise.race([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: { message: "Role check timeout" } }), 3000)
        ),
      ]);

      if (!mountedRef.current) return;

      const { data, error: fetchError } = roleResult;

      if (fetchError) {
        console.warn("[useUserRoles] Role fetch failed:", fetchError.message);
        // On timeout/error, use cached roles if available
        if (cachedRoles && cachedRoles.userId === user.id) {
          setRoles(cachedRoles.roles);
          setRolesFetched(true);
        } else if (persistedRoles.length > 0) {
          setRoles(persistedRoles);
          setRolesFetched(true);
        }
        setError(fetchError.message);
        return;
      }

      const dbRoles = (data?.map((r) => r.role as AppRole) || []).filter(Boolean);
      
      // Update memory cache
      cachedRoles = { userId: user.id, roles: dbRoles, timestamp: now };
      
      // CRITICAL: Persist to localStorage for instant load on page refresh
      persistRoles(user.id, dbRoles);
      
      setRoles(dbRoles);
      setRolesFetched(true);
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

    // Fallback to prevent infinite loading
    const fallback = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }, 2000);

    fetchRoles();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        clearSuperAdminCache();
        clearPersistedRoles();
        cachedRoles = null;
        setRolesFetched(false);
      }
      fetchRoles();
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  // Compute derived states from roles
  const isSuperAdmin = roles.includes("super_admin");
  const isAdmin = roles.includes("admin") || isSuperAdmin;
  const isPro = roles.includes("pro");
  const isPremium = isAdmin || isSuperAdmin || isPro;

  return {
    user,
    roles,
    isAdmin,
    isSuperAdmin,
    isPro,
    isPremium,
    isLoading,
    rolesFetched,
    error,
    refetch: fetchRoles,
  };
};
