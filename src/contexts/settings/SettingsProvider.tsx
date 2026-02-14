import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { themePresets, type ThemePresetId } from "@/design-system";
import { useAuth } from "@/contexts/AuthContext";
import { setCustomWallpaperBlob } from "@/lib/wallpaperStorage";
import { downloadUserWallpaper } from "@/lib/wallpaperCloud";

import {
  CUSTOM_WALLPAPER_BLOB_SENTINEL,
  DEFAULT_CUSTOM_INTERFACE_COLORS,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
} from "./constants";
import { isLocalStorageAvailable, safelyParseSettings } from "./localStorage";
import type {
  ColorBlindMode,
  CustomInterfaceColors,
  FontFamily,
  FontSize,
  MeasurementUnitDisplay,
  PressureUnitDisplay,
  SettingsContextType,
  StoredSettings,
  ThemeMode,
} from "./types";

import {
  useCustomWallpaperStorage,
  useSettingsCloudSync,
  useSettingsActions,
  useSettingsDocumentEffects,
  useWallpaperObjectUrl,
} from "./hooks";

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }): JSX.Element {
  const { user } = useAuth();

  const initial = useMemo(() => {
    try {
      return typeof window !== "undefined" ? safelyParseSettings() : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }, []);

  const [themePreset, setThemePresetState] = useState<ThemePresetId>(initial.themePreset);
  const [customWallpaper, setCustomWallpaperState] = useState<string | null>(
    initial.customWallpaper,
  );
  const [customWallpaperCloudPath, setCustomWallpaperCloudPathState] = useState<string | null>(
    initial.customWallpaperCloudPath ?? null,
  );
  const [customWallpaperStoredAsBlob, setCustomWallpaperStoredAsBlob] = useState<boolean>(false);
  const [wallpaperBlur, setWallpaperBlurState] = useState<number>(initial.wallpaperBlur);
  const [wallpaperOpacity, setWallpaperOpacityState] = useState<number>(initial.wallpaperOpacity);
  const [fontSize, setFontSizeState] = useState<FontSize>(initial.fontSize);
  const [fontFamily, setFontFamilyState] = useState<FontFamily>(initial.fontFamily);
  const [customAccentColor, setCustomAccentColorState] = useState<string | null>(
    initial.customAccentColor,
  );
  const [customInterfaceColors, setCustomInterfaceColorsState] = useState<CustomInterfaceColors>(
    initial.customInterfaceColors ?? DEFAULT_CUSTOM_INTERFACE_COLORS,
  );
  const [colorBlindMode, setColorBlindModeState] = useState<ColorBlindMode>(initial.colorBlindMode);
  const [measurementUnits, setMeasurementUnitsState] = useState<MeasurementUnitDisplay>(
    initial.measurementUnits,
  );
  const [pressureUnits, setPressureUnitsState] = useState<PressureUnitDisplay>(
    initial.pressureUnits,
  );
  const [hapticEnabled, setHapticEnabledState] = useState<boolean>(initial.hapticEnabled);
  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(
    initial.notificationsEnabled,
  );
  const [reminderTime, setReminderTimeState] = useState<string>(initial.reminderTime);
  const [reminderDays, setReminderDaysState] = useState<number[]>(initial.reminderDays);
  const [uiFxEnabled, setUiFxEnabledState] = useState<boolean>(initial.uiFxEnabled);
  const [uiFxCardsEnabled, setUiFxCardsEnabledState] = useState<boolean>(initial.uiFxCardsEnabled);
  const [uiFxCardTiltEnabled, setUiFxCardTiltEnabledState] = useState<boolean>(
    initial.uiFxCardTiltEnabled,
  );
  const [uiFxButtonsEnabled, setUiFxButtonsEnabledState] = useState<boolean>(
    initial.uiFxButtonsEnabled,
  );
  const [uiFxGlowEnabled, setUiFxGlowEnabledState] = useState<boolean>(initial.uiFxGlowEnabled);
  const [uiFxRippleEnabled, setUiFxRippleEnabledState] = useState<boolean>(
    initial.uiFxRippleEnabled,
  );
  const [uiFxWallpaperMotionEnabled, setUiFxWallpaperMotionEnabledState] = useState<boolean>(
    initial.uiFxWallpaperMotionEnabled,
  );

  const theme: ThemeMode = themePresets[themePreset]?.mode ?? DEFAULT_SETTINGS.theme;

  const persistSettings = useCallback(
    (overrides: Partial<StoredSettings> = {}) => {
      try {
        if (!isLocalStorageAvailable()) return;
        const persistedCustomWallpaper = customWallpaperStoredAsBlob
          ? CUSTOM_WALLPAPER_BLOB_SENTINEL
          : customWallpaper;
        const payload: StoredSettings = {
          theme,
          themePreset,
          customWallpaper: persistedCustomWallpaper,
          customWallpaperCloudPath,
          wallpaperBlur,
          wallpaperOpacity,
          fontSize,
          fontFamily,
          customAccentColor,
          customInterfaceColors,
          colorBlindMode,
          measurementUnits,
          pressureUnits,
          hapticEnabled,
          notificationsEnabled,
          reminderTime,
          reminderDays,
          uiFxEnabled,
          uiFxCardsEnabled,
          uiFxCardTiltEnabled,
          uiFxButtonsEnabled,
          uiFxGlowEnabled,
          uiFxRippleEnabled,
          uiFxWallpaperMotionEnabled,
          ...overrides,
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
      } catch {
        // ignore
      }
    },
    [
      colorBlindMode,
      customAccentColor,
      customInterfaceColors,
      customWallpaper,
      customWallpaperCloudPath,
      customWallpaperStoredAsBlob,
      fontFamily,
      fontSize,
      hapticEnabled,
      measurementUnits,
      notificationsEnabled,
      pressureUnits,
      reminderDays,
      reminderTime,
      theme,
      themePreset,
      uiFxButtonsEnabled,
      uiFxCardTiltEnabled,
      uiFxCardsEnabled,
      uiFxEnabled,
      uiFxGlowEnabled,
      uiFxRippleEnabled,
      uiFxWallpaperMotionEnabled,
      wallpaperBlur,
      wallpaperOpacity,
    ],
  );

  const { createWallpaperObjectUrl, revokeActiveObjectUrl } = useWallpaperObjectUrl();

  useCustomWallpaperStorage({
    persistSettings,
    revokeActiveObjectUrl,
    createWallpaperObjectUrl,
    setCustomWallpaperStoredAsBlob,
    setCustomWallpaperState,
  });

  // If a cloud wallpaper path exists, download it once per path and persist into IndexedDB,
  // then render through the existing "blob sentinel" wallpaper flow.
  const lastDownloadedWallpaperPathRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id) {
      lastDownloadedWallpaperPathRef.current = null;
      return;
    }
    const path = customWallpaperCloudPath;
    if (!path) {
      lastDownloadedWallpaperPathRef.current = null;
      return;
    }

    // If we already have a wallpaper blob rendered locally, avoid re-downloading.
    if (customWallpaperStoredAsBlob && typeof customWallpaper === "string" && customWallpaper) {
      lastDownloadedWallpaperPathRef.current = path;
      return;
    }

    if (lastDownloadedWallpaperPathRef.current === path) return;
    lastDownloadedWallpaperPathRef.current = path;

    void (async () => {
      const res = await downloadUserWallpaper({ path });
      if (!res?.blob) return;
      await setCustomWallpaperBlob(res.blob);

      revokeActiveObjectUrl();
      const extHint = String(path.split(".").pop() || "png").slice(0, 8);
      const nextUrl = createWallpaperObjectUrl(res.blob, extHint);
      setCustomWallpaperStoredAsBlob(true);
      setCustomWallpaperState(nextUrl);
      persistSettings({ customWallpaper: CUSTOM_WALLPAPER_BLOB_SENTINEL });
    })();
  }, [
    createWallpaperObjectUrl,
    customWallpaper,
    customWallpaperCloudPath,
    customWallpaperStoredAsBlob,
    persistSettings,
    revokeActiveObjectUrl,
    user?.id,
  ]);

  const settingsSnapshot = useMemo<StoredSettings>(
    () => ({
      theme,
      themePreset,
      customWallpaper,
      customWallpaperCloudPath,
      wallpaperBlur,
      wallpaperOpacity,
      fontSize,
      fontFamily,
      customAccentColor,
      customInterfaceColors,
      colorBlindMode,
      measurementUnits,
      pressureUnits,
      hapticEnabled,
      notificationsEnabled,
      reminderTime,
      reminderDays,
      uiFxEnabled,
      uiFxCardsEnabled,
      uiFxCardTiltEnabled,
      uiFxButtonsEnabled,
      uiFxGlowEnabled,
      uiFxRippleEnabled,
      uiFxWallpaperMotionEnabled,
    }),
    [
      colorBlindMode,
      customAccentColor,
      customInterfaceColors,
      customWallpaper,
      customWallpaperCloudPath,
      fontFamily,
      fontSize,
      hapticEnabled,
      measurementUnits,
      notificationsEnabled,
      pressureUnits,
      reminderDays,
      reminderTime,
      theme,
      themePreset,
      uiFxButtonsEnabled,
      uiFxCardTiltEnabled,
      uiFxCardsEnabled,
      uiFxEnabled,
      uiFxGlowEnabled,
      uiFxRippleEnabled,
      uiFxWallpaperMotionEnabled,
      wallpaperBlur,
      wallpaperOpacity,
    ],
  );

  const applySettingsFromCloud = useCallback(
    (next: StoredSettings) => {
      // Theme / typography
      setThemePresetState(next.themePreset);
      setFontSizeState(next.fontSize);
      setFontFamilyState(next.fontFamily);
      setColorBlindModeState(next.colorBlindMode);

      // Wallpaper / UI chrome
      setWallpaperBlurState(next.wallpaperBlur);
      setWallpaperOpacityState(next.wallpaperOpacity);
      setCustomAccentColorState(next.customAccentColor);
      setCustomInterfaceColorsState(next.customInterfaceColors);
      setCustomWallpaperCloudPathState(next.customWallpaperCloudPath ?? null);

      // Units
      setMeasurementUnitsState(next.measurementUnits);
      setPressureUnitsState(next.pressureUnits);

      // Reminders / haptics / notifications
      setHapticEnabledState(next.hapticEnabled);
      setNotificationsEnabledState(next.notificationsEnabled);
      setReminderTimeState(next.reminderTime);
      setReminderDaysState(next.reminderDays);

      // UI micro-interactions
      setUiFxEnabledState(next.uiFxEnabled);
      setUiFxCardsEnabledState(next.uiFxCardsEnabled);
      setUiFxCardTiltEnabledState(next.uiFxCardTiltEnabled);
      setUiFxButtonsEnabledState(next.uiFxButtonsEnabled);
      setUiFxGlowEnabledState(next.uiFxGlowEnabled);
      setUiFxRippleEnabledState(next.uiFxRippleEnabled);
      setUiFxWallpaperMotionEnabledState(next.uiFxWallpaperMotionEnabled);

      // Custom wallpaper value:
      // - Cloud blob flow uses the sentinel and will be restored via IndexedDB (and optional cloud download).
      // - URL/preset strings are applied directly.
      revokeActiveObjectUrl();
      if (next.customWallpaper === CUSTOM_WALLPAPER_BLOB_SENTINEL) {
        setCustomWallpaperStoredAsBlob(true);
        setCustomWallpaperState(null);
        persistSettings({ ...next, customWallpaper: CUSTOM_WALLPAPER_BLOB_SENTINEL });
      } else {
        setCustomWallpaperStoredAsBlob(false);
        setCustomWallpaperState(next.customWallpaper);
        persistSettings({ ...next, customWallpaper: next.customWallpaper ?? null });
      }
    },
    [
      persistSettings,
      revokeActiveObjectUrl,
      setColorBlindModeState,
      setCustomAccentColorState,
      setCustomInterfaceColorsState,
      setCustomWallpaperCloudPathState,
      setCustomWallpaperState,
      setCustomWallpaperStoredAsBlob,
      setFontFamilyState,
      setFontSizeState,
      setHapticEnabledState,
      setMeasurementUnitsState,
      setNotificationsEnabledState,
      setPressureUnitsState,
      setReminderDaysState,
      setReminderTimeState,
      setThemePresetState,
      setUiFxButtonsEnabledState,
      setUiFxCardTiltEnabledState,
      setUiFxCardsEnabledState,
      setUiFxEnabledState,
      setUiFxGlowEnabledState,
      setUiFxRippleEnabledState,
      setUiFxWallpaperMotionEnabledState,
      setWallpaperBlurState,
      setWallpaperOpacityState,
    ],
  );

  const { isSyncing, syncToCloud } = useSettingsCloudSync({
    userId: user?.id,
    settings: settingsSnapshot,
    applySettingsFromCloud,
  });

  useSettingsDocumentEffects({
    theme,
    themePreset,
    customWallpaper,
    wallpaperBlur,
    wallpaperOpacity,
    fontSize,
    fontFamily,
    customAccentColor,
    customInterfaceColors,
    colorBlindMode,
    uiFxEnabled,
    uiFxCardsEnabled,
    uiFxCardTiltEnabled,
    uiFxButtonsEnabled,
    uiFxGlowEnabled,
    uiFxRippleEnabled,
    uiFxWallpaperMotionEnabled,
  });

  const {
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
  } = useSettingsActions({
    userId: user?.id,
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
  });

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        themePreset,
        setThemePreset,
        customWallpaper,
        setCustomWallpaper,
        setCustomWallpaperFromFile,
        wallpaperBlur,
        setWallpaperBlur,
        wallpaperOpacity,
        setWallpaperOpacity,
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        customAccentColor,
        setCustomAccentColor,
        customInterfaceColors,
        setCustomInterfaceColors,
        colorBlindMode,
        setColorBlindMode,
        measurementUnits,
        setMeasurementUnits,
        pressureUnits,
        setPressureUnits,
        hapticEnabled,
        setHapticEnabled,
        notificationsEnabled,
        setNotificationsEnabled,
        reminderTime,
        setReminderTime,
        reminderDays,
        setReminderDays,
        uiFxEnabled,
        setUiFxEnabled,
        uiFxCardsEnabled,
        setUiFxCardsEnabled,
        uiFxCardTiltEnabled,
        setUiFxCardTiltEnabled,
        uiFxButtonsEnabled,
        setUiFxButtonsEnabled,
        uiFxGlowEnabled,
        setUiFxGlowEnabled,
        uiFxRippleEnabled,
        setUiFxRippleEnabled,
        uiFxWallpaperMotionEnabled,
        setUiFxWallpaperMotionEnabled,
        isSyncing,
        syncToCloud,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}
