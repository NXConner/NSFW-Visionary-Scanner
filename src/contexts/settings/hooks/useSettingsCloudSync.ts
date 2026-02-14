import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import type { StoredSettings } from "../types";
import {
  buildCloudSettingsBlob,
  normalizeCloudStoredSettings,
  parseCloudSettingsBlob,
} from "../cloud/settingsBlob";

function isPostgrestMissingTable(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return msg.includes("42P01") || msg.toLowerCase().includes("does not exist");
}

function isPostgrestMissingColumn(error: unknown, column: string): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return (
    msg.includes("42703") ||
    (msg.toLowerCase().includes("column") &&
      msg.toLowerCase().includes("does not exist") &&
      msg.toLowerCase().includes(column.toLowerCase()))
  );
}

function rowToPartialSettings(row: any): Partial<StoredSettings> {
  return {
    theme: row?.theme ?? undefined,
    themePreset: row?.theme_preset ?? undefined,
    fontSize: row?.font_size ?? undefined,
    colorBlindMode: row?.color_blind_mode ?? undefined,
    hapticEnabled: typeof row?.haptic_enabled === "boolean" ? row.haptic_enabled : undefined,
    notificationsEnabled:
      typeof row?.notifications_enabled === "boolean" ? row.notifications_enabled : undefined,
    reminderTime: row?.reminder_time ?? undefined,
    reminderDays: Array.isArray(row?.reminder_days) ? row.reminder_days : undefined,
    // settings_blob (and any additional fields) are handled separately.
  };
}

export function useSettingsCloudSync(args: {
  userId: string | null | undefined;
  settings: StoredSettings;
  applySettingsFromCloud: (next: StoredSettings) => void;
}): {
  isSyncing: boolean;
  syncToCloud: () => Promise<void>;
} {
  const { userId, settings, applySettingsFromCloud } = args;

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Track if we've already loaded/bootstrapped cloud settings for this user to prevent
  // overwriting remote settings with local defaults on first render.
  const bootstrappedUserIdRef = useRef<string | null>(null);
  const lastSyncedHashRef = useRef<string>("");

  const cloudBlob = useMemo(() => buildCloudSettingsBlob(settings), [settings]);
  const cloudBlobHash = useMemo(() => JSON.stringify(cloudBlob), [cloudBlob]);

  const syncToCloud = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!userId) return;
      if (isSyncing) return;

      setIsSyncing(true);
      try {
        const payloadWithBlob = {
          user_id: userId,
          theme: settings.theme,
          theme_preset: settings.themePreset,
          font_size: settings.fontSize,
          color_blind_mode: settings.colorBlindMode,
          haptic_enabled: settings.hapticEnabled,
          notifications_enabled: settings.notificationsEnabled,
          reminder_time: settings.reminderTime,
          reminder_days: settings.reminderDays,
          settings_blob: cloudBlob,
        };

        // settings_blob may not exist in older environments; fall back gracefully.
        const { error } = await (supabase as any)
          .from("user_preferences")
          .upsert(payloadWithBlob, { onConflict: "user_id" });

        if (error) {
          if (isPostgrestMissingTable(error)) return;
          if (isPostgrestMissingColumn(error, "settings_blob")) {
            const { error: retryErr } = await supabase.from("user_preferences").upsert(
              {
                user_id: userId,
                theme: settings.theme,
                theme_preset: settings.themePreset,
                font_size: settings.fontSize,
                color_blind_mode: settings.colorBlindMode,
                haptic_enabled: settings.hapticEnabled,
                notifications_enabled: settings.notificationsEnabled,
                reminder_time: settings.reminderTime,
                reminder_days: settings.reminderDays,
              },
              { onConflict: "user_id" },
            );
            if (retryErr) throw retryErr;
          } else {
            throw error;
          }
        }

        lastSyncedHashRef.current = cloudBlobHash;
        if (!opts?.silent) toast.success("Settings synced to cloud");
      } catch {
        if (!opts?.silent) toast.error("Failed to sync settings");
      } finally {
        setIsSyncing(false);
      }
    },
    [cloudBlob, cloudBlobHash, isSyncing, settings, userId],
  );

  const loadCloudSettings = useCallback(
    async (loadUserId: string) => {
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", loadUserId)
          .maybeSingle();

        if (error) {
          if (isPostgrestMissingTable(error)) return;
          throw error;
        }

        if (data) {
          const fromRow = rowToPartialSettings(data);
          const fromBlob = parseCloudSettingsBlob((data as any).settings_blob) ?? {};
          const merged = normalizeCloudStoredSettings({ ...fromRow, ...fromBlob });

          applySettingsFromCloud(merged);
          lastSyncedHashRef.current = JSON.stringify(buildCloudSettingsBlob(merged));
        } else {
          // First-time user: initialize cloud row from local settings (silent).
          await syncToCloud({ silent: true });
        }

        bootstrappedUserIdRef.current = loadUserId;
      } catch {
        // Allow retry later.
        bootstrappedUserIdRef.current = null;
      }
    },
    [applySettingsFromCloud, syncToCloud],
  );

  // Load settings from cloud when user logs in.
  useEffect(() => {
    if (!userId) {
      bootstrappedUserIdRef.current = null;
      lastSyncedHashRef.current = "";
      return;
    }
    void loadCloudSettings(userId);
  }, [loadCloudSettings, userId]);

  // Auto-sync (debounced) after local changes once bootstrap completes.
  useEffect(() => {
    if (!userId) return;
    if (bootstrappedUserIdRef.current !== userId) return;
    if (cloudBlobHash === lastSyncedHashRef.current) return;

    const t = window.setTimeout(() => {
      void syncToCloud({ silent: true });
    }, 900);

    return () => window.clearTimeout(t);
  }, [cloudBlobHash, syncToCloud, userId]);

  return { isSyncing, syncToCloud: () => syncToCloud() };
}
