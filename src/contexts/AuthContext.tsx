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
import { checkSuperAdminRole, clearSuperAdminCache, isSuperAdminCached } from "@/lib/superAdmin";
import { 
  persistUserData, 
  clearPersistedUserData, 
  wasRememberMeSelected,
  getLastUserId,
} from "@/lib/auth/userPersistence";
import { EmailService } from "@/lib/email";
import { isEmailPreVerified } from "@/lib/email/emailConfig";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  rolesLoading: boolean; // Separate loading state for super admin role check
  // Email Verification
  isEmailVerified: boolean;
  // Super Admin Properties (database-driven)
  isSuperAdmin: boolean;
  role: "super_admin" | "user";
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

// CRITICAL: Module-level cached super admin check - runs ONCE at import time
// This ensures privileged status is known BEFORE any component renders
function getInitialSuperAdminStatus(): boolean {
  try {
    const storedUserId = localStorage.getItem("lovable_last_user_id");
    if (storedUserId) {
      return isSuperAdminCached(storedUserId);
    }
  } catch {
    // localStorage may not be available
  }
  return false;
}

// This value is computed ONCE when the module loads - guaranteed before first render
const INITIAL_SUPER_ADMIN_STATUS = getInitialSuperAdminStatus();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // SUPER ADMIN EARLY UNLOCK: Use module-level cached value as initial state
  // This ensures isSuperAdmin is TRUE from the very first render for returning super admins
  const [isSuperAdmin, setIsSuperAdmin] = useState(INITIAL_SUPER_ADMIN_STATUS);
  const [rolesLoading, setRolesLoading] = useState(!INITIAL_SUPER_ADMIN_STATUS); // Skip loading if already known

  // Load super admin status from database with 2s timeout fallback
  const loadSuperAdminStatus = useCallback(async (userId: string | null) => {
    setRolesLoading(true);
    if (!userId) {
      setIsSuperAdmin(false);
      clearSuperAdminCache();
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
      const isSuper = await Promise.race([
        checkSuperAdminRole(userId),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(isSuperAdminCached(userId)), 2000)),
      ]);
      setIsSuperAdmin(isSuper);
    } catch (err) {
      console.error("[auth] Failed to check super admin status:", err);
      // On error, use cached value if available
      setIsSuperAdmin(isSuperAdminCached(userId));
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
      
      // Load super admin status from database
      loadSuperAdminStatus(session?.user?.id ?? null);

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
        }
        if (event === "TOKEN_REFRESHED" && session?.user) {
          // Update persisted data with fresh session
          persistUserData(session.user, wasRememberMeSelected());
        }
      } catch {
        // ignore analytics errors
      }
    });

    // Check for existing session with 1s timeout
    const checkSession = async () => {
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>(resolve =>
            setTimeout(() => resolve({ data: { session: null } }), 1000),
          ),
        ]);

        if (!mounted) return;
        setSession(result.data.session);
        setUser(result.data.session?.user ?? null);
        
        // Load super admin status from database
        await loadSuperAdminStatus(result.data.session?.user?.id ?? null);
      } catch {
        // Ignore errors - fallback will handle
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
  }, [loadSuperAdminStatus]);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      // Extended session duration when "Remember me" is checked (30 days vs 1 hour)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
    const redirectUrl = `${window.location.origin}/auth?verified=true`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
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

  // Compute super admin properties based on database-driven role check
  const superAdminProps = useMemo(() => ({
    isSuperAdmin,
    role: isSuperAdmin ? "super_admin" : "user",
    subscription: isSuperAdmin ? "tier3_premium_lifetime" : "free",
    subscriptionStatus: isSuperAdmin ? "active" : "inactive",
    allFeaturesUnlocked: isSuperAdmin,
    badge: isSuperAdmin ? "Super Admin" : null,
    hasFullAccess: isSuperAdmin,
  }), [isSuperAdmin]);

  const contextValue = useMemo(
    () => ({
      user,
      session,
      loading,
      rolesLoading,
      // Email Verification
      isEmailVerified,
      // Super Admin Properties (database-driven)
      isSuperAdmin: superAdminProps.isSuperAdmin,
      role: superAdminProps.role as "super_admin" | "user",
      subscription: superAdminProps.subscription,
      subscriptionStatus: superAdminProps.subscriptionStatus,
      allFeaturesUnlocked: superAdminProps.allFeaturesUnlocked,
      badge: superAdminProps.badge,
      hasFullAccess: superAdminProps.hasFullAccess,
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
      superAdminProps,
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
