import { useMemo, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getSubscriptionStatus } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { useDLCFeature } from "@/dlc/context/DLCContext";
import { useBetaAccess } from "@/lib/betaAccess";
import { useUserRoles } from "@/hooks/useUserRoles";
import { isAnySuperAdminPersisted } from "@/lib/superAdmin";

export type SubscriptionTier = "free" | "pro" | "premium" | "admin";

export interface FeatureAccess {
  // Scanner features
  unlimitedScans: boolean;
  aiScanAnalysis: boolean;
  advancedCalibration: boolean;

  // Health features
  aiHealthChatbot: boolean;
  predictiveAnalytics: boolean;
  medicalExport: boolean;

  // Content features
  positionsGallery: boolean;
  peProgressPhotos: boolean;
  customRoutines: boolean;

  // Data features
  cloudBackup: boolean;
  advancedAnalytics: boolean;
  dataExport: boolean;

  // Support features
  prioritySupport: boolean;
  customWorkouts: boolean;

  // Limits
  scanLimit: number;
  aiQueriesLimit: number;
}

const UI_FEATURE_TOGGLES_STORAGE_KEY = "morphoscan_ui_feature_toggles_v1";
const UI_FEATURE_TOGGLE_DEFAULTS: Record<string, boolean> = {
  // Scanner
  unlimitedScans: true,
  aiScanAnalysis: true,
  advancedCalibration: true,
  // Health
  aiHealthChatbot: true,
  predictiveAnalytics: true,
  medicalExport: true,
  // Content
  positionsGallery: true,
  peProgressPhotos: true,
  customRoutines: true,
  pelvicFloorHub: true,
  // Data
  cloudBackup: true,
  advancedAnalytics: true,
  dataExport: true,
  // Support
  prioritySupport: true,
  customWorkouts: true,
};

const FREE_FEATURES: FeatureAccess = {
  unlimitedScans: false,
  aiScanAnalysis: false,
  advancedCalibration: false,
  aiHealthChatbot: false,
  predictiveAnalytics: false,
  medicalExport: false,
  positionsGallery: false,
  peProgressPhotos: false,
  customRoutines: false,
  cloudBackup: false,
  advancedAnalytics: false,
  dataExport: true, // Basic JSON export
  prioritySupport: false,
  customWorkouts: false,
  scanLimit: 10,
  aiQueriesLimit: 0,
};

const PRO_FEATURES: FeatureAccess = {
  ...FREE_FEATURES,
  unlimitedScans: false,
  positionsGallery: true,
  peProgressPhotos: true,
  customRoutines: true,
  cloudBackup: true,
  advancedAnalytics: true,
  scanLimit: 100,
  aiQueriesLimit: 50,
};

const PREMIUM_FEATURES: FeatureAccess = {
  unlimitedScans: true,
  aiScanAnalysis: true,
  advancedCalibration: true,
  aiHealthChatbot: true,
  predictiveAnalytics: true,
  medicalExport: true,
  positionsGallery: true,
  peProgressPhotos: true,
  customRoutines: true,
  cloudBackup: true,
  advancedAnalytics: true,
  dataExport: true,
  prioritySupport: true,
  customWorkouts: true,
  scanLimit: -1, // Unlimited
  aiQueriesLimit: -1, // Unlimited
};

// CRITICAL: Module-level cached super admin check - runs ONCE at import time
// This ensures privileged status is known BEFORE any component renders
// NO DEPENDENCY ON USER ID - directly checks if any super admin is persisted
const INITIAL_PRIVILEGED_STATUS = isAnySuperAdminPersisted();

