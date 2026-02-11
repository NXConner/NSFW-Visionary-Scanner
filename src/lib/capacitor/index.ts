/**
 * Capacitor module exports
 */

export {
  isNative,
  getPlatform,
  hideSplashScreen,
  initializeCapacitor,
  isCapacitorInitialized,
  getInitError,
  safeCapacitorCall,
} from "./init";

export { installMobileErrorHandler, getErrorLog, clearErrorLog } from "./errorHandler";
