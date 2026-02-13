import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SyncQueueItem {
  id: string;
  table: string;
  operation: "insert" | "update" | "delete";
  data: Record<string, unknown>;
  timestamp: string;
  retries: number;
  lastError?: string;
  nextRetryAt?: string;
}

interface SyncStats {
  totalSynced: number;
  totalFailed: number;
  lastSyncAt: string | null;
}

const SYNC_QUEUE_KEY = "offline_sync_queue";
const SYNC_STATS_KEY = "offline_sync_stats";
const MAX_RETRIES = 5;
const BASE_RETRY_DELAY = 1000; // 1 second

function readQueueFromStorage(): SyncQueueItem[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as SyncQueueItem[]) : [];
  } catch {
    return [];
  }
}

function filterReady(queue: SyncQueueItem[]): SyncQueueItem[] {
  return queue.filter(item => {
    if (!item?.nextRetryAt) return true;
    return new Date(item.nextRetryAt) <= new Date();
  });
}

function readStatsFromStorage(): SyncStats {
  try {
    if (typeof localStorage === "undefined") {
      return { totalSynced: 0, totalFailed: 0, lastSyncAt: null };
    }
    const stored = localStorage.getItem(SYNC_STATS_KEY);
    if (!stored) return { totalSynced: 0, totalFailed: 0, lastSyncAt: null };
    const parsed = JSON.parse(stored) as Partial<SyncStats> | null;
    return {
      totalSynced: Number(parsed?.totalSynced ?? 0) || 0,
      totalFailed: Number(parsed?.totalFailed ?? 0) || 0,
      lastSyncAt: typeof parsed?.lastSyncAt === "string" ? parsed.lastSyncAt : null,
    };
  } catch {
    return { totalSynced: 0, totalFailed: 0, lastSyncAt: null };
  }
}

