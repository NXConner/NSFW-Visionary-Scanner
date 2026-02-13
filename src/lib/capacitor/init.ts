/**
 * Capacitor initialization module
 * Handles device-ready events, splash screen dismissal, and mobile-specific setup
 */

import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { logger } from "@/lib/logger";

// Track initialization state
let isInitialized = false;
let initializationError: Error | null = null;

/**
 * Capacitor global detection can occasionally race during very early boot on some
 * Android WebView builds. This fallback prevents startup logic from incorrectly
 * treating native runtime as web and leaving splash visible.
 */
const isLikelyNativeEnvironment = (): boolean => {
  try {
    if (Capacitor.isNativePlatform()) return true;
  } catch {
    // ignore and fall through to URL heuristic
  }

  try {
    const protocol = String(window.location.protocol || "").toLowerCase();
    const hostname = String(window.location.hostname || "").toLowerCase();
    return (
      protocol === "capacitor:" ||
      protocol === "file:" ||
      (protocol === "https:" && hostname === "localhost")
    );
  } catch {
    return false;
  }
};

/**
 * Check if running in a Capacitor native environment
 */
export const isNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    // Defensive fallback: treat URL heuristics as authoritative if Capacitor globals
    // race during very early boot on some Android WebView builds.
    return isLikelyNativeEnvironment();
  }
};

/**
 * Get the current platform (web, ios, android)
 */
export const getPlatform = (): "web" | "ios" | "android" => {
  try {
    return Capacitor.getPlatform() as "web" | "ios" | "android";
  } catch {
    return "web";
  }
};

/**
 * Hide the splash screen safely
 */
export const hideSplashScreen = async (): Promise<void> => {
  if (!isLikelyNativeEnvironment()) return;

  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
    if (import.meta.env.DEV) logger.debug("[cap] splash hidden");
  } catch (error) {
    logger.warn("[cap] failed to hide splash screen", { error });
    // Don't throw - app should continue even if splash fails
  }
};

/**
 * Configure the status bar for mobile
 */
const configureStatusBar = async (): Promise<void> => {
  if (!isLikelyNativeEnvironment()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0a0a0a" });
    if (import.meta.env.DEV) logger.debug("[cap] status bar configured");
  } catch (error) {
    logger.warn("[cap] failed to configure status bar", { error });
  }
};

/**
 * Initialize Capacitor for mobile environments
 * Should be called early in the app lifecycle
 */
export const initializeCapacitor = async (): Promise<void> => {
  if (isInitialized) {
    if (import.meta.env.DEV) logger.debug("[cap] already initialized");
    return;
  }

  const platform = getPlatform();
  logger.info("[cap] initializing", { platform });

  if (!isLikelyNativeEnvironment()) {
    if (import.meta.env.DEV) logger.debug("[cap] web platform (skip native init)");
    isInitialized = true;
    return;
  }

  try {
    // Configure status bar first
    await configureStatusBar();

    // Mark as initialized
    isInitialized = true;
    logger.info("[cap] initialization complete", { platform });
  } catch (error) {
    logger.error("[cap] initialization error", { error });
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
    logger.warn("[cap] plugin call failed", { error });
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
