import { useState, useEffect, useCallback } from "react";
import { encryptData, decryptData, isEncrypted } from "@/lib/encryption";
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

const SCANS_KEY = "morphoscan_scans_encrypted";
const DIARY_KEY = "morphoscan_diary_encrypted";
const LEGACY_SCANS_KEY = "morphoscan_scans";
const LEGACY_DIARY_KEY = "morphoscan_diary";

// Check if localStorage is available
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export const useEncryptedStorage = () => {
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load and decrypt data on mount
  useEffect(() => {
    const loadData = async () => {
      // Skip if localStorage is not available
      if (!isLocalStorageAvailable()) {
        setIsLoading(false);
        return;
      }

      try {
        // Try to load encrypted data first
        let savedScans = localStorage.getItem(SCANS_KEY);
        let savedDiary = localStorage.getItem(DIARY_KEY);

        // Migrate legacy unencrypted data if exists
        const legacyScans = localStorage.getItem(LEGACY_SCANS_KEY);
        const legacyDiary = localStorage.getItem(LEGACY_DIARY_KEY);

        if (legacyScans && !savedScans) {
          // Migrate and encrypt legacy data
          const encrypted = await encryptData(legacyScans);
          localStorage.setItem(SCANS_KEY, encrypted);
          localStorage.removeItem(LEGACY_SCANS_KEY);
          savedScans = encrypted;
        }

        if (legacyDiary && !savedDiary) {
          const encrypted = await encryptData(legacyDiary);
          localStorage.setItem(DIARY_KEY, encrypted);
          localStorage.removeItem(LEGACY_DIARY_KEY);
          savedDiary = encrypted;
        }

        // Decrypt and load data
        if (savedScans) {
          const decrypted = await decryptData(savedScans);
          if (decrypted) setScans(JSON.parse(decrypted));
        }

        if (savedDiary) {
          const decrypted = await decryptData(savedDiary);
          if (decrypted) setDiaryEntries(JSON.parse(decrypted));
        }
      } catch (error) {
        // Error silently handled
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const saveEncryptedScans = useCallback(async (data: ScanEntry[]) => {
    if (!isLocalStorageAvailable()) return;
    try {
      const encrypted = await encryptData(JSON.stringify(data));
      localStorage.setItem(SCANS_KEY, encrypted);
    } catch (error) {
      // Error silently handled
    }
  }, []);

  const saveEncryptedDiary = useCallback(async (data: DiaryEntry[]) => {
    if (!isLocalStorageAvailable()) return;
    try {
      const encrypted = await encryptData(JSON.stringify(data));
      localStorage.setItem(DIARY_KEY, encrypted);
    } catch (error) {
      // Error silently handled
    }
  }, []);

  const saveScan = useCallback(
    async (scan: Omit<ScanEntry, "id" | "created_at">) => {
      const newScan: ScanEntry = {
        ...scan,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };

      setScans(prev => {
        const updated = [newScan, ...prev];
        saveEncryptedScans(updated);
        return updated;
      });

      return newScan;
    },
    [saveEncryptedScans],
  );

  const deleteScan = useCallback(
    async (id: string) => {
      setScans(prev => {
        const updated = prev.filter(s => s.id !== id);
        saveEncryptedScans(updated);
        return updated;
      });
    },
    [saveEncryptedScans],
  );

  const saveDiaryEntry = useCallback(
    async (entry: Omit<DiaryEntry, "id" | "created_at">) => {
      const newEntry: DiaryEntry = {
        ...entry,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };

      setDiaryEntries(prev => {
        const updated = [newEntry, ...prev];
        saveEncryptedDiary(updated);
        return updated;
      });

      return newEntry;
    },
    [saveEncryptedDiary],
  );

  const deleteDiaryEntry = useCallback(
    async (id: string) => {
      setDiaryEntries(prev => {
        const updated = prev.filter(e => e.id !== id);
        saveEncryptedDiary(updated);
        return updated;
      });
    },
    [saveEncryptedDiary],
  );

  const clearAllData = useCallback(() => {
    if (isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(SCANS_KEY);
        localStorage.removeItem(DIARY_KEY);
        localStorage.removeItem(LEGACY_SCANS_KEY);
        localStorage.removeItem(LEGACY_DIARY_KEY);
      } catch {
        // Ignore errors
      }
    }
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

  const importData = useCallback(
    async (data: { scans: ScanEntry[]; diaryEntries: DiaryEntry[] }) => {
      if (data.scans) {
        setScans(data.scans);
        await saveEncryptedScans(data.scans);
      }
      if (data.diaryEntries) {
        setDiaryEntries(data.diaryEntries);
        await saveEncryptedDiary(data.diaryEntries);
      }
    },
    [saveEncryptedScans, saveEncryptedDiary],
  );

  return {
    scans,
    diaryEntries,
    isLoading,
    saveScan,
    deleteScan,
    saveDiaryEntry,
    deleteDiaryEntry,
    clearAllData,
    exportData,
    importData,
  };
};