export const useFeatureAccess = () => {
  const { user, isSuperAdmin, hasFullAccess, allFeaturesUnlocked, rolesLoading } = useAuth();
  const { isAvailable: dlcPositionsAvailable } = useDLCFeature("positions_gallery");
  const { isAvailable: dlcPeRoutinesAvailable } = useDLCFeature("pe_routines");
  const { status: betaStatus, loading: betaLoading } = useBetaAccess(user?.id);
  const { isAdmin, isSuperAdmin: isSuperAdminRole, isLoading: rolesHookLoading } = useUserRoles();

  // SUPER ADMIN EARLY UNLOCK: Use module-level cached value + context values
  // The module-level value is available on the VERY FIRST render, before any context resolves
  const isPrivileged =
    INITIAL_PRIVILEGED_STATUS ||
    isSuperAdmin ||
    hasFullAccess ||
    allFeaturesUnlocked ||
    isAdmin ||
    isSuperAdminRole;

  // Start with PREMIUM_FEATURES for privileged users to prevent locked flash
  const [tier, setTier] = useState<SubscriptionTier>(
    INITIAL_PRIVILEGED_STATUS || isPrivileged ? "premium" : "free",
  );
  const [features, setFeatures] = useState<FeatureAccess>(
    INITIAL_PRIVILEGED_STATUS || isPrivileged ? PREMIUM_FEATURES : FREE_FEATURES,
  );
  const [loading, setLoading] = useState(!INITIAL_PRIVILEGED_STATUS && !isPrivileged); // Privileged users don't need to wait

  // Aggressive timeout to prevent UI blocking on slow network
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setTimedOut(true), 2000);
    return () => clearTimeout(timeout);
  }, []);

  // CRITICAL: Immediately upgrade to premium when privileged status becomes true
  // This handles the case where role check completes after initial render
  useEffect(() => {
    if (isPrivileged) {
      setTier("premium");
      setFeatures(PREMIUM_FEATURES);
      setLoading(false);
    }
  }, [isPrivileged]);

  const loadUserTier = useCallback(async () => {
    if (!user) return;

    try {
      let resolvedTier: SubscriptionTier = "free";
      let resolvedFeatures: FeatureAccess = FREE_FEATURES;

      // Super admin override (email-based, via AuthContext): always full access.
      // We treat tier as "premium" for UX (avoids upsell gating), while admin UI uses role flags.
      if (isSuperAdmin || hasFullAccess || allFeaturesUnlocked) {
        resolvedTier = "premium";
        resolvedFeatures = PREMIUM_FEATURES;
        setTier(resolvedTier);
        setFeatures(resolvedFeatures);
        setLoading(false);
        return;
      }

      // Role-based override (admin/super_admin => full access)
      // NOTE: this must be DB-backed (not localStorage) to be reliable.
      if (isAdmin || isSuperAdminRole) {
        // Treat privileged roles as Premium for UX consistency (no upsells / full access).
        resolvedTier = "premium";
        resolvedFeatures = PREMIUM_FEATURES;
        setTier(resolvedTier);
        setFeatures(resolvedFeatures);
        setLoading(false);
        return;
      }

      // Beta allowlist: treat as premium (payments disabled for beta).
      if (betaStatus.active) {
        resolvedTier = "premium";
        resolvedFeatures = PREMIUM_FEATURES;
        setTier(resolvedTier);
        setFeatures(resolvedFeatures);
        setLoading(false);
        return;
      }

      // Check subscription status
      const subscription = await getSubscriptionStatus(user.id);

      if (!subscription || subscription.status !== "active") {
        resolvedTier = "free";
        resolvedFeatures = FREE_FEATURES;
        setTier(resolvedTier);
        setFeatures(resolvedFeatures);
      } else {
        // Determine tier based on explicit tier field, env price IDs, or fallback heuristics
        const explicitTier = (subscription.subscription_tier ||
          subscription.plan_id) as SubscriptionTier | null;
        if (explicitTier === "premium") {
          resolvedTier = "premium";
          resolvedFeatures = PREMIUM_FEATURES;
          setTier(resolvedTier);
          setFeatures(resolvedFeatures);
        } else if (explicitTier === "pro") {
          resolvedTier = "pro";
          resolvedFeatures = PRO_FEATURES;
          setTier(resolvedTier);
          setFeatures(resolvedFeatures);
        } else {
          const priceId = subscription.stripe_price_id || "";
          const proPriceId = import.meta.env.VITE_STRIPE_PRO_PRICE_ID || "";
          const premiumPriceId = import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID || "";

          if (premiumPriceId && priceId === premiumPriceId) {
            resolvedTier = "premium";
            resolvedFeatures = PREMIUM_FEATURES;
            setTier(resolvedTier);
            setFeatures(resolvedFeatures);
          } else if (proPriceId && priceId === proPriceId) {
            resolvedTier = "pro";
            resolvedFeatures = PRO_FEATURES;
            setTier(resolvedTier);
            setFeatures(resolvedFeatures);
          } else if (priceId.includes("premium")) {
            resolvedTier = "premium";
            resolvedFeatures = PREMIUM_FEATURES;
            setTier(resolvedTier);
            setFeatures(resolvedFeatures);
          } else if (priceId.includes("pro")) {
            resolvedTier = "pro";
            resolvedFeatures = PRO_FEATURES;
            setTier(resolvedTier);
            setFeatures(resolvedFeatures);
          } else {
            resolvedTier = "free";
            resolvedFeatures = FREE_FEATURES;
            setTier(resolvedTier);
            setFeatures(resolvedFeatures);
          }
        }
      }

      logger.info("User tier determined", {
        userId: user.id,
        tier: resolvedTier,
        hasSubscription: !!subscription,
      });
    } catch (error) {
      logger.error("Failed to load user tier", { userId: user.id, error });
      // Default to free tier on error
      setTier("free");
      setFeatures(FREE_FEATURES);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    betaStatus.active,
    isAdmin,
    isSuperAdminRole,
    isSuperAdmin,
    hasFullAccess,
    allFeaturesUnlocked,
  ]);

  useEffect(() => {
    if (user) {
      void loadUserTier();
    } else {
      setTier("free");
      setFeatures(FREE_FEATURES);
      setLoading(false);
    }
  }, [loadUserTier, user]);

  // Merge DLC entitlements into subscription feature access (single source of truth for UI gating)
  const effectiveFeatures = useMemo<FeatureAccess>(() => {
    // Positions gallery is delivered via DLC in hybrid builds; allow either subscription OR DLC.
    const positionsGallery = Boolean(features.positionsGallery || dlcPositionsAvailable);
    // PE routines can be delivered via DLC; allow either subscription OR DLC.
    const customRoutines = Boolean(features.customRoutines || dlcPeRoutinesAvailable);
    return { ...features, positionsGallery, customRoutines };
  }, [features, dlcPositionsAvailable, dlcPeRoutinesAvailable]);

  const hasFeature = (feature: keyof FeatureAccess): boolean => {
    // SUPER ADMIN BYPASS: Always grant access for privileged users regardless of loading state.
    // CRITICAL: Check localStorage SYNCHRONOUSLY every time - hooks may not have resolved yet
    if (isAnySuperAdminPersisted()) return true;
    if (isPrivileged) return true;
    if (loading) return false;
    return effectiveFeatures[feature] as boolean;
  };

  const getLimit = (limitType: "scanLimit" | "aiQueriesLimit"): number => {
    if (loading) return 0;
    return effectiveFeatures[limitType] as number;
  };

  const canUseFeature = (feature: keyof FeatureAccess, currentUsage?: number): boolean => {
    // SUPER ADMIN BYPASS: Always grant access for privileged users regardless of loading state.
    // CRITICAL: Check localStorage SYNCHRONOUSLY every time - hooks may not have resolved yet
    if (isAnySuperAdminPersisted()) return true;
    if (isPrivileged) return true;
    if (loading) return false;

    const hasAccess = effectiveFeatures[feature] as boolean;
    if (!hasAccess) return false;

    // Check usage limits
    if (feature === "unlimitedScans" && currentUsage !== undefined) {
      const limit = effectiveFeatures.scanLimit;
      if (limit > 0 && currentUsage >= limit) return false;
    }

    if (feature === "aiHealthChatbot" && currentUsage !== undefined) {
      const limit = effectiveFeatures.aiQueriesLimit;
      if (limit > 0 && currentUsage >= limit) return false;
    }

    return true;
  };

  // Use timedOut to prevent infinite loading - after 2s, proceed with whatever state we have
  const effectiveLoading = timedOut
    ? false
    : loading || betaLoading || (rolesLoading && rolesHookLoading);

  return {
    tier,
    features: effectiveFeatures,
    loading: effectiveLoading,
    hasFeature,
    getLimit,
    canUseFeature,
    refreshTier: loadUserTier,
    betaAccess: betaStatus,
  };
};

