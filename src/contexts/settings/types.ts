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

// ======= AR Overlay Settings =======
export type AROverlaySensitivity = "low" | "medium" | "high";
export type ARFeedbackStyle = "minimal" | "standard" | "detailed";

export interface AROverlaySettings {
  showGuides: boolean;
  showDetectionPoints: boolean;
  showMeasurementLines: boolean;
  showQualityIndicator: boolean;
  showPositioningPrompts: boolean;
  sensitivity: AROverlaySensitivity;
  feedbackStyle: ARFeedbackStyle;
  hapticFeedback: boolean;
  soundFeedback: boolean;
}

// ======= Offline Mode Settings =======
export interface OfflineModeSettings {
  enabled: boolean;
  autoSync: boolean;
  syncOnWifiOnly: boolean;
  maxOfflineStorage: number; // in MB
  backgroundSyncEnabled: boolean;
  syncInterval: number; // in minutes
}

// ======= Notification Settings =======
export type NotificationFrequency = "realtime" | "hourly" | "daily" | "weekly";
export type NotificationType = "measurement" | "achievement" | "reminder" | "health" | "system";

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  frequency: NotificationFrequency;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string;
  types: Record<NotificationType, boolean>;
}

// ======= Multi-Profile Settings =======
export interface ProfileSettings {
  multiProfileEnabled: boolean;
  maxProfiles: number;
  requirePinForSwitch: boolean;
  showProfileSwitcher: boolean;
}

// ======= Voice Guidance Settings =======
export type VoiceGuidanceSpeed = "slow" | "normal" | "fast";
export type VoiceGuidanceVoice = "default" | "male" | "female";

export interface VoiceGuidanceSettings {
  enabled: boolean;
  speed: VoiceGuidanceSpeed;
  voice: VoiceGuidanceVoice;
  volume: number; // 0-100
  announceSteps: boolean;
  announceMeasurements: boolean;
  announceErrors: boolean;
}

// ======= Achievement Tracking Settings =======
export interface AchievementSettings {
  enabled: boolean;
  showNotifications: boolean;
  showBadges: boolean;
  showProgress: boolean;
  shareAchievements: boolean;
}

// ======= Medication/Symptom Tracking Settings =======
export interface HealthTrackingSettings {
  medicationTrackingEnabled: boolean;
  symptomTrackingEnabled: boolean;
  dailyRemindersEnabled: boolean;
  reminderTimes: string[]; // Array of HH:mm
  trackingCategories: string[];
}

// ======= Dashboard Customization =======
export type DashboardWidget =
  | "measurements"
  | "progress"
  | "achievements"
  | "health"
  | "calendar"
  | "tips"
  | "goals";
export type DashboardLayout = "grid" | "list" | "compact";

export interface DashboardSettings {
  layout: DashboardLayout;
  visibleWidgets: DashboardWidget[];
  widgetOrder: DashboardWidget[];
  refreshInterval: number; // in seconds
  showQuickActions: boolean;
}

// ======= Theme/Appearance Extended Settings =======
export interface ThemeExtendedSettings {
  useSystemTheme: boolean;
  scheduledTheme: boolean;
  lightThemeStart: string; // HH:mm
  darkThemeStart: string;
  animationsEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

// ======= API Access Settings =======
export interface APIAccessSettings {
  apiEnabled: boolean;
  webhooksEnabled: boolean;
  allowedEndpoints: string[];
  rateLimitPerMinute: number;
  apiKeyRotationDays: number;
}

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

  // ======= New Feature Settings =======
  arOverlay: AROverlaySettings;
  setAROverlay: (settings: Partial<AROverlaySettings>) => void;

  offlineMode: OfflineModeSettings;
  setOfflineMode: (settings: Partial<OfflineModeSettings>) => void;

  notificationPreferences: NotificationPreferences;
  setNotificationPreferences: (settings: Partial<NotificationPreferences>) => void;

  profileSettings: ProfileSettings;
  setProfileSettings: (settings: Partial<ProfileSettings>) => void;

