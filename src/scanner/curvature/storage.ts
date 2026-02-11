import { decryptData, encryptData } from "@/lib/encryption";
import type { CurvatureScanSession } from "./types";

const KEY = "morphoscan_curvature_sessions_encrypted";

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const testKey = "__storage_test_curv__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export async function loadCurvatureSessions(): Promise<CurvatureScanSession[]> {
  if (!isLocalStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const decrypted = await decryptData(raw);
    if (!decrypted) return [];
    const parsed = JSON.parse(decrypted) as CurvatureScanSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveCurvatureSessions(sessions: CurvatureScanSession[]): Promise<void> {
  if (!isLocalStorageAvailable()) return;
  try {
    const encrypted = await encryptData(JSON.stringify(sessions.slice(0, 100)));
    localStorage.setItem(KEY, encrypted);
  } catch {
    // ignore
  }
}
