import { decryptData, encryptData } from "@/lib/encryption";

export type CurvatureSettings = {
  /** When true, store annotated images inside saved sessions (encrypted, local-only). */
  storeAnnotatedImages: boolean;
  /**
   * Interpretation corrections for camera mirroring/orientation.
   * These only affect direction labels (left/right, dorsal/ventral), not angles.
   */
  flipTopViewLeftRight: boolean;
  flipSideViewDorsalVentral: boolean;
};

const KEY = "morphoscan_curvature_settings_encrypted";

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const testKey = "__storage_test_curv_settings__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export async function loadCurvatureSettings(): Promise<CurvatureSettings> {
  if (!isLocalStorageAvailable())
    return {
      storeAnnotatedImages: false,
      flipTopViewLeftRight: false,
      flipSideViewDorsalVentral: false,
    };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw)
      return {
        storeAnnotatedImages: false,
        flipTopViewLeftRight: false,
        flipSideViewDorsalVentral: false,
      };
    const decrypted = await decryptData(raw);
    if (!decrypted)
      return {
        storeAnnotatedImages: false,
        flipTopViewLeftRight: false,
        flipSideViewDorsalVentral: false,
      };
    const parsed = JSON.parse(decrypted) as Partial<CurvatureSettings>;
    return {
      storeAnnotatedImages: Boolean(parsed.storeAnnotatedImages),
      flipTopViewLeftRight: Boolean(parsed.flipTopViewLeftRight),
      flipSideViewDorsalVentral: Boolean(parsed.flipSideViewDorsalVentral),
    };
  } catch {
    return {
      storeAnnotatedImages: false,
      flipTopViewLeftRight: false,
      flipSideViewDorsalVentral: false,
    };
  }
}

export async function saveCurvatureSettings(settings: CurvatureSettings): Promise<void> {
  if (!isLocalStorageAvailable()) return;
  try {
    const encrypted = await encryptData(JSON.stringify(settings));
    localStorage.setItem(KEY, encrypted);
  } catch {
    // ignore
  }
}
