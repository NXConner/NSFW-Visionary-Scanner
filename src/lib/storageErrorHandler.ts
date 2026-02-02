// Storage error handling and management utility
import { logger } from "./logger";
import { toast } from "sonner";

export enum StorageErrorType {
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
  NO_SPACE = "NO_SPACE",
  ACCESS_DENIED = "ACCESS_DENIED",
  UNKNOWN = "UNKNOWN",
}

export interface StorageError {
  type: StorageErrorType;
  message: string;
  originalError?: Error;
}

// Detect storage error type
export const detectStorageError = (error: any): StorageError => {
  const errorMessage = error?.message || error?.toString() || "";
  const errorName = error?.name || "";

  // Check for quota exceeded errors
  if (
    errorName === "QuotaExceededError" ||
    errorName === "NS_ERROR_DOM_QUOTA_REACHED" ||
    errorMessage.includes("QUOTA_EXCEEDED") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("FILE_ERROR_NO_SPACE")
  ) {
    return {
      type: StorageErrorType.QUOTA_EXCEEDED,
      message: "Storage quota exceeded. Please free up some space.",
      originalError: error instanceof Error ? error : new Error(errorMessage),
    };
  }

  // Check for no space errors
  if (errorMessage.includes("FILE_ERROR_NO_SPACE") || errorMessage.includes("NO_SPACE")) {
    return {
      type: StorageErrorType.NO_SPACE,
      message: "No storage space available. Clearing old data...",
      originalError: error instanceof Error ? error : new Error(errorMessage),
    };
  }

  // Check for access denied errors
  if (
    errorName === "SecurityError" ||
    errorMessage.includes("ACCESS_DENIED") ||
    errorMessage.includes("permission")
  ) {
    return {
      type: StorageErrorType.ACCESS_DENIED,
      message: "Storage access denied. Please check browser permissions.",
      originalError: error instanceof Error ? error : new Error(errorMessage),
    };
  }

  return {
    type: StorageErrorType.UNKNOWN,
    message: "Storage operation failed. Please try again.",
    originalError: error instanceof Error ? error : new Error(errorMessage),
  };
};

// Get storage usage estimate
export const getStorageUsage = (): { used: number; quota: number; percentage: number } => {
  try {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      // Modern browsers support storage.estimate()
      navigator.storage
        .estimate()
        .then(estimate => {
          const used = estimate.usage || 0;
          const quota = estimate.quota || 0;
          const percentage = quota > 0 ? (used / quota) * 100 : 0;

          logger.info("Storage usage", {
            component: "storage",
            used: `${(used / 1024 / 1024).toFixed(2)} MB`,
            quota: `${(quota / 1024 / 1024).toFixed(2)} MB`,
            percentage: `${percentage.toFixed(2)}%`,
          });

          return { used, quota, percentage };
        })
        .catch(() => {
          // Fallback if estimate fails
          return { used: 0, quota: 0, percentage: 0 };
        });
    }
  } catch (error) {
    logger.warn("Failed to get storage usage", { error });
  }

  return { used: 0, quota: 0, percentage: 0 };
};

// Clean up old localStorage data
export const cleanupOldStorage = (): { removed: number; freed: number } => {
  let removed = 0;
  let freed = 0;

  try {
    // Check if localStorage is available
    if (typeof localStorage === "undefined") return { removed, freed };
    const testKey = "__cleanup_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);

    const keys = Object.keys(localStorage);
    const now = Date.now();
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days

    keys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (!value) return;

        // Try to parse as JSON to check for timestamp
        try {
          const parsed = JSON.parse(value);
          if (parsed.timestamp && now - parsed.timestamp > maxAge) {
            const size = new Blob([value]).size;
            localStorage.removeItem(key);
            removed++;
            freed += size;
          }
        } catch {
          // Not JSON, check if it's a cache key
          if (key.includes("cache") || key.includes("temp") || key.includes("_old")) {
            const size = new Blob([value]).size;
            localStorage.removeItem(key);
            removed++;
            freed += size;
          }
        }
      } catch (error) {
        logger.warn("Error cleaning up storage key", { key, error });
      }
    });

    logger.info("Storage cleanup completed", {
      component: "storage",
      removed,
      freed: `${(freed / 1024).toFixed(2)} KB`,
    });
  } catch (error) {
    logger.error("Storage cleanup failed", { error });
  }

  return { removed, freed };
};