  voiceGuidance: VoiceGuidanceSettings;
  setVoiceGuidance: (settings: Partial<VoiceGuidanceSettings>) => void;

  achievements: AchievementSettings;
  setAchievements: (settings: Partial<AchievementSettings>) => void;

  healthTracking: HealthTrackingSettings;
  setHealthTracking: (settings: Partial<HealthTrackingSettings>) => void;

  dashboard: DashboardSettings;
  setDashboard: (settings: Partial<DashboardSettings>) => void;

  themeExtended: ThemeExtendedSettings;
  setThemeExtended: (settings: Partial<ThemeExtendedSettings>) => void;

  apiAccess: APIAccessSettings;
  setAPIAccess: (settings: Partial<APIAccessSettings>) => void;

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

  // ======= New Feature Settings Storage =======
  arOverlay: AROverlaySettings;
  offlineMode: OfflineModeSettings;
  notificationPreferences: NotificationPreferences;
  profileSettings: ProfileSettings;
  voiceGuidance: VoiceGuidanceSettings;
  achievements: AchievementSettings;
  healthTracking: HealthTrackingSettings;
  dashboard: DashboardSettings;
  themeExtended: ThemeExtendedSettings;
  apiAccess: APIAccessSettings;
}

// ======= Default Values =======
export const DEFAULT_AR_OVERLAY_SETTINGS: AROverlaySettings = {
  showGuides: true,
  showDetectionPoints: true,
  showMeasurementLines: true,
  showQualityIndicator: true,
  showPositioningPrompts: true,
  sensitivity: "medium",
  feedbackStyle: "standard",
  hapticFeedback: true,
  soundFeedback: false,
};

export const DEFAULT_OFFLINE_MODE_SETTINGS: OfflineModeSettings = {
  enabled: true,
  autoSync: true,
  syncOnWifiOnly: false,
  maxOfflineStorage: 100,
  backgroundSyncEnabled: true,
  syncInterval: 15,
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  sound: true,
  vibration: true,
  frequency: "realtime",
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  types: {
    measurement: true,
    achievement: true,
    reminder: true,
    health: true,
    system: true,
  },
};

export const DEFAULT_PROFILE_SETTINGS: ProfileSettings = {
  multiProfileEnabled: false,
  maxProfiles: 5,
  requirePinForSwitch: false,
  showProfileSwitcher: true,
};

export const DEFAULT_VOICE_GUIDANCE_SETTINGS: VoiceGuidanceSettings = {
  enabled: false,
  speed: "normal",
  voice: "default",
  volume: 80,
  announceSteps: true,
  announceMeasurements: true,
  announceErrors: true,
};

export const DEFAULT_ACHIEVEMENT_SETTINGS: AchievementSettings = {
  enabled: true,
  showNotifications: true,
  showBadges: true,
  showProgress: true,
  shareAchievements: false,
};

export const DEFAULT_HEALTH_TRACKING_SETTINGS: HealthTrackingSettings = {
  medicationTrackingEnabled: false,
  symptomTrackingEnabled: false,
  dailyRemindersEnabled: false,
  reminderTimes: ["09:00", "21:00"],
  trackingCategories: ["general", "pain", "mood"],
};

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  layout: "grid",
  visibleWidgets: ["measurements", "progress", "achievements"],
  widgetOrder: ["measurements", "progress", "achievements", "health", "calendar", "tips", "goals"],
  refreshInterval: 30,
  showQuickActions: true,
};

export const DEFAULT_THEME_EXTENDED_SETTINGS: ThemeExtendedSettings = {
  useSystemTheme: false,
  scheduledTheme: false,
  lightThemeStart: "06:00",
  darkThemeStart: "18:00",
  animationsEnabled: true,
  reducedMotion: false,
  highContrast: false,
};

export const DEFAULT_API_ACCESS_SETTINGS: APIAccessSettings = {
  apiEnabled: false,
  webhooksEnabled: false,
  allowedEndpoints: [],
  rateLimitPerMinute: 60,
  apiKeyRotationDays: 90,
};
