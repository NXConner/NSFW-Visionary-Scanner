import { decryptData, encryptData, isEncrypted } from "@/lib/encryption";

export type LastScanSnapshot = {
  schemaVersion: 1;
  createdAt: string;
  annotatedImageDataUrl?: string | null;
  rawImageDataUrl?: string | null;
  measurements: {
    lengthCm?: number | null;
    circumferenceCm?: number | null;
    curvatureAngleDeg?: number | null;
    curvatureDirection?: string | null;
    confidence?: number | null;
  };
  calibration?: {
    pixelsPerMm?: number;
    calibrationConfidence?: number;
    skewPercent?: number;
  } | null;
};

const KEY = "scanner_last_scan_encrypted_v1";

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function saveLastScanSnapshot(snapshot: LastScanSnapshot): Promise<void> {
  try {
    const encrypted = await encryptData(JSON.stringify(snapshot));
    localStorage.setItem(KEY, encrypted);
  } catch {
    // ignore
  }
}

export async function loadLastScanSnapshot(): Promise<LastScanSnapshot | null> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const decoded = isEncrypted(raw) ? await decryptData(raw) : raw;
    if (!decoded) return null;
    const parsed = safeParse<LastScanSnapshot>(decoded);
    if (!parsed || parsed.schemaVersion !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearLastScanSnapshot(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
