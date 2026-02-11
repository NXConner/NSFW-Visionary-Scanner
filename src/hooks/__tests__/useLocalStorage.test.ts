import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../useLocalStorage";

// Mock safeLocalStorage
vi.mock("@/lib/storageErrorHandler", () => ({
  safeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

import { safeLocalStorage } from "@/lib/storageErrorHandler";

describe("useLocalStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (safeLocalStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it("initializes with empty arrays when localStorage is empty", () => {
    const { result } = renderHook(() => useLocalStorage());

    expect(result.current.scans).toEqual([]);
    expect(result.current.diaryEntries).toEqual([]);
  });

  it("loads saved scans from localStorage", () => {
    const savedScans = [
      {
        id: "test-1",
        created_at: "2025-01-01T00:00:00Z",
        scan_type: "flaccid",
        length: 5,
        circumference: 4,
        curvature_angle: 0,
        curvature_direction: "none",
        image_data: null,
        notes: null,
      },
    ];
    (safeLocalStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === "morphoscan_scans") return JSON.stringify(savedScans);
      return null;
    });

    const { result } = renderHook(() => useLocalStorage());

    expect(result.current.scans).toEqual(savedScans);
  });

  it("saves a new scan", () => {
    const { result } = renderHook(() => useLocalStorage());

    const newScan = {
      scan_type: "erect",
      length: 6,
      circumference: 5,
      curvature_angle: 10,
      curvature_direction: "left",
      image_data: null,
      notes: "Test scan",
    };

    let savedScan: any;
    act(() => {
      savedScan = result.current.saveScan(newScan);
    });

    expect(savedScan).toMatchObject(newScan);
    expect(savedScan.id).toBeDefined();
    expect(savedScan.created_at).toBeDefined();
    expect(result.current.scans).toHaveLength(1);
    expect(safeLocalStorage.setItem).toHaveBeenCalled();
  });

  it("deletes a scan", () => {
    const savedScans = [
      {
        id: "test-1",
        created_at: "2025-01-01T00:00:00Z",
        scan_type: "flaccid",
        length: 5,
        circumference: 4,
        curvature_angle: 0,
        curvature_direction: "none",
        image_data: null,
        notes: null,
      },
    ];
    (safeLocalStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === "morphoscan_scans") return JSON.stringify(savedScans);
      return null;
    });

    const { result } = renderHook(() => useLocalStorage());

    act(() => {
      result.current.deleteScan("test-1");
    });

    expect(result.current.scans).toHaveLength(0);
    expect(safeLocalStorage.setItem).toHaveBeenCalled();
  });

  it("saves a diary entry", () => {
    const { result } = renderHook(() => useLocalStorage());

    const newEntry = {
      entry_date: "2025-01-01",
      length: 5,
      circumference: 4,
      curvature_angle: null,
      curvature_direction: null,
      pain_level: 0,
      symptoms: [],
      notes: "Test entry",
    };

    let savedEntry: any;
    act(() => {
      savedEntry = result.current.saveDiaryEntry(newEntry);
    });

    expect(savedEntry).toMatchObject(newEntry);
    expect(savedEntry.id).toBeDefined();
    expect(result.current.diaryEntries).toHaveLength(1);
  });

  it("clears all data", () => {
    const { result } = renderHook(() => useLocalStorage());

    // Add some data first
    act(() => {
      result.current.saveScan({
        scan_type: "test",
        length: 5,
        circumference: 4,
        curvature_angle: 0,
        curvature_direction: "none",
        image_data: null,
        notes: null,
      });
    });

    act(() => {
      result.current.clearAllData();
    });

    expect(result.current.scans).toEqual([]);
    expect(result.current.diaryEntries).toEqual([]);
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith("morphoscan_scans");
    expect(safeLocalStorage.removeItem).toHaveBeenCalledWith("morphoscan_diary");
  });

  it("exports data correctly", () => {
    const { result } = renderHook(() => useLocalStorage());

    act(() => {
      result.current.saveScan({
        scan_type: "test",
        length: 5,
        circumference: 4,
        curvature_angle: 0,
        curvature_direction: "none",
        image_data: null,
        notes: null,
      });
    });

    const exported = result.current.exportData();

    expect(exported.scans).toHaveLength(1);
    expect(exported.diaryEntries).toEqual([]);
    expect(exported.exportedAt).toBeDefined();
  });

  it("imports data correctly", () => {
    const { result } = renderHook(() => useLocalStorage());

    const importedData = {
      scans: [
        {
          id: "imported-1",
          created_at: "2025-01-01T00:00:00Z",
          scan_type: "flaccid",
          length: 5,
          circumference: 4,
          curvature_angle: 0,
          curvature_direction: "none",
          image_data: null,
          notes: null,
        },
      ],
      diaryEntries: [],
    };

    act(() => {
      result.current.importData(importedData);
    });

    expect(result.current.scans).toEqual(importedData.scans);
    expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
      "morphoscan_scans",
      JSON.stringify(importedData.scans),
    );
  });
});
