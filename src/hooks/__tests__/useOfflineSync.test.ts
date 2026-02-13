import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useOfflineSync } from "../useOfflineSync";
import { supabase } from "@/integrations/supabase/client";
import * as AuthContext from "@/contexts/AuthContext";

// Mock dependencies
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useOfflineSync", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.invalid",
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset mocks
    vi.clearAllMocks();

    // Mock navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });

    // Mock useAuth
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateEmail: vi.fn(),
      updatePassword: vi.fn(),
      resetPassword: vi.fn(),
      verifyEmail: vi.fn(),
    } as any);

    // Mock supabase operations
    const mockSupabaseOp = {
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseOp as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with online status", () => {
    const { result } = renderHook(() => useOfflineSync());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.pendingCount).toBe(0);
  });

  it("should initialize with offline status when navigator is offline", () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOfflineSync());

    expect(result.current.isOnline).toBe(false);
  });

  it("should queue operations when offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.queueOperation("scans", "insert", { name: "Test Scan" });
    });

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(1);
    });
  });

  it("should return operation ID when queueing", () => {
    const { result } = renderHook(() => useOfflineSync());

    let operationId: string = "";
    act(() => {
      operationId = result.current.queueOperation("scans", "insert", { name: "Test" });
    });

    expect(operationId).toBeTruthy();
    expect(typeof operationId).toBe("string");
  });

  it("should store queued operations in localStorage", () => {
    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.queueOperation("scans", "insert", { name: "Test" });
    });

    const stored = localStorage.getItem("offline_sync_queue");
    expect(stored).toBeTruthy();

    const queue = JSON.parse(stored!);
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe("scans");
    expect(queue[0].operation).toBe("insert");
  });

  it("should clear queue", () => {
    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.queueOperation("scans", "insert", { name: "Test" });
    });

    act(() => {
      result.current.clearQueue();
    });

    expect(result.current.pendingCount).toBe(0);
    expect(localStorage.getItem("offline_sync_queue")).toBeNull();
  });

  it("should get queue status", () => {
    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.queueOperation("scans", "insert", { name: "Test 1" });
      result.current.queueOperation("health_diary_entries", "insert", { notes: "Test 2" });
      result.current.queueOperation("scans", "update", { id: "1", name: "Updated" });
    });

    const status = result.current.getQueueStatus();

    expect(status.total).toBe(3);
    expect(status.ready).toBe(3);
    expect(status.waiting).toBe(0);
    expect(status.byTable).toEqual({
      scans: 2,
      health_diary_entries: 1,
    });
  });

  it("should sync operations when online", async () => {
    const { result } = renderHook(() => useOfflineSync());

    // Queue an operation
    act(() => {
      result.current.queueOperation("scans", "insert", { name: "Test Scan" });
    });

    // Sync
    await act(async () => {
      await result.current.syncAll();
    });

    await waitFor(() => {
      expect(result.current.pendingCount).toBe(0);
    });
  });

  it("should apply update operations during sync", async () => {
    const mockSupabaseOp = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseOp as any);

    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.queueOperation("scans", "update", { id: "scan-1", name: "Updated" });
    });

    await act(async () => {
      await result.current.syncAll();
    });

    expect(mockSupabaseOp.update).toHaveBeenCalledWith({ name: "Updated" });
  });

  it("should handle failed sync operations with retry", async () => {
    // Mock a failed operation
    const mockSupabaseOp = {
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Network error" },
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseOp as any);

    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.queueOperation("scans", "insert", { name: "Test" });
    });

    await act(async () => {
      await result.current.syncAll();
    });

    // Item should still be in queue (retrying)
    const stored = localStorage.getItem("offline_sync_queue");
    if (stored) {
      const queue = JSON.parse(stored);
      expect(queue.length).toBeGreaterThan(0);
      expect(queue[0].retries).toBe(1);
    }
  });

  it("should update sync stats", async () => {
    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.queueOperation("scans", "insert", { name: "Test" });
    });

    await act(async () => {
      await result.current.syncAll();
    });

    await waitFor(() => {
      expect(result.current.syncStats.totalSynced).toBeGreaterThan(0);
      expect(result.current.syncStats.lastSyncAt).toBeTruthy();
    });
  });

  it("should handle multiple queue operations", () => {
    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.queueOperation("scans", "insert", { name: "Scan 1" });
      result.current.queueOperation("scans", "insert", { name: "Scan 2" });
      result.current.queueOperation("health_diary_entries", "insert", { notes: "Entry 1" });
    });

    expect(result.current.pendingCount).toBe(3);
  });

  it("should handle update operations", async () => {
    const mockSupabaseOp = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    // Last eq call should return success
    mockSupabaseOp.eq
      .mockReturnValueOnce(mockSupabaseOp as any)
      .mockResolvedValue({ data: null, error: null });

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseOp as any);

    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.queueOperation("scans", "update", {
        id: "scan-123",
        name: "Updated Scan",
      });
    });

    await act(async () => {
      await result.current.syncAll();
    });

    expect(mockSupabaseOp.update).toHaveBeenCalled();
  });

  it("should handle delete operations", async () => {
    const mockSupabaseOp = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };

    // Last eq call should return success
    mockSupabaseOp.eq
      .mockReturnValueOnce(mockSupabaseOp as any)
      .mockResolvedValue({ data: null, error: null });

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseOp as any);

    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.queueOperation("scans", "delete", { id: "scan-123" });
    });

    await act(async () => {
      await result.current.syncAll();
    });

    expect(mockSupabaseOp.delete).toHaveBeenCalled();
  });

  it("should not sync when user is not authenticated", async () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      updateEmail: vi.fn(),
      updatePassword: vi.fn(),
      resetPassword: vi.fn(),
      verifyEmail: vi.fn(),
    } as any);

    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.queueOperation("scans", "insert", { name: "Test" });
    });

    await act(async () => {
      await result.current.syncAll();
    });

    // Queue should still have items
    expect(result.current.pendingCount).toBeGreaterThan(0);
  });

  it("should respond to online/offline events", async () => {
    const { result } = renderHook(() => useOfflineSync());

    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: false,
      });
      window.dispatchEvent(new Event("offline"));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(false);
    });

    // Simulate going back online
    act(() => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => {
      expect(result.current.isOnline).toBe(true);
    });
  });

  it("should permanently fail items after max retries", async () => {
    vi.useFakeTimers();
    // Mock persistent failure
    const mockSupabaseOp = {
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Persistent error" },
      }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockSupabaseOp as any);

    const { result } = renderHook(() => useOfflineSync());

    act(() => {
      result.current.queueOperation("scans", "insert", { name: "Test" });
    });

    try {
      // Sync multiple times to exhaust retries.
      // The hook uses exponential backoff with a minimum of 1000ms; advance time so items become eligible.
      for (let i = 0; i < 6; i++) {
        await act(async () => {
          await result.current.syncAll();
        });
        vi.advanceTimersByTime(60000);
      }

      expect(result.current.syncStats.totalFailed).toBeGreaterThan(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
