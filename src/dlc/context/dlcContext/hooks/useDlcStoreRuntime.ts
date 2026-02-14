import { useCallback, useEffect, useState } from "react";

import { dlcManager } from "@/dlc/core";
import type { DLCStoreState, DLCUpdate } from "@/dlc/core/types";
import { logger } from "@/lib/logger";

export function useDlcStoreRuntime(): {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  storeState: DLCStoreState | null;
  availableUpdates: DLCUpdate[];
  refreshStore: () => Promise<void>;
  checkForUpdates: () => Promise<DLCUpdate[]>;
} {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeState, setStoreState] = useState<DLCStoreState | null>(null);
  const [availableUpdates, setAvailableUpdates] = useState<DLCUpdate[]>([]);

  const checkForUpdates = useCallback(async (): Promise<DLCUpdate[]> => {
    const updates = await dlcManager.checkForUpdates();
    setAvailableUpdates(updates);
    return updates;
  }, []);

  const refreshStore = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setStoreState(dlcManager.getStoreState());
      await checkForUpdates();
    } catch (err) {
      logger.error("[dlc] Refresh failed", err);
    } finally {
      setIsLoading(false);
    }
  }, [checkForUpdates]);

  // Initialize DLC Manager. Fail-open: show registry/cache immediately and update later.
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const initPromise = dlcManager.initialize();

        // First paint from whatever is available right now (registry/cache).
        setStoreState(dlcManager.getStoreState());

        void initPromise
          .then(() => {
            if (cancelled) return;
            setStoreState(dlcManager.getStoreState());
          })
          .catch(err => {
            // DLCManager already fails open; keep UI alive but log for diagnostics.
            logger.warn("[dlc] Init failed (non-fatal)", {
              error: err instanceof Error ? err.message : String(err),
            });
          });

        if (cancelled) return;
        setIsInitialized(true);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "DLC init failed");
        // Still mark initialized to prevent blocking
        setIsInitialized(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
    storeState,
    availableUpdates,
    refreshStore,
    checkForUpdates,
  };
}
