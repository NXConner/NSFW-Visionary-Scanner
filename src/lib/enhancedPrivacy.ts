/**
 * Enhanced Privacy Controls (Supabase-backed)
 *
 * Backed by:
 * - supabase/migrations/20251207000003_privacy_settings.sql
 */

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";

export interface PrivacySettings {
  app_lock_enabled: boolean;
  app_lock_method: "pin" | "biometric" | "both";
  content_lock_enabled: boolean;
  locked_content_ids: string[];
  hidden_mode_enabled: boolean;
  private_browsing_enabled: boolean;
  incognito_mode_enabled: boolean;
  data_anonymization_enabled: boolean;
  privacy_dashboard_enabled: boolean;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  app_lock_enabled: false,
  app_lock_method: "biometric",
  content_lock_enabled: false,
  locked_content_ids: [],
  hidden_mode_enabled: false,
  private_browsing_enabled: false,
  incognito_mode_enabled: false,
  data_anonymization_enabled: false,
  privacy_dashboard_enabled: true,
};

export async function getPrivacySettings(): Promise<PrivacySettings> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return DEFAULT_SETTINGS;

    const { data, error } = await fromExtended("user_privacy_settings")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) {
      logger.warn("getPrivacySettings failed", { error: error.message });
      return DEFAULT_SETTINGS;
    }

    if (!data) {
      // Create a row lazily (idempotent via unique user_id)

      const { error: insErr } = await fromExtended("user_privacy_settings").insert({
        user_id: auth.user.id,
        ...DEFAULT_SETTINGS,
      });
      if (insErr)
        logger.warn("getPrivacySettings insert failed (non-fatal)", { error: insErr.message });
      return DEFAULT_SETTINGS;
    }

    return {
      app_lock_enabled: Boolean(data.app_lock_enabled),
      app_lock_method: (data.app_lock_method as PrivacySettings["app_lock_method"]) ?? "biometric",
      content_lock_enabled: Boolean(data.content_lock_enabled),
      locked_content_ids: Array.isArray(data.locked_content_ids)
        ? data.locked_content_ids.map(String)
        : [],
      hidden_mode_enabled: Boolean(data.hidden_mode_enabled),
      private_browsing_enabled: Boolean(data.private_browsing_enabled),
      incognito_mode_enabled: Boolean(data.incognito_mode_enabled),
      data_anonymization_enabled: Boolean(data.data_anonymization_enabled),
      privacy_dashboard_enabled: Boolean(data.privacy_dashboard_enabled),
    } as PrivacySettings;
  } catch {
    // Ignore errors; fallback
  }
  return DEFAULT_SETTINGS;
}

export async function updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      toast.error("Please sign in");
      return false;
    }

    const current = await getPrivacySettings();
    const updated = { ...current, ...settings };

    const { error } = await fromExtended("user_privacy_settings")
      .upsert({ user_id: auth.user.id, ...updated }, { onConflict: "user_id" });

    if (error) {
      logger.error("updatePrivacySettings failed", { error: error.message });
      toast.error("Failed to update privacy settings");
      return false;
    }

    toast.success("Privacy settings updated");
    return true;
  } catch {
    toast.error("Failed to update privacy settings");
    return false;
  }
}

/**
 * Lock specific content
 */
export async function lockContent(contentId: string): Promise<boolean> {
  const settings = await getPrivacySettings();
  const lockedIds = [...(settings.locked_content_ids || []), contentId];
  return await updatePrivacySettings({ locked_content_ids: lockedIds });
}

/**
 * Unlock content
 */
export async function unlockContent(contentId: string): Promise<boolean> {
  const settings = await getPrivacySettings();
  const lockedIds = (settings.locked_content_ids || []).filter(id => id !== contentId);
  return await updatePrivacySettings({ locked_content_ids: lockedIds });
}

/**
 * Check if content is locked
 */
export async function isContentLocked(contentId: string): Promise<boolean> {
  const settings = await getPrivacySettings();
  return (settings.locked_content_ids || []).includes(contentId);
}

/**
 * Enable hidden mode
 */
export async function enableHiddenMode(): Promise<boolean> {
  return await updatePrivacySettings({ hidden_mode_enabled: true });
}

/**
 * Disable hidden mode
 */
export async function disableHiddenMode(): Promise<boolean> {
  return await updatePrivacySettings({ hidden_mode_enabled: false });
}

/**
 * Enable private browsing mode
 */
export async function enablePrivateBrowsing(): Promise<boolean> {
  return await updatePrivacySettings({ private_browsing_enabled: true });
}

/**
 * Enable incognito mode
 */
export async function enableIncognitoMode(): Promise<boolean> {
  return await updatePrivacySettings({ incognito_mode_enabled: true });
}

/**
 * Get privacy dashboard data
 */
export async function getPrivacyDashboardData(): Promise<{
  data_collected: Array<{ type: string; amount: number; last_accessed: string }>;
  third_party_sharing: Array<{ service: string; purpose: string; shared: boolean }>;
  data_retention: { policy: string; expiration: string | null };
  privacy_score: number;
}> {
  try {
    const settings = await getPrivacySettings();
    // Lightweight dashboard: show toggles + a simple score.
    const score =
      100 -
      (settings.data_anonymization_enabled ? 0 : 10) -
      (settings.private_browsing_enabled ? 0 : 10) -
      (settings.incognito_mode_enabled ? 0 : 10) -
      (settings.app_lock_enabled ? 0 : 10) -
      (settings.content_lock_enabled ? 0 : 10);

    return {
      data_collected: [
        { type: "measurements", amount: 1, last_accessed: new Date().toISOString() },
        { type: "sessions", amount: 1, last_accessed: new Date().toISOString() },
      ],
      third_party_sharing: [
        { service: "Stripe", purpose: "Billing", shared: true },
        { service: "Supabase", purpose: "Data storage & auth", shared: true },
      ],
      data_retention: { policy: "User-controlled", expiration: null },
      privacy_score: Math.max(0, Math.min(100, score)),
    };
  } catch {
    return {
      data_collected: [],
      third_party_sharing: [],
      data_retention: { policy: "User-controlled", expiration: null },
      privacy_score: 100,
    };
  }
}