export const useOfflineSync = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(() => readQueueFromStorage().length);
  const [syncStats, setSyncStats] = useState<SyncStats>(() => readStatsFromStorage());
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load queue from localStorage
  const getQueue = useCallback((): SyncQueueItem[] => {
    return filterReady(readQueueFromStorage());
  }, []);

  // Get full queue including items waiting for retry
  const getFullQueue = useCallback((): SyncQueueItem[] => {
    return readQueueFromStorage();
  }, []);

  // Load stats
  const loadStats = useCallback((): SyncStats => {
    return readStatsFromStorage();
  }, []);

  // Save stats
  const saveStats = useCallback((stats: SyncStats) => {
    try {
      localStorage.setItem(SYNC_STATS_KEY, JSON.stringify(stats));
      setSyncStats(stats);
    } catch (_error) {
      // Error silently handled
    }
  }, []);

  // Save queue to localStorage
  const saveQueue = useCallback((queue: SyncQueueItem[]) => {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      setPendingCount(queue.length);
    } catch (_error) {
      // Error silently handled
    }
  }, []);

  // Calculate exponential backoff delay
  const getRetryDelay = (retries: number): number => {
    return Math.min(BASE_RETRY_DELAY * Math.pow(2, retries), 60000); // Max 1 minute
  };

  // Add item to sync queue
  const queueOperation = useCallback(
    (table: string, operation: "insert" | "update" | "delete", data: Record<string, unknown>) => {
      const queue = getFullQueue(); // Use full queue to include waiting items
      const newItem: SyncQueueItem = {
        id: crypto.randomUUID(),
        table,
        operation,
        data,
        timestamp: new Date().toISOString(),
        retries: 0,
      };
      queue.push(newItem);
      saveQueue(queue);

      if (!isOnline) {
        toast.info("Saved offline - will sync when connected");
      }

      return newItem.id;
    },
    [getFullQueue, saveQueue, isOnline],
  );

  // Process a single queue item with detailed error handling
  const processQueueItem = useCallback(
    async (item: SyncQueueItem): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: "No authenticated user" };

      try {
        switch (item.operation) {
          case "insert": {
            const { error } = await supabase
              // Supabase types are generated; keep offline sync resilient for new tables.

              .from(item.table as any)
              .insert({ ...item.data, user_id: user.id });
            if (error) throw error;
            break;
          }
          case "update": {
            const { id, ...updateData } = item.data;
            const { error } = await supabase

              .from(item.table as any)
              .update(updateData)
              .eq("id", id as string)
              .eq("user_id", user.id);
            if (error) throw error;
            break;
          }
          case "delete": {
            const { error } = await supabase

              .from(item.table as any)
              .delete()
              .eq("id", item.data.id as string)
              .eq("user_id", user.id);
            if (error) throw error;
            break;
          }
        }
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: errorMessage };
      }
    },
    [user],
  );

  // Sync all pending items with exponential backoff
  const syncAll = useCallback(async () => {
    if (!isOnline || !user || isSyncing) return;

    setIsSyncing(true);
    const queue = getQueue();
    const fullQueue = getFullQueue();

    if (queue.length === 0) {
      setIsSyncing(false);
      return;
    }

    const remainingItems: SyncQueueItem[] = fullQueue.filter(
      item => !queue.find(q => q.id === item.id),
    );
    let successCount = 0;
    let failCount = 0;
    const stats = loadStats();

    for (const item of queue) {
      const result = await processQueueItem(item);

      if (result.success) {
        successCount++;
        stats.totalSynced++;
      } else {
        item.retries++;
        item.lastError = result.error;

        if (item.retries < MAX_RETRIES) {
          // Set next retry time with exponential backoff
          const delay = getRetryDelay(item.retries);
          item.nextRetryAt = new Date(Date.now() + delay).toISOString();
          remainingItems.push(item);
        } else {
          // Max retries reached - log as permanently failed
          stats.totalFailed++;
          failCount++;
        }
      }
    }

    stats.lastSyncAt = new Date().toISOString();
    saveStats(stats);
    saveQueue(remainingItems);

    if (successCount > 0) {
      toast.success(`Synced ${successCount} offline change${successCount > 1 ? "s" : ""}`);
    }

    if (failCount > 0) {
      toast.error(`${failCount} item${failCount > 1 ? "s" : ""} failed permanently`);
    }

    // Schedule retry for items with nextRetryAt
    const itemsToRetry = remainingItems.filter(item => item.nextRetryAt);
    // In unit tests, scheduled retries can fire outside act() and produce noisy warnings.
    // The queue state is still deterministic; tests explicitly call syncAll() when needed.
    const isTestEnv =
      Boolean((import.meta as any).env?.VITEST) ||
      String((import.meta as any).env?.MODE) === "test";

    if (itemsToRetry.length > 0 && !isTestEnv) {
      const nextRetryTime = Math.min(
        ...itemsToRetry.map(item => new Date(item.nextRetryAt!).getTime() - Date.now()),
      );

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      retryTimeoutRef.current = setTimeout(
        () => {
          if (isOnline && user) {
            syncAll();
          }
        },
        Math.max(nextRetryTime, 1000),
      );
    }

    setIsSyncing(false);
  }, [
    isOnline,
    user,
    isSyncing,
    getQueue,
    getFullQueue,
    saveQueue,
    loadStats,
    saveStats,
    processQueueItem,
  ]);

  // Clear the sync queue
  const clearQueue = useCallback(() => {
    localStorage.removeItem(SYNC_QUEUE_KEY);
    setPendingCount(0);
  }, []);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncAll();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncAll, getQueue]);

  // Auto-sync on mount if online and has pending items
  useEffect(() => {
    if (isOnline && user && pendingCount > 0) {
      syncAll();
    }
  }, [isOnline, pendingCount, syncAll, user]);

  // Get detailed queue status
  const getQueueStatus = useCallback(() => {
    const fullQueue = getFullQueue();
    return {
      total: fullQueue.length,
      ready: fullQueue.filter(item => !item.nextRetryAt || new Date(item.nextRetryAt) <= new Date())
        .length,
      waiting: fullQueue.filter(item => item.nextRetryAt && new Date(item.nextRetryAt) > new Date())
        .length,
      byTable: fullQueue.reduce(
        (acc, item) => {
          acc[item.table] = (acc[item.table] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }, [getFullQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncStats,
    queueOperation,
    syncAll,
    clearQueue,
    getQueueStatus,
  };
};
