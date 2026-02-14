import { useEffect } from "react";

import { applyThemeToDocument, themePresets, type ThemePresetId } from "@/design-system";

import type { CustomInterfaceColors, FontFamily, FontSize, ThemeMode } from "../types";

const FONT_SIZES: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
  xlarge: "20px",
};

const FONT_FAMILIES: Record<FontFamily, string> = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  inter: '"Inter", sans-serif',
  playfair: '"Playfair Display", serif',
  "space-grotesk": '"Space Grotesk", sans-serif',
  jetbrains: '"JetBrains Mono", monospace',
  poppins: '"Poppins", sans-serif',
  outfit: '"Outfit", sans-serif',
  sora: '"Sora", sans-serif',
};

const INTERFACE_COLOR_VAR_MAP: Record<keyof CustomInterfaceColors, string> = {
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

export function useSettingsDocumentEffects(args: {
  theme: ThemeMode;
  themePreset: ThemePresetId;
  customWallpaper: string | null;
  wallpaperBlur: number;
  wallpaperOpacity: number;
  fontSize: FontSize;
  fontFamily: FontFamily;
  customAccentColor: string | null;
  customInterfaceColors: CustomInterfaceColors;
  colorBlindMode: string;
  uiFxEnabled: boolean;
  uiFxCardsEnabled: boolean;
  uiFxCardTiltEnabled: boolean;
  uiFxButtonsEnabled: boolean;
  uiFxGlowEnabled: boolean;
  uiFxRippleEnabled: boolean;
  uiFxWallpaperMotionEnabled: boolean;
}): void {
  const {
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
  } = args;

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
    document.documentElement.style.fontSize = FONT_SIZES[fontSize];
  }, [fontSize]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const font = FONT_FAMILIES[fontFamily];
    document.documentElement.style.setProperty("--font-family", font);
    document.body.style.fontFamily = font;
  }, [fontFamily]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (customAccentColor) {
      document.documentElement.style.setProperty("--primary", customAccentColor);
      document.documentElement.style.setProperty("--ring", customAccentColor);
    } else {
      // Reset to preset-derived defaults
      const preset = themePresets[themePreset];
      if (preset?.colors?.primary)
        document.documentElement.style.setProperty("--primary", preset.colors.primary);
      if (preset?.colors?.ring)
        document.documentElement.style.setProperty("--ring", preset.colors.ring);
    }
  }, [customAccentColor, themePreset]);

  // Apply custom interface colors to document
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    Object.entries(customInterfaceColors).forEach(([key, value]) => {
      const cssVar = INTERFACE_COLOR_VAR_MAP[key as keyof CustomInterfaceColors];
      if (cssVar && value) root.style.setProperty(cssVar, value);
    });
  }, [customInterfaceColors]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-color-blind", String(colorBlindMode || "none"));
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
}
