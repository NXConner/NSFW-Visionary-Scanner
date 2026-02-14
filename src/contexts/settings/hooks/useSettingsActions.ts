import { useCallback } from "react";

import { applyThemeToDocument, themePresets, type ThemePresetId } from "@/design-system";
import { toast } from "sonner";
import {
  clearCustomWallpaperBlob,
  dataUrlToBlob,
  setCustomWallpaperBlob,
} from "@/lib/wallpaperStorage";
import { uploadUserWallpaper } from "@/lib/wallpaperCloud";

import { CUSTOM_WALLPAPER_BLOB_SENTINEL, defaultPresetForMode } from "../constants";
import { getWallpaperExtHintFromFile } from "../wallpaperUtils";
import type {
  ColorBlindMode,
  CustomInterfaceColors,
  FontFamily,
  FontSize,
  MeasurementUnitDisplay,
  PressureUnitDisplay,
  StoredSettings,
  ThemeMode,
} from "../types";

export function useSettingsActions(args: {
  userId: string | null | undefined;
  theme: ThemeMode;
  themePreset: ThemePresetId;
  customWallpaper: string | null;
  customWallpaperCloudPath: string | null;
  wallpaperBlur: number;
  wallpaperOpacity: number;
  fontSize: FontSize;
  persistSettings: (overrides?: Partial<StoredSettings>) => void;
  syncToCloud: () => Promise<void>;

  revokeActiveObjectUrl: () => void;
  createWallpaperObjectUrl: (blob: Blob, extHint?: string) => string;

  setThemePresetState: (preset: ThemePresetId) => void;
  setCustomWallpaperState: (next: string | null) => void;
  setCustomWallpaperStoredAsBlob: (next: boolean) => void;
  setCustomWallpaperCloudPathState: (next: string | null) => void;
  setWallpaperBlurState: (blur: number) => void;
  setWallpaperOpacityState: (opacity: number) => void;
  setFontSizeState: (size: FontSize) => void;
  setFontFamilyState: (font: FontFamily) => void;
  setCustomAccentColorState: (color: string | null) => void;
  setCustomInterfaceColorsState: (colors: CustomInterfaceColors) => void;
  setColorBlindModeState: (mode: ColorBlindMode) => void;
  setMeasurementUnitsState: (mode: MeasurementUnitDisplay) => void;
  setPressureUnitsState: (mode: PressureUnitDisplay) => void;
  setHapticEnabledState: (enabled: boolean) => void;
  setNotificationsEnabledState: (enabled: boolean) => void;
  setReminderTimeState: (time: string) => void;
  setReminderDaysState: (days: number[]) => void;
  setUiFxEnabledState: (enabled: boolean) => void;
  setUiFxCardsEnabledState: (enabled: boolean) => void;
  setUiFxCardTiltEnabledState: (enabled: boolean) => void;
  setUiFxButtonsEnabledState: (enabled: boolean) => void;
  setUiFxGlowEnabledState: (enabled: boolean) => void;
  setUiFxRippleEnabledState: (enabled: boolean) => void;
  setUiFxWallpaperMotionEnabledState: (enabled: boolean) => void;
}) {
  const {
    userId,
    theme,
    themePreset,
    customWallpaper,
    customWallpaperCloudPath,
    wallpaperBlur,
    wallpaperOpacity,
    fontSize,
    persistSettings,
    syncToCloud,
    revokeActiveObjectUrl,
    createWallpaperObjectUrl,
    setThemePresetState,
    setCustomWallpaperState,
    setCustomWallpaperStoredAsBlob,
    setCustomWallpaperCloudPathState,
    setWallpaperBlurState,
    setWallpaperOpacityState,
    setFontSizeState,
    setFontFamilyState,
    setCustomAccentColorState,
    setCustomInterfaceColorsState,
    setColorBlindModeState,
    setMeasurementUnitsState,
    setPressureUnitsState,
    setHapticEnabledState,
    setNotificationsEnabledState,
    setReminderTimeState,
    setReminderDaysState,
    setUiFxEnabledState,
    setUiFxCardsEnabledState,
    setUiFxCardTiltEnabledState,
    setUiFxButtonsEnabledState,
    setUiFxGlowEnabledState,
    setUiFxRippleEnabledState,
    setUiFxWallpaperMotionEnabledState,
  } = args;

  const setTheme = useCallback(
    (mode: ThemeMode) => {
      const nextPreset =
        themePresets[themePreset]?.mode === mode ? themePreset : defaultPresetForMode[mode];
      setThemePresetState(nextPreset);
      persistSettings({ theme: mode, themePreset: nextPreset });
      void syncToCloud();
    },
    [persistSettings, syncToCloud, themePreset, setThemePresetState],
  );

  const setThemePreset = useCallback(
    (preset: ThemePresetId) => {
      setThemePresetState(preset);
      const resolvedTheme = themePresets[preset]?.mode ?? theme;
      persistSettings({ themePreset: preset, theme: resolvedTheme });
      // Apply immediately so the UI doesn't "snap back" or appear to cycle.
      applyThemeToDocument(preset, customWallpaper, wallpaperBlur, wallpaperOpacity);
      void syncToCloud();
    },
    [
      customWallpaper,
      persistSettings,
      syncToCloud,
      theme,
      wallpaperBlur,
      wallpaperOpacity,
      setThemePresetState,
    ],
  );

  const setCustomWallpaperFromFile = useCallback(
    (file: File) => {
      setCustomWallpaperStoredAsBlob(true);
      revokeActiveObjectUrl();
      const next = createWallpaperObjectUrl(file, getWallpaperExtHintFromFile(file));
      setCustomWallpaperState(next);
      persistSettings({ customWallpaper: CUSTOM_WALLPAPER_BLOB_SENTINEL });
      // Apply immediately with the object URL for instant feedback.
      applyThemeToDocument(themePreset, next, wallpaperBlur, wallpaperOpacity);
      setCustomWallpaperBlob(file).catch(() => {
        toast.error("Failed to save wallpaper");
      });

      // Best-effort: upload to cloud for cross-device persistence (private bucket + RLS).
      if (userId) {
        void (async () => {
          const uploaded = await uploadUserWallpaper({
            userId: String(userId),
            file,
            filenameHint: file.name,
          });
          if (!uploaded?.path) return;
          setCustomWallpaperCloudPathState(uploaded.path);
          persistSettings({ customWallpaperCloudPath: uploaded.path });
          void syncToCloud();
        })();
      }
    },
    [
      createWallpaperObjectUrl,
      userId,
      persistSettings,
      revokeActiveObjectUrl,
      setCustomWallpaperCloudPathState,
      themePreset,
      wallpaperBlur,
      wallpaperOpacity,
      setCustomWallpaperState,
      setCustomWallpaperStoredAsBlob,
      syncToCloud,
    ],
  );

  const setCustomWallpaper = useCallback(
    (value: string | null) => {
      if (!value) {
        revokeActiveObjectUrl();
        setCustomWallpaperStoredAsBlob(false);
        setCustomWallpaperState(null);
        setCustomWallpaperCloudPathState(null);
        persistSettings({ customWallpaper: null, customWallpaperCloudPath: null });
        applyThemeToDocument(themePreset, null, wallpaperBlur, wallpaperOpacity);
        void clearCustomWallpaperBlob();
        void syncToCloud();
        return;
      }

      // If a data URL is passed (legacy path), migrate into IndexedDB blob storage asynchronously.
      if (value.startsWith("data:")) {
        setCustomWallpaperStoredAsBlob(true);
        setCustomWallpaperState(value);
        persistSettings({ customWallpaper: CUSTOM_WALLPAPER_BLOB_SENTINEL });
        applyThemeToDocument(themePreset, value, wallpaperBlur, wallpaperOpacity);
        void (async () => {
          try {
            const blob = dataUrlToBlob(value);
            await setCustomWallpaperBlob(blob);
            revokeActiveObjectUrl();
            const next = createWallpaperObjectUrl(blob);
            setCustomWallpaperState(next);
            applyThemeToDocument(themePreset, next, wallpaperBlur, wallpaperOpacity);
          } catch {
            // keep data URL in memory if migration fails
          }
        })();
        return;
      }

      // Preset gradient / remote URL string: store inline
      revokeActiveObjectUrl();
      setCustomWallpaperStoredAsBlob(false);
      setCustomWallpaperState(value);
      // Remote / preset string does not use cloud-storage path; clear any prior cloud path.
      if (customWallpaperCloudPath) setCustomWallpaperCloudPathState(null);
      persistSettings({ customWallpaper: value, customWallpaperCloudPath: null });
      applyThemeToDocument(themePreset, value, wallpaperBlur, wallpaperOpacity);
      void clearCustomWallpaperBlob();
    },
    [
      createWallpaperObjectUrl,
      customWallpaperCloudPath,
      persistSettings,
      revokeActiveObjectUrl,
      setCustomWallpaperCloudPathState,
      themePreset,
      wallpaperBlur,
      wallpaperOpacity,
      setCustomWallpaperState,
      setCustomWallpaperStoredAsBlob,
      syncToCloud,
    ],
  );

  const setWallpaperBlur = useCallback(
    (blur: number) => {
      setWallpaperBlurState(blur);
      persistSettings({ wallpaperBlur: blur });
      applyThemeToDocument(themePreset, customWallpaper, blur, wallpaperOpacity);
    },
    [customWallpaper, persistSettings, themePreset, wallpaperOpacity, setWallpaperBlurState],
  );

  const setWallpaperOpacity = useCallback(
    (opacity: number) => {
      setWallpaperOpacityState(opacity);
      persistSettings({ wallpaperOpacity: opacity });
      applyThemeToDocument(themePreset, customWallpaper, wallpaperBlur, opacity);
    },
    [customWallpaper, persistSettings, themePreset, wallpaperBlur, setWallpaperOpacityState],
  );

  const setFontSize = useCallback(
    (size: FontSize) => {
      setFontSizeState(size);
      persistSettings({ fontSize: size });
      void syncToCloud();
    },
    [persistSettings, syncToCloud, setFontSizeState],
  );

  const setFontFamily = useCallback(
    (font: FontFamily) => {
      setFontFamilyState(font);
      persistSettings({ fontFamily: font });
    },
    [persistSettings, setFontFamilyState],
  );

  const setCustomAccentColor = useCallback(
    (color: string | null) => {
      setCustomAccentColorState(color);
      persistSettings({ customAccentColor: color });
    },
    [persistSettings, setCustomAccentColorState],
  );

  const setCustomInterfaceColors = useCallback(
    (colors: CustomInterfaceColors) => {
      setCustomInterfaceColorsState(colors);
      persistSettings({ customInterfaceColors: colors });
    },
    [persistSettings, setCustomInterfaceColorsState],
  );

  const setColorBlindMode = useCallback(
    (mode: ColorBlindMode) => {
      setColorBlindModeState(mode);
      persistSettings({ colorBlindMode: mode });
      void syncToCloud();
    },
    [persistSettings, syncToCloud, setColorBlindModeState],
  );

  const setMeasurementUnits = useCallback(
    (mode: MeasurementUnitDisplay) => {
      setMeasurementUnitsState(mode);
      persistSettings({ measurementUnits: mode });
    },
    [persistSettings, setMeasurementUnitsState],
  );

  const setPressureUnits = useCallback(
    (mode: PressureUnitDisplay) => {
      setPressureUnitsState(mode);
      persistSettings({ pressureUnits: mode });
    },
    [persistSettings, setPressureUnitsState],
  );

  const setHapticEnabled = useCallback(
    (enabled: boolean) => {
      setHapticEnabledState(enabled);
      persistSettings({ hapticEnabled: enabled });
      void syncToCloud();
    },
    [persistSettings, syncToCloud, setHapticEnabledState],
  );

  const setNotificationsEnabled = useCallback(
    (enabled: boolean) => {
      setNotificationsEnabledState(enabled);
      persistSettings({ notificationsEnabled: enabled });
      void syncToCloud();
    },
    [persistSettings, syncToCloud, setNotificationsEnabledState],
  );

  const setReminderTime = useCallback(
    (time: string) => {
      setReminderTimeState(time);
      persistSettings({ reminderTime: time });
      void syncToCloud();
    },
    [persistSettings, syncToCloud, setReminderTimeState],
  );

  const setReminderDays = useCallback(
    (days: number[]) => {
      setReminderDaysState(days);
      persistSettings({ reminderDays: days });
      void syncToCloud();
    },
    [persistSettings, syncToCloud, setReminderDaysState],
  );

  const setUiFxEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxEnabledState(enabled);
      persistSettings({ uiFxEnabled: enabled });
    },
    [persistSettings, setUiFxEnabledState],
  );

  const setUiFxCardsEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxCardsEnabledState(enabled);
      persistSettings({ uiFxCardsEnabled: enabled });
    },
    [persistSettings, setUiFxCardsEnabledState],
  );

  const setUiFxCardTiltEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxCardTiltEnabledState(enabled);
      persistSettings({ uiFxCardTiltEnabled: enabled });
    },
    [persistSettings, setUiFxCardTiltEnabledState],
  );

  const setUiFxButtonsEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxButtonsEnabledState(enabled);
      persistSettings({ uiFxButtonsEnabled: enabled });
    },
    [persistSettings, setUiFxButtonsEnabledState],
  );

  const setUiFxGlowEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxGlowEnabledState(enabled);
      persistSettings({ uiFxGlowEnabled: enabled });
    },
    [persistSettings, setUiFxGlowEnabledState],
  );

  const setUiFxRippleEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxRippleEnabledState(enabled);
      persistSettings({ uiFxRippleEnabled: enabled });
    },
    [persistSettings, setUiFxRippleEnabledState],
  );

  const setUiFxWallpaperMotionEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxWallpaperMotionEnabledState(enabled);
      persistSettings({ uiFxWallpaperMotionEnabled: enabled });
    },
    [persistSettings, setUiFxWallpaperMotionEnabledState],
  );

  return {
    setTheme,
    setThemePreset,
    setCustomWallpaperFromFile,
    setCustomWallpaper,
    setWallpaperBlur,
    setWallpaperOpacity,
    setFontSize,
    setFontFamily,
    setCustomAccentColor,
    setCustomInterfaceColors,
    setColorBlindMode,
    setMeasurementUnits,
    setPressureUnits,
    setHapticEnabled,
    setNotificationsEnabled,
    setReminderTime,
    setReminderDays,
    setUiFxEnabled,
    setUiFxCardsEnabled,
    setUiFxCardTiltEnabled,
    setUiFxButtonsEnabled,
    setUiFxGlowEnabled,
    setUiFxRippleEnabled,
    setUiFxWallpaperMotionEnabled,
  };
}
