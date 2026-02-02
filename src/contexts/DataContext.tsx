import { createContext, useContext, ReactNode } from "react";
import { useEncryptedStorage, ScanEntry, DiaryEntry } from "@/hooks/useEncryptedStorage";

interface DataContextType {
  scans: ScanEntry[];
  diaryEntries: DiaryEntry[];
  isLoading: boolean;
  saveScan: (scan: Omit<ScanEntry, "id" | "created_at">) => Promise<ScanEntry>;
  deleteScan: (id: string) => Promise<void>;
  saveDiaryEntry: (entry: Omit<DiaryEntry, "id" | "created_at">) => Promise<DiaryEntry>;
  deleteDiaryEntry: (id: string) => Promise<void>;
  clearAllData: () => void;
  exportData: () => { scans: ScanEntry[]; diaryEntries: DiaryEntry[]; exportedAt: string };
  importData: (data: { scans: ScanEntry[]; diaryEntries: DiaryEntry[] }) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const storage = useEncryptedStorage();

  return <DataContext.Provider value={storage}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};

export type { ScanEntry, DiaryEntry };
