import type { CapacitorConfig } from "@capacitor/cli";

// Only enable dev server for local development, NEVER for production builds
// Default to production mode (no server URL) - only include server URL when explicitly in dev
const isDevMode =
  process.env.NODE_ENV === "development" &&
  process.env.VITE_DEV_SERVER === "true" &&
  !process.env.CAPACITOR_BUILD;

const serverConfig: CapacitorConfig["server"] = {
  androidScheme: "https",
  cleartext: false,
  ...(isDevMode
    ? {
        url: "https://0b696f8a-6a68-4651-ba80-ae9256f5e910.lovableproject.com?forceHideBadge=true",
        cleartext: false,
      }
    : {}),
};

const config: CapacitorConfig = {
  appId: "com.morphoscan.pro",
  appName: "MorphoScan Pro",
  webDir: "dist",

  // NEVER include server URL in production builds - always use local bundled assets
  // Server URL is ONLY for local development when explicitly enabled
  // For Android/iOS builds, this should ALWAYS be empty to use bundled assets
  server: serverConfig,

  android: {
    allowMixedContent: isDevMode,
    captureInput: true,
    webContentsDebuggingEnabled: isDevMode,
    backgroundColor: "#0a0a0a",
  },

  ios: {
    contentInset: "automatic",
    allowsLinkPreview: true,
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: "#0a0a0a",
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // We'll hide it manually after app loads
      launchAutoHide: false, // Don't auto-hide - we control this in JS
      launchFadeOutDuration: 300,
      backgroundColor: "#0a0a0a",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      iosSpinnerStyle: "small",
      spinnerColor: "#8B5CF6",
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0a0a0a",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#8B5CF6",
      sound: "default",
    },
  },
};

export default config;
