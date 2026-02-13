import type { ThemePresetId } from "@/design-system";
import type { CustomInterfaceColors, StoredSettings, ThemeMode } from "./types";

export const SETTINGS_KEY = "morphoscan_settings";
export const CUSTOM_WALLPAPER_BLOB_SENTINEL = "__idb_blob_wallpaper__";

export const DEFAULT_CUSTOM_INTERFACE_COLORS: CustomInterfaceColors = {
  primary: null,
  secondary: null,
  accent: null,
  background: null,
  foreground: null,
  muted: null,
  mutedForeground: null,
  border: null,
  card: null,
  cardForeground: null,
  destructive: null,
};

export const DEFAULT_SETTINGS: StoredSettings = {
  theme: "dark",
  themePreset: "obsidian",
  customWallpaper: null,
  wallpaperBlur: 200,
  wallpaperOpacity: 0.55,
  fontSize: "medium",
  fontFamily: "system",
  customAccentColor: null,
  customInterfaceColors: DEFAULT_CUSTOM_INTERFACE_COLORS,
  colorBlindMode: "none",
  measurementUnits: "dual",
  pressureUnits: "dual",
  hapticEnabled: true,
  notificationsEnabled: false,
  reminderTime: "09:00",
  reminderDays: [1, 3, 5],
  // UI visual effects (micro-interactions) — enabled by default
  uiFxEnabled: true,
  uiFxCardsEnabled: true,
  uiFxCardTiltEnabled: true,
  uiFxButtonsEnabled: true,
  uiFxGlowEnabled: true,
  uiFxRippleEnabled: true,
  uiFxWallpaperMotionEnabled: true,
};

export const defaultPresetForMode: Record<ThemeMode, ThemePresetId> = {
  dark: "obsidian",
  light: "lumina",
};
