import { useCallback, useEffect, useRef, useState } from "react";

import type { ThemePresetId } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import type { ColorBlindMode, FontSize, StoredSettings, ThemeMode } from "../types";

export function useSettingsCloudSync(args: {
  userId: string | null | undefined;
  theme: ThemeMode;
  themePreset: ThemePresetId;
  fontSize: FontSize;
  colorBlindMode: ColorBlindMode;
  hapticEnabled: boolean;
  notificationsEnabled: boolean;
  reminderTime: string;
  reminderDays: number[];
  persistSettings: (overrides?: Partial<StoredSettings>) => void;
  setThemePresetState: (preset: ThemePresetId) => void;
  setFontSizeState: (size: FontSize) => void;
  setColorBlindModeState: (mode: ColorBlindMode) => void;
  setHapticEnabledState: (enabled: boolean) => void;
  setNotificationsEnabledState: (enabled: boolean) => void;
  setReminderTimeState: (time: string) => void;
  setReminderDaysState: (days: number[]) => void;
}): {
  isSyncing: boolean;
  syncToCloud: () => Promise<void>;
} {
  const {
    userId,
    theme,
    themePreset,
    fontSize,
    colorBlindMode,
    hapticEnabled,
    notificationsEnabled,
    reminderTime,
    reminderDays,
    persistSettings,
    setThemePresetState,
    setFontSizeState,
    setColorBlindModeState,
    setHapticEnabledState,
    setNotificationsEnabledState,
    setReminderTimeState,
    setReminderDaysState,
  } = args;

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const syncToCloud = useCallback(async () => {
    if (!userId) return;

    setIsSyncing(true);
    try {
      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: userId,
          theme,
          theme_preset: themePreset,
          font_size: fontSize,
          color_blind_mode: colorBlindMode,
          haptic_enabled: hapticEnabled,
          notifications_enabled: notificationsEnabled,
          reminder_time: reminderTime,
          reminder_days: reminderDays,
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;
      toast.success("Settings synced to cloud");
    } catch {
      toast.error("Failed to sync settings");
    } finally {
      setIsSyncing(false);
    }
  }, [
    userId,
    theme,
    themePreset,
    fontSize,
    colorBlindMode,
    hapticEnabled,
    notificationsEnabled,
    reminderTime,
    reminderDays,
  ]);

  // Track if we've already loaded settings for this user to prevent loops
  const hasLoadedCloudSettingsRef = useRef<string | null>(null);

  const loadCloudSettings = useCallback(
    async (loadUserId: string) => {
      // Prevent multiple loads for the same user
      if (hasLoadedCloudSettingsRef.current === loadUserId) return;
      hasLoadedCloudSettingsRef.current = loadUserId;

      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", loadUserId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Apply cloud settings
          if (data.theme_preset) setThemePresetState(data.theme_preset as ThemePresetId);
          if (data.font_size) setFontSizeState(data.font_size as FontSize);
          if (data.color_blind_mode)
            setColorBlindModeState(data.color_blind_mode as ColorBlindMode);
          if (typeof data.haptic_enabled === "boolean") setHapticEnabledState(data.haptic_enabled);
          if (typeof data.notifications_enabled === "boolean")
            setNotificationsEnabledState(data.notifications_enabled);
          if (data.reminder_time) setReminderTimeState(data.reminder_time);
          if (data.reminder_days) setReminderDaysState(data.reminder_days);

          persistSettings({
            themePreset: data.theme_preset as ThemePresetId,
            fontSize: data.font_size as FontSize,
            colorBlindMode: data.color_blind_mode as ColorBlindMode,
            hapticEnabled: data.haptic_enabled,
            notificationsEnabled: data.notifications_enabled,
            reminderTime: data.reminder_time,
            reminderDays: data.reminder_days,
          });

          // Only show toast once per session
          toast.success("Settings loaded from cloud");
        } else {
          // No cloud settings exist, sync current to cloud
          setIsSyncing(true);
          try {
            await supabase.from("user_preferences").upsert(
              {
                user_id: loadUserId,
                theme,
                theme_preset: themePreset,
                font_size: fontSize,
                color_blind_mode: colorBlindMode,
                haptic_enabled: hapticEnabled,
                notifications_enabled: notificationsEnabled,
                reminder_time: reminderTime,
                reminder_days: reminderDays,
              },
              { onConflict: "user_id" },
            );
          } finally {
            setIsSyncing(false);
          }
        }
      } catch {
        // Reset the ref so we can retry on next mount
        hasLoadedCloudSettingsRef.current = null;
      }
    },
    [
      persistSettings,
      setColorBlindModeState,
      setFontSizeState,
      setHapticEnabledState,
      setNotificationsEnabledState,
      setReminderDaysState,
      setReminderTimeState,
      setThemePresetState,
      theme,
      themePreset,
      fontSize,
      colorBlindMode,
      hapticEnabled,
      notificationsEnabled,
      reminderTime,
      reminderDays,
    ],
  );

  // Load settings from cloud when user logs in (only once per user)
  useEffect(() => {
    if (userId) {
      void loadCloudSettings(userId);
    } else {
      // Reset when user logs out so we can load again on next login
      hasLoadedCloudSettingsRef.current = null;
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isSyncing, syncToCloud };
}
