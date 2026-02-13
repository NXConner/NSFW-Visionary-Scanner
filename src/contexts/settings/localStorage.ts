import { themePresets } from "@/design-system";
import {
  CUSTOM_WALLPAPER_BLOB_SENTINEL,
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  defaultPresetForMode,
} from "./constants";
import type { StoredSettings } from "./types";

// Test if localStorage is actually accessible (handles popup/sandbox restrictions)
export function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const testKey = "__test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function normalizeStoredSettings(parsed: Partial<StoredSettings>): StoredSettings {
  const themePreset =
    parsed.themePreset ||
    (parsed.theme ? defaultPresetForMode[parsed.theme] : DEFAULT_SETTINGS.themePreset);

  const storedCustom = parsed.customWallpaper;
  const customWallpaper =
    typeof storedCustom === "string" && storedCustom === CUSTOM_WALLPAPER_BLOB_SENTINEL
      ? null
      : (storedCustom ?? DEFAULT_SETTINGS.customWallpaper);

  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    themePreset,
    customWallpaper,
    theme: parsed.theme || themePresets[themePreset]?.mode || DEFAULT_SETTINGS.theme,
    measurementUnits:
      parsed.measurementUnits === "metric" ||
      parsed.measurementUnits === "imperial" ||
      parsed.measurementUnits === "dual"
        ? parsed.measurementUnits
        : DEFAULT_SETTINGS.measurementUnits,
    pressureUnits:
      parsed.pressureUnits === "metric" ||
      parsed.pressureUnits === "imperial" ||
      parsed.pressureUnits === "dual"
        ? parsed.pressureUnits
        : DEFAULT_SETTINGS.pressureUnits,
  };
}

export function safelyParseSettings(): StoredSettings {
  try {
    if (!isLocalStorageAvailable()) return DEFAULT_SETTINGS;

    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(saved) as Partial<StoredSettings>;
    return normalizeStoredSettings(parsed);
  } catch {
    return DEFAULT_SETTINGS;
  }
}
