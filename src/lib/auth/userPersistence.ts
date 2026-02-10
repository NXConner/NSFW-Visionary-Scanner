/**
 * User Persistence Layer
 * Ensures user session and auth state persists across browser sessions.
 * Works in conjunction with Supabase's built-in session persistence.
 */

import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

// ============================================
// Storage Keys
// ============================================

const STORAGE_KEYS = {
  LAST_USER_ID: "lovable_last_user_id",
  USER_EMAIL: "lovable_user_email",
  SESSION_EXPIRY: "lovable_session_expiry",
  REMEMBER_ME: "lovable_remember_me",
  USER_PREFERENCES: "lovable_user_preferences",
  AUTH_STATE: "lovable_auth_state",
} as const;

// ============================================
// Types
// ============================================

export interface PersistedUserData {
  userId: string;
  email: string | null;
  lastLoginAt: string;
  rememberMe: boolean;
}

export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  language?: string;
  notifications?: boolean;
  nsfwEnabled?: boolean;
  lastActiveTab?: string;
}

// ============================================
// Storage Helpers
// ============================================

function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage may not be available
  }
}

function safeLocalStorageRemove(key: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  } catch {
    // localStorage may not be available
  }
}

function safeSessionStorageGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSessionStorageSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, value);
  } catch {
    // sessionStorage may not be available
  }
}

// ============================================
// User Persistence Functions
// ============================================

/**
 * Persist user data after successful login
 */
export function persistUserData(
  user: User,
  rememberMe: boolean = true
): void {
  const data: PersistedUserData = {
    userId: user.id,
    email: user.email || null,
    lastLoginAt: new Date().toISOString(),
    rememberMe,
  };
  
  if (rememberMe) {
    // Use localStorage for persistent storage
    safeLocalStorageSet(STORAGE_KEYS.LAST_USER_ID, user.id);
    safeLocalStorageSet(STORAGE_KEYS.USER_EMAIL, user.email || "");
    safeLocalStorageSet(STORAGE_KEYS.REMEMBER_ME, "true");
    safeLocalStorageSet(STORAGE_KEYS.AUTH_STATE, JSON.stringify(data));
  } else {
    // Use sessionStorage for session-only storage
    safeSessionStorageSet(STORAGE_KEYS.LAST_USER_ID, user.id);
    safeSessionStorageSet(STORAGE_KEYS.USER_EMAIL, user.email || "");
    safeLocalStorageSet(STORAGE_KEYS.REMEMBER_ME, "false");
  }
  
  logger.info("[userPersistence] User data persisted", { userId: user.id, rememberMe });
}

/**
 * Get persisted user data
 */
export function getPersistedUserData(): PersistedUserData | null {
  // First check localStorage (remember me)
  const localUserId = safeLocalStorageGet(STORAGE_KEYS.LAST_USER_ID);
  const rememberMe = safeLocalStorageGet(STORAGE_KEYS.REMEMBER_ME) === "true";
  
  if (localUserId && rememberMe) {
    const authStateStr = safeLocalStorageGet(STORAGE_KEYS.AUTH_STATE);
    if (authStateStr) {
      try {
        return JSON.parse(authStateStr);
      } catch {
        // Fall back to basic data
      }
    }
    
    return {
      userId: localUserId,
      email: safeLocalStorageGet(STORAGE_KEYS.USER_EMAIL),
      lastLoginAt: new Date().toISOString(),
      rememberMe: true,
    };
  }
  
  // Check sessionStorage
  const sessionUserId = safeSessionStorageGet(STORAGE_KEYS.LAST_USER_ID);
  if (sessionUserId) {
    return {
      userId: sessionUserId,
      email: safeSessionStorageGet(STORAGE_KEYS.USER_EMAIL),
      lastLoginAt: new Date().toISOString(),
      rememberMe: false,
    };
  }
  
  return null;
}

/**
 * Get the last user ID for cache lookups
 */
export function getLastUserId(): string | null {
  return safeLocalStorageGet(STORAGE_KEYS.LAST_USER_ID) ||
         safeSessionStorageGet(STORAGE_KEYS.LAST_USER_ID);
}

/**
 * Check if "Remember Me" was selected
 */
export function wasRememberMeSelected(): boolean {
  return safeLocalStorageGet(STORAGE_KEYS.REMEMBER_ME) === "true";
}

/**
 * Clear persisted user data (on logout)
 */
export function clearPersistedUserData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    safeLocalStorageRemove(key);
  });
  
  // Also clear sessionStorage
  try {
    if (typeof window !== "undefined") {
      Object.values(STORAGE_KEYS).forEach(key => {
        window.sessionStorage.removeItem(key);
      });
    }
  } catch {
    // sessionStorage may not be available
  }
  
  logger.info("[userPersistence] User data cleared");
}

/**
 * Save user preferences
 */
export function saveUserPreferences(prefs: Partial<UserPreferences>): void {
  const existing = getUserPreferences();
  const updated = { ...existing, ...prefs };
  safeLocalStorageSet(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
}

/**
 * Get user preferences
 */
export function getUserPreferences(): UserPreferences {
  const stored = safeLocalStorageGet(STORAGE_KEYS.USER_PREFERENCES);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Restore session from persistence
 * Returns the session if it can be restored, null otherwise
 */
export async function restoreSession(): Promise<Session | null> {
  try {
    // Try to get existing session from Supabase
    const { data: { session }, error } = await Promise.race([
      supabase.auth.getSession(),
      new Promise<{ data: { session: null }, error: null }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null }, error: null }), 2000)
      ),
    ]);
    
    if (error) {
      logger.warn("[userPersistence] Failed to restore session", { error: error.message });
      return null;
    }
    
    if (session?.user) {
      // Re-persist the data to refresh timestamps
      persistUserData(session.user, wasRememberMeSelected());
      return session;
    }
    
    return null;
  } catch (err) {
    logger.error("[userPersistence] Error restoring session", err);
    return null;
  }
}

/**
 * Check if there's a potentially valid persisted session
 */
export function hasPotentialSession(): boolean {
  const userData = getPersistedUserData();
  return userData !== null;
}

/**
 * Initialize persistence listeners
 * Call this once on app startup
 */
export function initializePersistenceListeners(): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      switch (event) {
        case "SIGNED_IN":
          if (session?.user) {
            persistUserData(session.user, wasRememberMeSelected());
          }
          break;
        case "SIGNED_OUT":
          clearPersistedUserData();
          break;
        case "TOKEN_REFRESHED":
          if (session?.user) {
            // Update persisted data with fresh timestamps
            persistUserData(session.user, wasRememberMeSelected());
          }
          break;
      }
    }
  );
  
  return () => subscription.unsubscribe();
}

// ============================================
// Exports
// ============================================

export const userPersistence = {
  persistUserData,
  getPersistedUserData,
  getLastUserId,
  wasRememberMeSelected,
  clearPersistedUserData,
  saveUserPreferences,
  getUserPreferences,
  restoreSession,
  hasPotentialSession,
  initializePersistenceListeners,
};

export default userPersistence;