// Clear non-essential storage
export const clearNonEssentialStorage = (): void => {
  try {
    // Check if localStorage is available
    if (typeof localStorage === "undefined") return;
    const testKey = "__clear_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);

    const essentialKeys = [
      "user_id",
      "user_roles",
      "auth_token",
      "morphoscan_scans_encrypted",
      "morphoscan_diary_encrypted",
      "morphoscan_secure_",
    ];

    const keys = Object.keys(localStorage);
    let cleared = 0;

    keys.forEach(key => {
      const isEssential = essentialKeys.some(
        essential => key.startsWith(essential) || key === essential,
      );

      if (!isEssential) {
        try {
          localStorage.removeItem(key);
          cleared++;
        } catch (error) {
          logger.warn("Failed to remove storage key", { key, error });
        }
      }
    });

    logger.info("Cleared non-essential storage", {
      component: "storage",
      cleared,
    });

    toast.success(`Cleared ${cleared} non-essential items`);
  } catch (error) {
    logger.error("Failed to clear non-essential storage", { error });
    toast.error("Failed to clear storage");
  }
};

// Check if localStorage is available and accessible
const isLocalStorageAvailable = (): boolean => {
  try {
    if (typeof localStorage === "undefined") return false;
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// Safe localStorage wrapper with error handling
export const safeLocalStorage = {
  getItem(key: string): string | null {
    if (!isLocalStorageAvailable()) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      const storageError = detectStorageError(error);
      logger.error("localStorage.getItem failed", {
        component: "storage",
        key,
        error: storageError,
      });
      return null;
    }
  },

  setItem(key: string, value: string): boolean {
    if (!isLocalStorageAvailable()) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      const storageError = detectStorageError(error);

      logger.error("localStorage.setItem failed", {
        component: "storage",
        key,
        error: storageError,
      });

      // Handle quota exceeded
      if (
        storageError.type === StorageErrorType.QUOTA_EXCEEDED ||
        storageError.type === StorageErrorType.NO_SPACE
      ) {
        // Try to clean up and retry
        cleanupOldStorage();
        clearNonEssentialStorage();

        try {
          localStorage.setItem(key, value);
          toast.success("Storage space freed. Data saved successfully.");
          return true;
        } catch (retryError) {
          toast.error("Storage is full. Please clear browser data or upgrade your plan.");
          return false;
        }
      }

      // Show user-friendly error
      if (storageError.type === StorageErrorType.ACCESS_DENIED) {
        toast.error("Storage access denied. Please check browser settings.");
      } else {
        toast.error(storageError.message);
      }

      return false;
    }
  },

  removeItem(key: string): boolean {
    if (!isLocalStorageAvailable()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      const storageError = detectStorageError(error);
      logger.error("localStorage.removeItem failed", {
        component: "storage",
        key,
        error: storageError,
      });
      return false;
    }
  },

  clear(): boolean {
    if (!isLocalStorageAvailable()) return false;
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      const storageError = detectStorageError(error);
      logger.error("localStorage.clear failed", {
        component: "storage",
        error: storageError,
      });
      return false;
    }
  },
};

// Monitor storage and warn when approaching limit
export const monitorStorage = (): void => {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    navigator.storage
      .estimate()
      .then(estimate => {
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (used / quota) * 100 : 0;

        // Warn at 80% usage
        if (percentage > 80 && percentage < 95) {
          toast.warning("Storage is getting full. Consider clearing old data.", {
            duration: 5000,
          });
          logger.warn("Storage usage high", {
            component: "storage",
            percentage: `${percentage.toFixed(2)}%`,
          });
        }

        // Critical at 95% usage
        if (percentage > 95) {
          toast.error("Storage is almost full! Clearing old data...", {
            duration: 7000,
          });
          cleanupOldStorage();
          clearNonEssentialStorage();
        }
      })
      .catch(error => {
        logger.warn("Storage monitoring failed", { error });
      });
  }
};

// Initialize storage monitoring
export const initStorageMonitoring = (): void => {
  // Monitor on load
  monitorStorage();

  // Monitor every 5 minutes
  setInterval(monitorStorage, 5 * 60 * 1000);

  // Monitor before unload
  window.addEventListener("beforeunload", () => {
    monitorStorage();
  });
};
