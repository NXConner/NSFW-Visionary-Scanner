export type ThemeMode = "dark" | "light";
export type FontSize = "small" | "medium" | "large" | "xlarge";
export type ColorBlindMode = "none" | "protanopia" | "deuteranopia" | "tritanopia";
export type FontFamily =
  | "system"
  | "inter"
  | "playfair"
  | "space-grotesk"
  | "jetbrains"
  | "poppins"
  | "outfit"
  | "sora";

export type MeasurementUnitDisplay = "dual" | "metric" | "imperial";
export type PressureUnitDisplay = "dual" | "imperial" | "metric";

export interface CustomInterfaceColors {
  primary: string | null;
  secondary: string | null;
  accent: string | null;
  background: string | null;
  foreground: string | null;
  muted: string | null;
  mutedForeground: string | null;
  border: string | null;
  card: string | null;
  cardForeground: string | null;
  destructive: string | null;
}

export interface SettingsContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  themePreset: import("@/design-system").ThemePresetId;
  setThemePreset: (preset: import("@/design-system").ThemePresetId) => void;

  customWallpaper: string | null;
  setCustomWallpaper: (value: string | null) => void;
  setCustomWallpaperFromFile: (file: File) => void;
  wallpaperBlur: number;
  setWallpaperBlur: (blur: number) => void;
  wallpaperOpacity: number;
  setWallpaperOpacity: (opacity: number) => void;

  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;

  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;

  customAccentColor: string | null;
  setCustomAccentColor: (color: string | null) => void;

  customInterfaceColors: CustomInterfaceColors;
  setCustomInterfaceColors: (colors: CustomInterfaceColors) => void;

  colorBlindMode: ColorBlindMode;
  setColorBlindMode: (mode: ColorBlindMode) => void;

  measurementUnits: MeasurementUnitDisplay;
  setMeasurementUnits: (mode: MeasurementUnitDisplay) => void;

  pressureUnits: PressureUnitDisplay;
  setPressureUnits: (mode: PressureUnitDisplay) => void;

  hapticEnabled: boolean;
  setHapticEnabled: (enabled: boolean) => void;

  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  reminderTime: string;
  setReminderTime: (time: string) => void;
  reminderDays: number[];
  setReminderDays: (days: number[]) => void;

  /**
   * Global UI visual effects (micro-interactions, glows, tilt, motion).
   * Applied across cards, buttons, background/wallpaper, and other UI chrome.
   *
   * These settings are intentionally separate from `visualEffectsSettings` which
   * controls image filters (cel shading, sobel, etc).
   */
  uiFxEnabled: boolean;
  setUiFxEnabled: (enabled: boolean) => void;
  uiFxCardsEnabled: boolean;
  setUiFxCardsEnabled: (enabled: boolean) => void;
  uiFxCardTiltEnabled: boolean;
  setUiFxCardTiltEnabled: (enabled: boolean) => void;
  uiFxButtonsEnabled: boolean;
  setUiFxButtonsEnabled: (enabled: boolean) => void;
  uiFxGlowEnabled: boolean;
  setUiFxGlowEnabled: (enabled: boolean) => void;
  uiFxRippleEnabled: boolean;
  setUiFxRippleEnabled: (enabled: boolean) => void;
  uiFxWallpaperMotionEnabled: boolean;
  setUiFxWallpaperMotionEnabled: (enabled: boolean) => void;

  isSyncing: boolean;
  syncToCloud: () => Promise<void>;
}

export interface StoredSettings {
  theme: ThemeMode;
  themePreset: import("@/design-system").ThemePresetId;
  customWallpaper: string | null;
  wallpaperBlur: number;
  wallpaperOpacity: number;
  fontSize: FontSize;
  fontFamily: FontFamily;
  customAccentColor: string | null;
  customInterfaceColors: CustomInterfaceColors;
  colorBlindMode: ColorBlindMode;
  measurementUnits: MeasurementUnitDisplay;
  pressureUnits: PressureUnitDisplay;
  hapticEnabled: boolean;
  notificationsEnabled: boolean;
  reminderTime: string;
  reminderDays: number[];

  uiFxEnabled: boolean;
  uiFxCardsEnabled: boolean;
  uiFxCardTiltEnabled: boolean;
  uiFxButtonsEnabled: boolean;
  uiFxGlowEnabled: boolean;
  uiFxRippleEnabled: boolean;
  uiFxWallpaperMotionEnabled: boolean;
}
