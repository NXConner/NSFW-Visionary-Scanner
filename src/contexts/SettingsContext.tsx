import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  applyThemeToDocument,
  themePresets,
  type ThemePresetId,
} from "@/design-system";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type ThemeMode = "dark" | "light";
type FontSize = "small" | "medium" | "large" | "xlarge";
type ColorBlindMode = "none" | "protanopia" | "deuteranopia" | "tritanopia";

interface SettingsContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  themePreset: ThemePresetId;
  setThemePreset: (preset: ThemePresetId) => void;
  customWallpaper: string | null;
  setCustomWallpaper: (dataUrl: string | null) => void;
  wallpaperBlur: number;
  setWallpaperBlur: (blur: number) => void;
  wallpaperOpacity: number;
  setWallpaperOpacity: (opacity: number) => void;

  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;

  colorBlindMode: ColorBlindMode;
  setColorBlindMode: (mode: ColorBlindMode) => void;

  hapticEnabled: boolean;
  setHapticEnabled: (enabled: boolean) => void;

  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  reminderTime: string;
  setReminderTime: (time: string) => void;
  reminderDays: number[];
  setReminderDays: (days: number[]) => void;
  
  isSyncing: boolean;
  syncToCloud: () => Promise<void>;
}

interface StoredSettings {
  theme: ThemeMode;
  themePreset: ThemePresetId;
  customWallpaper: string | null;
  wallpaperBlur: number;
  wallpaperOpacity: number;
  fontSize: FontSize;
  colorBlindMode: ColorBlindMode;
  hapticEnabled: boolean;
  notificationsEnabled: boolean;
  reminderTime: string;
  reminderDays: number[];
}

const DEFAULT_SETTINGS: StoredSettings = {
  theme: "dark",
  themePreset: "obsidian",
  customWallpaper: null,
  wallpaperBlur: 200,
  wallpaperOpacity: 0.55,
  fontSize: "medium",
  colorBlindMode: "none",
  hapticEnabled: true,
  notificationsEnabled: false,
  reminderTime: "09:00",
  reminderDays: [1, 3, 5],
};

