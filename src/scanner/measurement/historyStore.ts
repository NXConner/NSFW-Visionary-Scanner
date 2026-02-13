import type { MeasurementResult } from "./types";

const KEY = "scanner_measurement_history_v1";

export interface MeasurementHistoryEntry {
  id: string;
  createdAt: string;
  result: MeasurementResult["export"]["outputs"];
  annotatedImageDataUrl?: string;
}

export function readMeasurementHistory(): MeasurementHistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as MeasurementHistoryEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeMeasurementHistory(entries: MeasurementHistoryEntry[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, 50)));
  } catch {
    // ignore
  }
}

export function addToMeasurementHistory(
  entry: Omit<MeasurementHistoryEntry, "id" | "createdAt">,
): void {
  const next: MeasurementHistoryEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry,
  };
  const prev = readMeasurementHistory();
  writeMeasurementHistory([next, ...prev]);
}
