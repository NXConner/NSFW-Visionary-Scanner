import { defaultScannerSettings, type ScannerSettings } from "@/components/scannerOverlays/types";

const KEY = "scanner_settings_v1";

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function loadScannerSettings(): ScannerSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultScannerSettings;
    const parsed = safeParse(raw);
    if (!parsed || typeof parsed !== "object") return defaultScannerSettings;

    // Merge onto defaults to handle forward-compatible new keys.
    return { ...defaultScannerSettings, ...(parsed as Partial<ScannerSettings>) };
  } catch {
    return defaultScannerSettings;
  }
}

export function saveScannerSettings(next: ScannerSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function resetScannerSettings(): ScannerSettings {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  return defaultScannerSettings;
}
