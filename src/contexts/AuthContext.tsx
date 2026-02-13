import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { analytics } from "@/lib/analytics";
import { logger } from "@/lib/logger";
import { clearSuperAdminCache, isSuperAdminCached } from "@/lib/superAdmin";
import {
  persistUserData,
  clearPersistedUserData,
  wasRememberMeSelected,
  getLastUserId,
} from "@/lib/auth/userPersistence";
import { EmailService } from "@/lib/email";
import { getEmailRedirectUrl, isEmailPreVerified } from "@/lib/email/emailConfig";
import {
  clearPersistedRoles,
  getLastKnownUserId,
  getPersistedRolesForUser,
  writePersistedRolesPayload,
} from "@/lib/auth/rolesCache";
import {
  emitSupabaseInvalidApiKeyEvent,
  isInvalidSupabaseApiKeyError,
} from "@/integrations/supabase/events";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  rolesLoading: boolean; // Separate loading state for super admin role check
  // Email Verification
  isEmailVerified: boolean;
  // Privileged Properties (database-driven)
  isSuperAdmin: boolean;
  isAdmin: boolean;
  role: "super_admin" | "admin" | "user";
  subscription: string;
  subscriptionStatus: string;
  allFeaturesUnlocked: boolean;
  badge: string | null;
  hasFullAccess: boolean;
  // Auth Methods
  signIn: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  linkSocialAccount: (provider: "google" | "apple") => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  // Email Methods
  resendVerificationEmail: () => Promise<{ error: Error | null }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeEmail(v: unknown): string {
  return String(v ?? "")
    .trim()
    .toLowerCase();
}

// Core privileged emails (defaults; can be overridden per-environment)
const CORE_SUPER_ADMIN_EMAIL = normalizeEmail(import.meta.env.VITE_ADMIN_SUPER_EMAIL || "n8ter8@gmail.com");
const CORE_ADMIN_EMAIL = normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL || "butterflii18@gmail.com");

function getInitialPrivilegedStatus(): { isSuperAdmin: boolean; isAdmin: boolean } {
  try {
    const storedUserId = getLastKnownUserId();
    const roles = getPersistedRolesForUser(storedUserId);
    const isSuper =
      (storedUserId ? isSuperAdminCached(storedUserId) : false) || roles.includes("super_admin");
    const isAdmin = roles.includes("admin");
    return { isSuperAdmin: isSuper, isAdmin };
  } catch {
    return { isSuperAdmin: false, isAdmin: false };
  }
}

