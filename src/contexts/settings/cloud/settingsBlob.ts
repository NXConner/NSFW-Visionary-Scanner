import { themePresets, type ThemePresetId } from "@/design-system";
import {
  CUSTOM_WALLPAPER_BLOB_SENTINEL,
  DEFAULT_SETTINGS,
  defaultPresetForMode,
} from "../constants";
import type {
  ColorBlindMode,
  FontFamily,
  FontSize,
  MeasurementUnitDisplay,
  PressureUnitDisplay,
  StoredSettings,
  ThemeMode,
} from "../types";

export type CloudSettingsBlobV1 = {
  v: 1;
  settings: Partial<StoredSettings>;
};

function isThemeMode(v: unknown): v is ThemeMode {
  return v === "dark" || v === "light";
}

function isFontSize(v: unknown): v is FontSize {
  return v === "small" || v === "medium" || v === "large" || v === "xlarge";
}

function isFontFamily(v: unknown): v is FontFamily {
  return (
    v === "system" ||
    v === "inter" ||
    v === "playfair" ||
    v === "space-grotesk" ||
    v === "jetbrains" ||
    v === "poppins" ||
    v === "outfit" ||
    v === "sora"
  );
}

function isColorBlindMode(v: unknown): v is ColorBlindMode {
  return v === "none" || v === "protanopia" || v === "deuteranopia" || v === "tritanopia";
}

function isMeasurementUnits(v: unknown): v is MeasurementUnitDisplay {
  return v === "dual" || v === "metric" || v === "imperial";
}

function isPressureUnits(v: unknown): v is PressureUnitDisplay {
  return v === "dual" || v === "metric" || v === "imperial";
}

function normalizeThemePreset(v: unknown, theme: ThemeMode): ThemePresetId {
  const raw = String(v ?? "").trim();
  if (raw && themePresets[raw as ThemePresetId]) return raw as ThemePresetId;
  return defaultPresetForMode[theme];
}

function normalizeCustomWallpaperForCloud(v: unknown): string | null {
  const s = typeof v === "string" ? v : null;
  if (!s) return null;

  // Never sync blob: object URLs to cloud; they are device/session specific.
  if (s.startsWith("blob:")) return CUSTOM_WALLPAPER_BLOB_SENTINEL;

  // If local blob sentinel is used, preserve sentinel (actual bytes live in IndexedDB / Storage).
  if (s === CUSTOM_WALLPAPER_BLOB_SENTINEL) return CUSTOM_WALLPAPER_BLOB_SENTINEL;

  // Remote URL / preset string (safe to sync as-is).
  return s.slice(0, 4096);
}

export function buildCloudSettingsBlob(settings: StoredSettings): CloudSettingsBlobV1 {
  return {
    v: 1,
    settings: {
      ...settings,
      customWallpaper: normalizeCustomWallpaperForCloud(settings.customWallpaper),
      customWallpaperCloudPath: settings.customWallpaperCloudPath ?? null,
    },
  };
}

export function parseCloudSettingsBlob(input: unknown): Partial<StoredSettings> | null {
  if (!input || typeof input !== "object") return null;
  const v = (input as any).v;
  const settings = (input as any).settings;
  if (v !== 1) return null;
  if (!settings || typeof settings !== "object") return null;
  return settings as Partial<StoredSettings>;
}

export function normalizeCloudStoredSettings(partial: Partial<StoredSettings>): StoredSettings {
  const theme: ThemeMode = isThemeMode(partial.theme) ? partial.theme : DEFAULT_SETTINGS.theme;
  const themePreset = normalizeThemePreset(partial.themePreset, theme);

  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    theme,
    themePreset,
    customWallpaper: normalizeCustomWallpaperForCloud(partial.customWallpaper),
    customWallpaperCloudPath:
      typeof partial.customWallpaperCloudPath === "string"
        ? partial.customWallpaperCloudPath.slice(0, 1024)
        : null,
    fontSize: isFontSize(partial.fontSize) ? partial.fontSize : DEFAULT_SETTINGS.fontSize,
    fontFamily: isFontFamily(partial.fontFamily) ? partial.fontFamily : DEFAULT_SETTINGS.fontFamily,
    colorBlindMode: isColorBlindMode(partial.colorBlindMode)
      ? partial.colorBlindMode
      : DEFAULT_SETTINGS.colorBlindMode,
    measurementUnits: isMeasurementUnits(partial.measurementUnits)
      ? partial.measurementUnits
      : DEFAULT_SETTINGS.measurementUnits,
    pressureUnits: isPressureUnits(partial.pressureUnits)
      ? partial.pressureUnits
      : DEFAULT_SETTINGS.pressureUnits,
  };
}
