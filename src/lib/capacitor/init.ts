/**
 * Capacitor initialization module
 * Handles device-ready events, splash screen dismissal, and mobile-specific setup
 */

import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

// Track initialization state
let isInitialized = false;
let initializationError: Error | null = null;

/**
 * Check if running in a Capacitor native environment
 */
export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the current platform (web, ios, android)
 */
export const getPlatform = (): "web" | "ios" | "android" => {
  return Capacitor.getPlatform() as "web" | "ios" | "android";
};

/**
 * Hide the splash screen safely
 */
export const hideSplashScreen = async (): Promise<void> => {
  if (!isNative()) return;

  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
    console.log("[Capacitor] Splash screen hidden");
  } catch (error) {
    console.warn("[Capacitor] Failed to hide splash screen:", error);
    // Don't throw - app should continue even if splash fails
  }
};

/**
 * Configure the status bar for mobile
 */
const configureStatusBar = async (): Promise<void> => {
  if (!isNative()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0a0a0a" });
    console.log("[Capacitor] Status bar configured");
  } catch (error) {
    console.warn("[Capacitor] Failed to configure status bar:", error);
  }
};

/**
 * Initialize Capacitor for mobile environments
 * Should be called early in the app lifecycle
 */
export const initializeCapacitor = async (): Promise<void> => {
  if (isInitialized) {
    console.log("[Capacitor] Already initialized");
    return;
  }

  const platform = getPlatform();
  console.log(`[Capacitor] Initializing on platform: ${platform}`);

  if (!isNative()) {
    console.log("[Capacitor] Web platform - skipping native initialization");
    isInitialized = true;
    return;
  }

  try {
    // Configure status bar first
    await configureStatusBar();

    // Mark as initialized
    isInitialized = true;
    console.log("[Capacitor] Initialization complete");
  } catch (error) {
    console.error("[Capacitor] Initialization error:", error);
    initializationError = error as Error;
    // Still mark as initialized to prevent retries
    isInitialized = true;
  }
};

/**
 * Get initialization error if any
 */
export const getInitError = (): Error | null => initializationError;

/**
 * Check if Capacitor is initialized
 */
export const isCapacitorInitialized = (): boolean => isInitialized;

/**
 * Safe wrapper for Capacitor plugin calls
 */
export const safeCapacitorCall = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  if (!isNative()) return fallback;

  try {
    return await fn();
  } catch (error) {
    console.warn("[Capacitor] Plugin call failed:", error);
    return fallback;
  }
};

export default {
  isNative,
  getPlatform,
  hideSplashScreen,
  initializeCapacitor,
  isCapacitorInitialized,
  getInitError,
  safeCapacitorCall,
};
