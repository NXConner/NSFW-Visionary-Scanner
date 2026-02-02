import { useState, useEffect, useCallback } from "react";
import { safeLocalStorage } from "@/lib/storageErrorHandler";
import type { MeasurementContext } from "@/lib/growersVsShowers";

export interface ScanEntry {
  id: string;
  created_at: string;
  scan_type: string;
  length: number;
  circumference: number;
  // Optional paired measurements and context (used by Growers vs Showers and advanced analytics)
  erect_length?: number | null;
  erect_circumference?: number | null;
  measurement_context?: MeasurementContext;
  curvature_angle: number;
  curvature_direction: string;
  image_data: string | null;
  notes: string | null;
  /**
   * Optional content classification metadata (saved only if user opts-in).
   * Never includes the image itself.
   */
  content_classification?: { label: string; confidence: number; model: string } | null;
}

export interface DiaryEntry {
  id: string;
  entry_date: string;
  length: number | null;
  circumference: number | null;
  curvature_angle: number | null;
  curvature_direction: string | null;
  pain_level: number | null;
  symptoms: string[];
  notes: string | null;
  created_at: string;
}

const SCANS_KEY = "morphoscan_scans";
const DIARY_KEY = "morphoscan_diary";

export const useLocalStorage = () => {
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    try {
      const savedScans = safeLocalStorage.getItem(SCANS_KEY);
      const savedDiary = safeLocalStorage.getItem(DIARY_KEY);

      if (savedScans) setScans(JSON.parse(savedScans));
      if (savedDiary) setDiaryEntries(JSON.parse(savedDiary));
    } catch (error) {
      // Error silently handled
    }
  }, []);

  const saveScan = useCallback((scan: Omit<ScanEntry, "id" | "created_at">) => {
    const newScan: ScanEntry = {
      ...scan,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    setScans(prev => {
      const updated = [newScan, ...prev];
      safeLocalStorage.setItem(SCANS_KEY, JSON.stringify(updated));
      return updated;
    });

    return newScan;
  }, []);

  const deleteScan = useCallback((id: string) => {
    setScans(prev => {
      const updated = prev.filter(s => s.id !== id);
      safeLocalStorage.setItem(SCANS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const saveDiaryEntry = useCallback((entry: Omit<DiaryEntry, "id" | "created_at">) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    setDiaryEntries(prev => {
      const updated = [newEntry, ...prev];
      safeLocalStorage.setItem(DIARY_KEY, JSON.stringify(updated));
      return updated;
    });

    return newEntry;
  }, []);

  const deleteDiaryEntry = useCallback((id: string) => {
    setDiaryEntries(prev => {
      const updated = prev.filter(e => e.id !== id);
      safeLocalStorage.setItem(DIARY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAllData = useCallback(() => {
    safeLocalStorage.removeItem(SCANS_KEY);
    safeLocalStorage.removeItem(DIARY_KEY);
    setScans([]);
    setDiaryEntries([]);
  }, []);

  const exportData = useCallback(() => {
    return {
      scans,
      diaryEntries,
      exportedAt: new Date().toISOString(),
    };
  }, [scans, diaryEntries]);

  const importData = useCallback((data: { scans: ScanEntry[]; diaryEntries: DiaryEntry[] }) => {
    if (data.scans) {
      setScans(data.scans);
      safeLocalStorage.setItem(SCANS_KEY, JSON.stringify(data.scans));
    }
    if (data.diaryEntries) {
      setDiaryEntries(data.diaryEntries);
      safeLocalStorage.setItem(DIARY_KEY, JSON.stringify(data.diaryEntries));
    }
  }, []);

  return {
    scans,
    diaryEntries,
    saveScan,
    deleteScan,
    saveDiaryEntry,
    deleteDiaryEntry,
    clearAllData,
    exportData,
    importData,
  };
};
