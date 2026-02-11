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
import { applyThemeToDocument, themePresets, type ThemePresetId } from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  clearCustomWallpaperBlob,
  dataUrlToBlob,
  getCustomWallpaperBlob,
  setCustomWallpaperBlob,
} from "@/lib/wallpaperStorage";
import {
  CUSTOM_WALLPAPER_BLOB_SENTINEL,
  DEFAULT_SETTINGS,
  DEFAULT_CUSTOM_INTERFACE_COLORS,
  SETTINGS_KEY,
  defaultPresetForMode,
} from "./constants";
import { isLocalStorageAvailable, safelyParseSettings } from "./localStorage";
import type {
  APIAccessSettings,
  AchievementSettings,
  AROverlaySettings,
  ColorBlindMode,
  CustomInterfaceColors,
  DashboardSettings,
  FontFamily,
  FontSize,
  HealthTrackingSettings,
  MeasurementUnitDisplay,
  NotificationPreferences,
  OfflineModeSettings,
  PressureUnitDisplay,
  ProfileSettings,
  SettingsContextType,
  StoredSettings,
  ThemeMode,
  ThemeExtendedSettings,
  VoiceGuidanceSettings,
} from "./types";

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function getWallpaperExtHintFromFile(file: File): string | undefined {
  const name = file.name || "";
  const ext = name.split(".").pop();
  return ext ? ext.toLowerCase() : undefined;
}

function inferExtFromBlobType(blob: Blob): string {
  const t = blob.type || "";
  if (t.includes("webm")) return "webm";
  if (t.includes("mp4")) return "mp4";
  if (t.includes("quicktime")) return "mov";
  if (t.includes("png")) return "png";
  if (t.includes("gif")) return "gif";
  if (t.includes("webp")) return "webp";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  return "bin";
}

