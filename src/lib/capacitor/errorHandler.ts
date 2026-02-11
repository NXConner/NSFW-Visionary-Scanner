/**
 * Mobile error handler for Capacitor apps
 * Catches and logs errors that may occur on mobile devices
 */

import { isNative, getPlatform } from "./init";

interface MobileError {
  message: string;
  stack?: string;
  platform: string;
  timestamp: number;
  isNative: boolean;
}

const errorLog: MobileError[] = [];
const MAX_ERROR_LOG = 50;

/**
 * Log an error for mobile debugging
 */
const logError = (error: Error | string): void => {
  const errorObj: MobileError = {
    message: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    platform: getPlatform(),
    timestamp: Date.now(),
    isNative: isNative(),
  };

  errorLog.push(errorObj);

  // Keep log size manageable
  if (errorLog.length > MAX_ERROR_LOG) {
    errorLog.shift();
  }

  console.error("[MobileError]", errorObj);
};

/**
 * Get the error log for debugging
 */
export const getErrorLog = (): MobileError[] => [...errorLog];

/**
 * Clear the error log
 */
export const clearErrorLog = (): void => {
  errorLog.length = 0;
};

/**
 * Install global error handlers for mobile
 */
export const installMobileErrorHandler = (): void => {
  // Global error handler
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    logError(error || String(message));
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Unhandled promise rejection handler
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = event => {
    logError(event.reason instanceof Error ? event.reason : String(event.reason));
    if (originalOnUnhandledRejection) {
      return originalOnUnhandledRejection.call(window, event);
    }
  };

  console.log("[MobileErrorHandler] Installed global error handlers");
};

export default {
  logError,
  getErrorLog,
  clearErrorLog,
  installMobileErrorHandler,
};