// Feature toggles hook (for UI feature flags)
export const useFeatureToggles = () => {
  const { user, isSuperAdmin, hasFullAccess, allFeaturesUnlocked } = useAuth();
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => ({
    ...UI_FEATURE_TOGGLE_DEFAULTS,
  }));

  const readStored = useCallback((): Record<string, boolean> => {
    try {
      if (typeof window === "undefined") return {};
      const raw = window.localStorage.getItem(UI_FEATURE_TOGGLES_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object") return {};
      const result: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === "boolean") result[k] = v;
      }
      return result;
    } catch {
      return {};
    }
  }, []);

  const writeStored = useCallback((next: Record<string, boolean>) => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(UI_FEATURE_TOGGLES_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("ui-feature-toggles-changed"));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const stored = readStored();
    const merged = { ...UI_FEATURE_TOGGLE_DEFAULTS, ...stored };

    // Super admin always sees everything enabled (UI toggles are only for hiding features).
    if (isSuperAdmin || hasFullAccess || allFeaturesUnlocked) {
      setToggles(UI_FEATURE_TOGGLE_DEFAULTS);
      return;
    }

    setToggles(merged);
  }, [allFeaturesUnlocked, hasFullAccess, isSuperAdmin, readStored, user?.id]);

  const toggleFeature = (feature: string, value?: boolean) => {
    setToggles(prev => {
      const next = {
        ...UI_FEATURE_TOGGLE_DEFAULTS,
        ...prev,
        [feature]: value !== undefined ? value : !(prev[feature] ?? false),
      };
      // Keep super admin always-on.
      if (isSuperAdmin || hasFullAccess || allFeaturesUnlocked) return UI_FEATURE_TOGGLE_DEFAULTS;
      writeStored(next);
      return next;
    });
  };

  return { toggles, toggleFeature };
};

// Subscription hook
export const useSubscription = () => {
  const { tier, refreshTier } = useFeatureAccess();
  const [localTier, setLocalTier] = useState<SubscriptionTier>(tier);

  useEffect(() => {
    setLocalTier(tier);
  }, [tier]);

  const setTier = (newTier: SubscriptionTier) => {
    // UI should not allow manual tier switching; keep for backward-compat but no-op.
    setLocalTier(tier);
    refreshTier();
  };

  return { tier: localTier, setTier };
};

// Get badge color for tier
export const getTierBadgeColor = (tier: SubscriptionTier): string => {
  switch (tier) {
    case "free":
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    case "pro":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "premium":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "admin":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};