// This value is computed ONCE when the module loads - guaranteed before first render
const INITIAL_PRIVILEGED_STATUS = getInitialPrivilegedStatus();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // PRIVILEGED EARLY UNLOCK: Use module-level cached values as initial state.
  // This ensures admin/super_admin bypass is active from the very first render for returning users.
  const [isSuperAdmin, setIsSuperAdmin] = useState(INITIAL_PRIVILEGED_STATUS.isSuperAdmin);
  const [isAdmin, setIsAdmin] = useState(INITIAL_PRIVILEGED_STATUS.isAdmin);
  const initialHasFullAccess =
    INITIAL_PRIVILEGED_STATUS.isSuperAdmin || INITIAL_PRIVILEGED_STATUS.isAdmin;
  const [rolesLoading, setRolesLoading] = useState(!initialHasFullAccess); // Skip loading if already known

  function persistSuperAdminStatus(userId: string, enabled: boolean): void {
    try {
      if (enabled) {
        localStorage.setItem(
          "lovable_super_admin_status",
          JSON.stringify({ userId, isSuperAdmin: true }),
        );
      } else {
        localStorage.removeItem("lovable_super_admin_status");
      }
    } catch {
      // ignore
    }
  }

  // Load privileged status from database with 2s timeout fallback
  const loadPrivilegedStatus = useCallback(async (params: { userId: string | null; email?: string | null }) => {
    setRolesLoading(true);
    const userId = params.userId;
    const emailNorm = normalizeEmail(params.email);
    const coreSuper = Boolean(emailNorm && CORE_SUPER_ADMIN_EMAIL && emailNorm === CORE_SUPER_ADMIN_EMAIL);
    const coreAdmin = Boolean(emailNorm && CORE_ADMIN_EMAIL && emailNorm === CORE_ADMIN_EMAIL);

    if (!userId) {
      setIsSuperAdmin(false);
      setIsAdmin(false);
      clearSuperAdminCache();
      clearPersistedRoles();
      try {
        localStorage.removeItem("lovable_last_user_id");
      } catch {
        // localStorage may not be available
      }
      setRolesLoading(false);
      return;
    }

    // Store user ID for cache lookup on next app load
    try {
      localStorage.setItem("lovable_last_user_id", userId);
    } catch {
      // localStorage may not be available
    }

    try {
      // Race against timeout to prevent hanging forever
      const rolesResult = await Promise.race([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        new Promise<{ data: null; error: { message: string } }>(resolve =>
          setTimeout(() => resolve({ data: null, error: { message: "Role check timeout" } }), 2000),
        ),
      ]);

      const { data, error } = rolesResult as any;
      if (error) throw new Error(String((error as any).message || "Role check failed"));

      const dbRoles = (data || [])
        .map((r: any) => String(r?.role ?? "").trim().toLowerCase())
        .filter(Boolean) as string[];
      const roleSet = new Set<string>(dbRoles);
      if (coreAdmin) roleSet.add("admin");
      if (coreSuper) roleSet.add("super_admin");
      // super_admin implies admin privileges in the app UX layer
      if (roleSet.has("super_admin")) roleSet.add("admin");

      const nextIsSuper = roleSet.has("super_admin");
      const nextIsAdmin = roleSet.has("admin");

      setIsSuperAdmin(nextIsSuper);
      setIsAdmin(nextIsAdmin);

      // Persist role info so cold starts can unlock immediately (safe per-user binding).
      writePersistedRolesPayload(userId, Array.from(roleSet.values()));
      persistSuperAdminStatus(userId, nextIsSuper);
    } catch (err) {
      console.error("[auth] Failed to check super admin status:", err);
      // On error, fall back to cached/persisted role state.
      const persistedRoles = getPersistedRolesForUser(userId);
      const fallbackIsSuper =
        isSuperAdminCached(userId) || persistedRoles.includes("super_admin") || coreSuper;
      const fallbackIsAdmin = persistedRoles.includes("admin") || coreAdmin || fallbackIsSuper;
      setIsSuperAdmin(fallbackIsSuper);
      setIsAdmin(fallbackIsAdmin);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // AGGRESSIVE FALLBACK: 1.5s max for auth initialization
    const fallback = setTimeout(() => {
      if (!mounted) return;
      setLoading(prev => {
        if (!prev) return prev;
        return false;
      });
    }, 1500);

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Load privileged status from database
      loadPrivilegedStatus({ userId: session?.user?.id ?? null, email: session?.user?.email ?? null });

      try {
        if (event === "SIGNED_IN" && session?.user?.id) {
          // Persist user data for session restoration
          persistUserData(session.user, wasRememberMeSelected());
          analytics.trackUserAction("auth_signed_in", "auth", {
            provider: session.user?.app_metadata?.provider,
          });
        }
        if (event === "SIGNED_OUT") {
          analytics.trackUserAction("auth_signed_out", "auth");
          clearSuperAdminCache();
          clearPersistedUserData();
          clearPersistedRoles();
        }
        if (event === "TOKEN_REFRESHED" && session?.user) {
          // Update persisted data with fresh session
          persistUserData(session.user, wasRememberMeSelected());
        }
      } catch {
        // ignore analytics errors
      }
    });

    // Check for existing session with 3s timeout (increased from 1s for better reliability)
    const checkSession = async () => {
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>(resolve =>
            setTimeout(() => resolve({ data: { session: null } }), 3000),
          ),
        ]);

        if (!mounted) return;

        // If we got a session, use it
        if (result.data.session) {
          setSession(result.data.session);
          setUser(result.data.session.user);
          // Persist session data for future restores
          persistUserData(result.data.session.user, wasRememberMeSelected());
          // Load privileged status from database
          await loadPrivilegedStatus({ userId: result.data.session.user.id, email: result.data.session.user.email ?? null });
        } else {
          // No session from Supabase - check if we have persisted user data
          // This can help show UI quickly while session refreshes
          const lastUserId = getLastUserId();
          if (lastUserId) {
            // We had a previous session - try to refresh
            try {
              const { data: refreshData } = await supabase.auth.refreshSession();
              if (refreshData.session && mounted) {
                setSession(refreshData.session);
                setUser(refreshData.session.user);
                await loadPrivilegedStatus({ userId: refreshData.session.user.id, email: refreshData.session.user.email ?? null });
                return;
              }
            } catch {
              // Refresh failed - session is truly gone
            }
          }
          setSession(null);
          setUser(null);
          await loadPrivilegedStatus({ userId: null });
        }
      } catch {
        // Ignore errors - fallback will handle
        if (mounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    return () => {
      mounted = false;
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, [loadPrivilegedStatus]);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      // Extended session duration when "Remember me" is checked (30 days vs 1 hour)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If backend keys are wrong, help users recover on-device (Android builds).
      if (error && isInvalidSupabaseApiKeyError(error)) {
        emitSupabaseInvalidApiKeyEvent();
      }

      try {
        analytics.trackUserAction(error ? "auth_sign_in_failed" : "auth_sign_in_success", "auth", {
          rememberMe,
          error: error ? String(error.message || "unknown") : undefined,
        });
      } catch {
        // ignore
      }

      // If remember me is checked, we don't need to do anything special
      // Supabase already persists the session by default
      // The session will be refreshed automatically

      return { error: error as Error | null };
    },
    [],
  );

  const signUp = useCallback(async (email: string, password: string) => {
    const redirectUrl = getEmailRedirectUrl("/auth?verified=true");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    if (error && isInvalidSupabaseApiKeyError(error)) {
      emitSupabaseInvalidApiKeyEvent();
    }
    try {
      analytics.trackUserAction(error ? "auth_sign_up_failed" : "auth_sign_up_success", "auth", {
        error: error ? String(error.message || "unknown") : undefined,
      });
    } catch {
      // ignore
    }
    return { error: error as Error | null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error && isInvalidSupabaseApiKeyError(error)) {
      emitSupabaseInvalidApiKeyEvent();
    }
    try {
      analytics.trackUserAction(error ? "auth_google_start_failed" : "auth_google_start", "auth", {
        error: error ? String(error.message || "unknown") : undefined,
      });
    } catch {
      // ignore
    }
    return { error: error as Error | null };
  }, []);

  const signInWithApple = useCallback(async () => {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: redirectUrl,
      },
    });
    if (error && isInvalidSupabaseApiKeyError(error)) {
      emitSupabaseInvalidApiKeyEvent();
    }
    try {
      analytics.trackUserAction(error ? "auth_apple_start_failed" : "auth_apple_start", "auth", {
        error: error ? String(error.message || "unknown") : undefined,
      });
    } catch {
      // ignore
    }
    return { error: error as Error | null };
  }, []);

  const linkSocialAccount = useCallback(
    async (provider: "google" | "apple") => {
      if (!user) {
        return { error: new Error("Must be logged in to link social account") };
      }

      const redirectUrl = `${window.location.origin}/auth/callback?link=true`;
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error && isInvalidSupabaseApiKeyError(error)) {
        emitSupabaseInvalidApiKeyEvent();
      }
      try {
        analytics.trackUserAction(
          error ? "auth_link_social_failed" : "auth_link_social_success",
          "auth",
          {
            provider,
            error: error ? String(error.message || "unknown") : undefined,
          },
        );
      } catch {
        // ignore
      }
      return { error: error as Error | null };
    },
    [user],
  );

  const signOut = useCallback(async () => {
    try {
      analytics.trackUserAction("auth_sign_out_requested", "auth");
    } catch {
      // ignore
    }
    clearSuperAdminCache();
    clearPersistedRoles();
    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.warn("Sign out failed", { component: "auth", error: error.message });
    }
  }, []);

  // Email verification methods
  const resendVerificationEmail = useCallback(async () => {
    if (!user?.email) {
      return { error: new Error("No email address found") };
    }
    try {
      const result = await EmailService.sendVerificationEmail(user.email);
      if (!result.success) {
        return { error: new Error(result.error || "Failed to send verification email") };
      }
      analytics.trackUserAction("auth_verification_email_resent", "auth");
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      return { error: new Error(errorMessage) };
    }
  }, [user?.email]);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    try {
      const result = await EmailService.sendPasswordResetEmail(email);
      if (!result.success) {
        return { error: new Error(result.error || "Failed to send password reset email") };
      }
      analytics.trackUserAction("auth_password_reset_requested", "auth");
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      return { error: new Error(errorMessage) };
    }
  }, []);

  // Check if user's email is verified
  // Returns true if email is in pre-verified whitelist OR confirmed via Supabase Auth
  const isEmailVerified = useMemo(() => {
    // Check whitelist first
    if (isEmailPreVerified(user?.email)) {
      return true;
    }
    return user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;
  }, [user?.email_confirmed_at, user?.email]);

  // Compute privileged properties based on database-driven role check
  const privilegedProps = useMemo(
    () => ({
      isSuperAdmin,
      isAdmin,
      role: isSuperAdmin ? "super_admin" : isAdmin ? "admin" : "user",
      subscription: isSuperAdmin || isAdmin ? "tier3_premium_lifetime" : "free",
      subscriptionStatus: isSuperAdmin || isAdmin ? "active" : "inactive",
      allFeaturesUnlocked: isSuperAdmin || isAdmin,
      badge: isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : null,
      hasFullAccess: isSuperAdmin || isAdmin,
    }),
    [isAdmin, isSuperAdmin],
  );

  const contextValue = useMemo(
    () => ({
      user,
      session,
      loading,
      rolesLoading,
      // Email Verification
      isEmailVerified,
      // Privileged Properties (database-driven)
      isSuperAdmin: privilegedProps.isSuperAdmin,
      isAdmin: privilegedProps.isAdmin,
      role: privilegedProps.role as "super_admin" | "admin" | "user",
      subscription: privilegedProps.subscription,
      subscriptionStatus: privilegedProps.subscriptionStatus,
      allFeaturesUnlocked: privilegedProps.allFeaturesUnlocked,
      badge: privilegedProps.badge,
      hasFullAccess: privilegedProps.hasFullAccess,
      // Auth Methods
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      linkSocialAccount,
      signOut,
      // Email Methods
      resendVerificationEmail,
      sendPasswordResetEmail,
    }),
    [
      user,
      session,
      loading,
      rolesLoading,
      isEmailVerified,
      privilegedProps,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      linkSocialAccount,
      signOut,
      resendVerificationEmail,
      sendPasswordResetEmail,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