const defaultPresetForMode: Record<ThemeMode, ThemePresetId> = {
  dark: "obsidian",
  light: "lumina",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_KEY = "morphoscan_settings";

const safelyParseSettings = (): StoredSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(saved) as Partial<StoredSettings>;
    const themePreset =
      parsed.themePreset ||
      (parsed.theme ? defaultPresetForMode[parsed.theme] : DEFAULT_SETTINGS.themePreset);

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      themePreset,
      theme: parsed.theme || themePresets[themePreset]?.mode || DEFAULT_SETTINGS.theme,
    };
  } catch (error) {
    console.error("Failed to parse settings:", error);
    return DEFAULT_SETTINGS;
  }
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const initial = typeof window !== "undefined" ? safelyParseSettings() : DEFAULT_SETTINGS;

  const [themePreset, setThemePresetState] = useState<ThemePresetId>(initial.themePreset);
  const [customWallpaper, setCustomWallpaperState] = useState<string | null>(initial.customWallpaper);
  const [wallpaperBlur, setWallpaperBlurState] = useState<number>(initial.wallpaperBlur);
  const [wallpaperOpacity, setWallpaperOpacityState] = useState<number>(initial.wallpaperOpacity);
  const [fontSize, setFontSizeState] = useState<FontSize>(initial.fontSize);
  const [colorBlindMode, setColorBlindModeState] = useState<ColorBlindMode>(initial.colorBlindMode);
  const [hapticEnabled, setHapticEnabledState] = useState(initial.hapticEnabled);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(initial.notificationsEnabled);
  const [reminderTime, setReminderTimeState] = useState(initial.reminderTime);
  const [reminderDays, setReminderDaysState] = useState<number[]>(initial.reminderDays);
  const [isSyncing, setIsSyncing] = useState(false);

  const theme = themePresets[themePreset]?.mode ?? DEFAULT_SETTINGS.theme;

  const persistSettings = useCallback((overrides: Partial<StoredSettings> = {}) => {
    if (typeof window === "undefined") return;
    const payload: StoredSettings = {
      theme,
      themePreset,
      customWallpaper,
      wallpaperBlur,
      wallpaperOpacity,
      fontSize,
      colorBlindMode,
      hapticEnabled,
      notificationsEnabled,
      reminderTime,
      reminderDays,
      ...overrides,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
  }, [theme, themePreset, customWallpaper, wallpaperBlur, wallpaperOpacity, fontSize, colorBlindMode, hapticEnabled, notificationsEnabled, reminderTime, reminderDays]);

  // Sync settings to cloud database
  const syncToCloud = useCallback(async () => {
    if (!user) return;
    
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          theme,
          theme_preset: themePreset,
          font_size: fontSize,
          color_blind_mode: colorBlindMode,
          haptic_enabled: hapticEnabled,
          notifications_enabled: notificationsEnabled,
          reminder_time: reminderTime,
          reminder_days: reminderDays,
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Settings synced to cloud');
    } catch (error) {
      console.error('Failed to sync settings:', error);
      toast.error('Failed to sync settings');
    } finally {
      setIsSyncing(false);
    }
  }, [user, theme, themePreset, fontSize, colorBlindMode, hapticEnabled, notificationsEnabled, reminderTime, reminderDays]);

  // Load settings from cloud when user logs in
  useEffect(() => {
    const loadCloudSettings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Apply cloud settings
          if (data.theme_preset) setThemePresetState(data.theme_preset as ThemePresetId);
          if (data.font_size) setFontSizeState(data.font_size as FontSize);
          if (data.color_blind_mode) setColorBlindModeState(data.color_blind_mode as ColorBlindMode);
          if (typeof data.haptic_enabled === 'boolean') setHapticEnabledState(data.haptic_enabled);
          if (typeof data.notifications_enabled === 'boolean') setNotificationsEnabledState(data.notifications_enabled);
          if (data.reminder_time) setReminderTimeState(data.reminder_time);
          if (data.reminder_days) setReminderDaysState(data.reminder_days);
          
          // Also persist to local storage
          persistSettings({
            themePreset: data.theme_preset as ThemePresetId,
            fontSize: data.font_size as FontSize,
            colorBlindMode: data.color_blind_mode as ColorBlindMode,
            hapticEnabled: data.haptic_enabled,
            notificationsEnabled: data.notifications_enabled,
            reminderTime: data.reminder_time,
            reminderDays: data.reminder_days,
          });
          
          toast.success('Settings loaded from cloud');
        } else {
          // No cloud settings, upload local settings
          await syncToCloud();
        }
      } catch (error) {
        console.error('Failed to load cloud settings:', error);
      }
    };

    loadCloudSettings();
  }, [user]);

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
    document.documentElement.setAttribute("data-color-blind", colorBlindMode);
  }, [colorBlindMode]);

  const setTheme = (mode: ThemeMode) => {
    const nextPreset =
      themePresets[themePreset]?.mode === mode ? themePreset : defaultPresetForMode[mode];
    setThemePresetState(nextPreset);
    persistSettings({ theme: mode, themePreset: nextPreset });
    if (user) syncToCloud();
  };

  const setThemePreset = (preset: ThemePresetId) => {
    setThemePresetState(preset);
    const resolvedTheme = themePresets[preset]?.mode ?? theme;
    persistSettings({ themePreset: preset, theme: resolvedTheme });
    if (user) syncToCloud();
  };

  const setCustomWallpaper = (dataUrl: string | null) => {
    setCustomWallpaperState(dataUrl);
    persistSettings({ customWallpaper: dataUrl });
  };

  const setWallpaperBlur = (blur: number) => {
    setWallpaperBlurState(blur);
    persistSettings({ wallpaperBlur: blur });
  };

  const setWallpaperOpacity = (opacity: number) => {
    setWallpaperOpacityState(opacity);
    persistSettings({ wallpaperOpacity: opacity });
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    persistSettings({ fontSize: size });
    if (user) syncToCloud();
  };

  const setColorBlindMode = (mode: ColorBlindMode) => {
    setColorBlindModeState(mode);
    persistSettings({ colorBlindMode: mode });
    if (user) syncToCloud();
  };

  const setHapticEnabled = (enabled: boolean) => {
    setHapticEnabledState(enabled);
    persistSettings({ hapticEnabled: enabled });
    if (user) syncToCloud();
  };

  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    persistSettings({ notificationsEnabled: enabled });
    if (user) syncToCloud();
  };

  const setReminderTime = (time: string) => {
    setReminderTimeState(time);
    persistSettings({ reminderTime: time });
    if (user) syncToCloud();
  };

  const setReminderDays = (days: number[]) => {
    setReminderDaysState(days);
    persistSettings({ reminderDays: days });
    if (user) syncToCloud();
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        themePreset,
        setThemePreset,
        customWallpaper,
        setCustomWallpaper,
        wallpaperBlur,
        setWallpaperBlur,
        wallpaperOpacity,
        setWallpaperOpacity,
        fontSize,
        setFontSize,
        colorBlindMode,
        setColorBlindMode,
        hapticEnabled,
        setHapticEnabled,
        notificationsEnabled,
        setNotificationsEnabled,
        reminderTime,
        setReminderTime,
        reminderDays,
        setReminderDays,
        isSyncing,
        syncToCloud,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