function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const next: any = { ...(base as any) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (v !== undefined) next[k] = v;
  }
  return next as T;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
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
  const [arOverlay, setAROverlayState] = useState<AROverlaySettings>(initial.arOverlay);
  const [offlineMode, setOfflineModeState] = useState<OfflineModeSettings>(initial.offlineMode);
  const [notificationPreferences, setNotificationPreferencesState] =
    useState<NotificationPreferences>(initial.notificationPreferences);
  const [profileSettings, setProfileSettingsState] = useState<ProfileSettings>(
    initial.profileSettings,
  );
  const [voiceGuidance, setVoiceGuidanceState] = useState<VoiceGuidanceSettings>(
    initial.voiceGuidance,
  );
  const [achievements, setAchievementsState] = useState<AchievementSettings>(initial.achievements);
  const [healthTracking, setHealthTrackingState] = useState<HealthTrackingSettings>(
    initial.healthTracking,
  );
  const [dashboard, setDashboardState] = useState<DashboardSettings>(initial.dashboard);
  const [themeExtended, setThemeExtendedState] = useState<ThemeExtendedSettings>(
    initial.themeExtended,
  );
  const [apiAccess, setApiAccessState] = useState<APIAccessSettings>(initial.apiAccess);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const activeWallpaperObjectUrlRef = useRef<string | null>(null);
  const theme: ThemeMode = themePresets[themePreset]?.mode ?? DEFAULT_SETTINGS.theme;

  const revokeActiveObjectUrl = useCallback(() => {
    const current = activeWallpaperObjectUrlRef.current;
    if (current && current.startsWith("blob:")) {
      const url = current.split("#", 1)[0];
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
    activeWallpaperObjectUrlRef.current = null;
  }, []);

  const createWallpaperObjectUrl = useCallback((blob: Blob, extHint?: string) => {
    const url = URL.createObjectURL(blob);
    const ext = extHint || inferExtFromBlobType(blob);
    const decorated = `${url}#wallpaper.${ext}`;
    activeWallpaperObjectUrlRef.current = decorated;
    return decorated;
  }, []);

  useEffect(() => {
    return () => {
      revokeActiveObjectUrl();
    };
  }, [revokeActiveObjectUrl]);

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
          arOverlay,
          offlineMode,
          notificationPreferences,
          profileSettings,
          voiceGuidance,
          achievements,
          healthTracking,
          dashboard,
          themeExtended,
          apiAccess,
          ...overrides,
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
      } catch (error) {
        // Error silently handled
      }
    },
    [
      theme,
      themePreset,
      customWallpaper,
      customWallpaperStoredAsBlob,
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
      arOverlay,
      offlineMode,
      notificationPreferences,
      profileSettings,
      voiceGuidance,
      achievements,
      healthTracking,
      dashboard,
      themeExtended,
      apiAccess,
    ],
  );

  // Load custom wallpaper from IndexedDB if present (and migrate legacy data URLs)
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;

    let cancelled = false;
    const run = async () => {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<StoredSettings>;
        const storedCustom = parsed.customWallpaper;

        // Legacy migration: data URL stored inline
        if (typeof storedCustom === "string" && storedCustom.startsWith("data:")) {
          const blob = dataUrlToBlob(storedCustom);
          await setCustomWallpaperBlob(blob);
          if (cancelled) return;
          revokeActiveObjectUrl();
          const next = createWallpaperObjectUrl(blob);
          setCustomWallpaperStoredAsBlob(true);
          setCustomWallpaperState(next);
          persistSettings({ customWallpaper: CUSTOM_WALLPAPER_BLOB_SENTINEL });
          return;
        }

        if (storedCustom !== CUSTOM_WALLPAPER_BLOB_SENTINEL) return;

        const blob = await getCustomWallpaperBlob();
        if (!blob || cancelled) return;
        revokeActiveObjectUrl();
        const next = createWallpaperObjectUrl(blob);
        setCustomWallpaperStoredAsBlob(true);
        setCustomWallpaperState(next);
      } catch {
        // ignore
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [createWallpaperObjectUrl, persistSettings, revokeActiveObjectUrl]);

  const syncToCloud = useCallback(async () => {
    if (!user) return;

    setIsSyncing(true);
    try {
      const { error } = await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
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
    } catch (error) {
      toast.error("Failed to sync settings");
    } finally {
      setIsSyncing(false);
    }
  }, [
    user,
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
    async (userId: string) => {
      // Prevent multiple loads for the same user
      if (hasLoadedCloudSettingsRef.current === userId) return;
      hasLoadedCloudSettingsRef.current = userId;

      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", userId)
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
          } finally {
            setIsSyncing(false);
          }
        }
      } catch (error) {
        // Reset the ref so we can retry on next mount
        hasLoadedCloudSettingsRef.current = null;
      }
    },
    [
      persistSettings,
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
    if (user?.id) {
      void loadCloudSettings(user.id);
    } else {
      // Reset when user logs out so we can load again on next login
      hasLoadedCloudSettingsRef.current = null;
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    applyThemeToDocument(themePreset, customWallpaper, wallpaperBlur, wallpaperOpacity);
  }, [themePreset, customWallpaper, wallpaperBlur, wallpaperOpacity]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const sizes: Record<FontSize, string> = {
      small: "14px",
      medium: "16px",
      large: "18px",
      xlarge: "20px",
    };
    document.documentElement.style.fontSize = sizes[fontSize];
  }, [fontSize]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const fonts: Record<FontFamily, string> = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      inter: '"Inter", sans-serif',
      playfair: '"Playfair Display", serif',
      "space-grotesk": '"Space Grotesk", sans-serif',
      jetbrains: '"JetBrains Mono", monospace',
      poppins: '"Poppins", sans-serif',
      outfit: '"Outfit", sans-serif',
      sora: '"Sora", sans-serif',
    };
    document.documentElement.style.setProperty("--font-family", fonts[fontFamily]);
    document.body.style.fontFamily = fonts[fontFamily];
  }, [fontFamily]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (customAccentColor) {
      document.documentElement.style.setProperty("--primary", customAccentColor);
      document.documentElement.style.setProperty("--ring", customAccentColor);
    }
  }, [customAccentColor]);

  // Apply custom interface colors to document
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    const colorMap: Record<keyof CustomInterfaceColors, string> = {
      primary: "--primary",
      secondary: "--secondary",
      accent: "--accent",
      background: "--background",
      foreground: "--foreground",
      muted: "--muted",
      mutedForeground: "--muted-foreground",
      border: "--border",
      card: "--card",
      cardForeground: "--card-foreground",
      destructive: "--destructive",
    };

    Object.entries(customInterfaceColors).forEach(([key, value]) => {
      const cssVar = colorMap[key as keyof CustomInterfaceColors];
      if (cssVar && value) {
        root.style.setProperty(cssVar, value);
      }
    });
  }, [customInterfaceColors]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-color-blind", colorBlindMode);
  }, [colorBlindMode]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.uiFx = uiFxEnabled ? "on" : "off";
    root.dataset.uiFxCards = uiFxCardsEnabled ? "on" : "off";
    root.dataset.uiFxCardTilt = uiFxCardTiltEnabled ? "on" : "off";
    root.dataset.uiFxButtons = uiFxButtonsEnabled ? "on" : "off";
    root.dataset.uiFxGlow = uiFxGlowEnabled ? "on" : "off";
    root.dataset.uiFxRipple = uiFxRippleEnabled ? "on" : "off";
    root.dataset.uiFxWallpaper = uiFxWallpaperMotionEnabled ? "on" : "off";
  }, [
    uiFxEnabled,
    uiFxButtonsEnabled,
    uiFxCardTiltEnabled,
    uiFxCardsEnabled,
    uiFxGlowEnabled,
    uiFxRippleEnabled,
    uiFxWallpaperMotionEnabled,
  ]);

  const setTheme = useCallback(
    (mode: ThemeMode) => {
      const nextPreset =
        themePresets[themePreset]?.mode === mode ? themePreset : defaultPresetForMode[mode];
      setThemePresetState(nextPreset);
      persistSettings({ theme: mode, themePreset: nextPreset });
      if (user) void syncToCloud();
    },
    [persistSettings, syncToCloud, themePreset, user],
  );

  const setThemePreset = useCallback(
    (preset: ThemePresetId) => {
      setThemePresetState(preset);
      const resolvedTheme = themePresets[preset]?.mode ?? theme;
      persistSettings({ themePreset: preset, theme: resolvedTheme });
      // Apply immediately so the UI doesn't "snap back" or appear to cycle.
      applyThemeToDocument(preset, customWallpaper, wallpaperBlur, wallpaperOpacity);
      if (user) void syncToCloud();
    },
    [customWallpaper, persistSettings, syncToCloud, theme, user, wallpaperBlur, wallpaperOpacity],
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
    },
    [
      createWallpaperObjectUrl,
      persistSettings,
      revokeActiveObjectUrl,
      themePreset,
      wallpaperBlur,
      wallpaperOpacity,
    ],
  );

  const setCustomWallpaper = useCallback(
    (value: string | null) => {
      if (!value) {
        revokeActiveObjectUrl();
        setCustomWallpaperStoredAsBlob(false);
        setCustomWallpaperState(null);
        persistSettings({ customWallpaper: null });
        applyThemeToDocument(themePreset, null, wallpaperBlur, wallpaperOpacity);
        void clearCustomWallpaperBlob();
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
      persistSettings({ customWallpaper: value });
      applyThemeToDocument(themePreset, value, wallpaperBlur, wallpaperOpacity);
      void clearCustomWallpaperBlob();
    },
    [
      createWallpaperObjectUrl,
      persistSettings,
      revokeActiveObjectUrl,
      themePreset,
      wallpaperBlur,
      wallpaperOpacity,
    ],
  );

  const setWallpaperBlur = useCallback(
    (blur: number) => {
      setWallpaperBlurState(blur);
      persistSettings({ wallpaperBlur: blur });
      applyThemeToDocument(themePreset, customWallpaper, blur, wallpaperOpacity);
    },
    [customWallpaper, persistSettings, themePreset, wallpaperOpacity],
  );

  const setWallpaperOpacity = useCallback(
    (opacity: number) => {
      setWallpaperOpacityState(opacity);
      persistSettings({ wallpaperOpacity: opacity });
      applyThemeToDocument(themePreset, customWallpaper, wallpaperBlur, opacity);
    },
    [customWallpaper, persistSettings, themePreset, wallpaperBlur],
  );

  const setFontSize = useCallback(
    (size: FontSize) => {
      setFontSizeState(size);
      persistSettings({ fontSize: size });
      if (user) void syncToCloud();
    },
    [persistSettings, syncToCloud, user],
  );

  const setFontFamily = useCallback(
    (font: FontFamily) => {
      setFontFamilyState(font);
      persistSettings({ fontFamily: font });
    },
    [persistSettings],
  );

  const setCustomAccentColor = useCallback(
    (color: string | null) => {
      setCustomAccentColorState(color);
      persistSettings({ customAccentColor: color });
    },
    [persistSettings],
  );

  const setCustomInterfaceColors = useCallback(
    (colors: CustomInterfaceColors) => {
      setCustomInterfaceColorsState(colors);
      persistSettings({ customInterfaceColors: colors });
    },
    [persistSettings],
  );

  const setColorBlindMode = useCallback(
    (mode: ColorBlindMode) => {
      setColorBlindModeState(mode);
      persistSettings({ colorBlindMode: mode });
      if (user) void syncToCloud();
    },
    [persistSettings, syncToCloud, user],
  );

  const setMeasurementUnits = useCallback(
    (mode: MeasurementUnitDisplay) => {
      setMeasurementUnitsState(mode);
      persistSettings({ measurementUnits: mode });
    },
    [persistSettings],
  );

  const setPressureUnits = useCallback(
    (mode: PressureUnitDisplay) => {
      setPressureUnitsState(mode);
      persistSettings({ pressureUnits: mode });
    },
    [persistSettings],
  );

  const setHapticEnabled = useCallback(
    (enabled: boolean) => {
      setHapticEnabledState(enabled);
      persistSettings({ hapticEnabled: enabled });
      if (user) void syncToCloud();
    },
    [persistSettings, syncToCloud, user],
  );

  const setNotificationsEnabled = useCallback(
    (enabled: boolean) => {
      setNotificationsEnabledState(enabled);
      persistSettings({ notificationsEnabled: enabled });
      if (user) void syncToCloud();
    },
    [persistSettings, syncToCloud, user],
  );

  const setReminderTime = useCallback(
    (time: string) => {
      setReminderTimeState(time);
      persistSettings({ reminderTime: time });
      if (user) void syncToCloud();
    },
    [persistSettings, syncToCloud, user],
  );

  const setReminderDays = useCallback(
    (days: number[]) => {
      setReminderDaysState(days);
      persistSettings({ reminderDays: days });
      if (user) void syncToCloud();
    },
    [persistSettings, syncToCloud, user],
  );

  const setUiFxEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxEnabledState(enabled);
      persistSettings({ uiFxEnabled: enabled });
    },
    [persistSettings],
  );

  const setUiFxCardsEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxCardsEnabledState(enabled);
      persistSettings({ uiFxCardsEnabled: enabled });
    },
    [persistSettings],
  );

  const setUiFxCardTiltEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxCardTiltEnabledState(enabled);
      persistSettings({ uiFxCardTiltEnabled: enabled });
    },
    [persistSettings],
  );

  const setUiFxButtonsEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxButtonsEnabledState(enabled);
      persistSettings({ uiFxButtonsEnabled: enabled });
    },
    [persistSettings],
  );

  const setUiFxGlowEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxGlowEnabledState(enabled);
      persistSettings({ uiFxGlowEnabled: enabled });
    },
    [persistSettings],
  );

  const setUiFxRippleEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxRippleEnabledState(enabled);
      persistSettings({ uiFxRippleEnabled: enabled });
    },
    [persistSettings],
  );

  const setUiFxWallpaperMotionEnabled = useCallback(
    (enabled: boolean) => {
      setUiFxWallpaperMotionEnabledState(enabled);
      persistSettings({ uiFxWallpaperMotionEnabled: enabled });
    },
    [persistSettings],
  );

  const setAROverlay = useCallback(
    (settings: Partial<AROverlaySettings>) => {
      setAROverlayState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ arOverlay: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setOfflineMode = useCallback(
    (settings: Partial<OfflineModeSettings>) => {
      setOfflineModeState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ offlineMode: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setNotificationPreferences = useCallback(
    (settings: Partial<NotificationPreferences>) => {
      setNotificationPreferencesState(prev => {
        const mergedTypes = settings.types ? { ...prev.types, ...settings.types } : prev.types;
        const next = {
          ...mergeDefined(prev, settings),
          types: mergedTypes,
        } as NotificationPreferences;
        persistSettings({ notificationPreferences: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setProfileSettings = useCallback(
    (settings: Partial<ProfileSettings>) => {
      setProfileSettingsState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ profileSettings: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setVoiceGuidance = useCallback(
    (settings: Partial<VoiceGuidanceSettings>) => {
      setVoiceGuidanceState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ voiceGuidance: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setAchievements = useCallback(
    (settings: Partial<AchievementSettings>) => {
      setAchievementsState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ achievements: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setHealthTracking = useCallback(
    (settings: Partial<HealthTrackingSettings>) => {
      setHealthTrackingState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ healthTracking: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setDashboard = useCallback(
    (settings: Partial<DashboardSettings>) => {
      setDashboardState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ dashboard: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setThemeExtended = useCallback(
    (settings: Partial<ThemeExtendedSettings>) => {
      setThemeExtendedState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ themeExtended: next });
        return next;
      });
    },
    [persistSettings],
  );

  const setAPIAccess = useCallback(
    (settings: Partial<APIAccessSettings>) => {
      setApiAccessState(prev => {
        const next = mergeDefined(prev, settings);
        persistSettings({ apiAccess: next });
        return next;
      });
    },
    [persistSettings],
  );

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
        arOverlay,
        setAROverlay,
        offlineMode,
        setOfflineMode,
        notificationPreferences,
        setNotificationPreferences,
        profileSettings,
        setProfileSettings,
        voiceGuidance,
        setVoiceGuidance,
        achievements,
        setAchievements,
        healthTracking,
        setHealthTracking,
        dashboard,
        setDashboard,
        themeExtended,
        setThemeExtended,
        apiAccess,
        setAPIAccess,
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
