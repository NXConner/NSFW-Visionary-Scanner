import { useEffect } from "react";

import {
  getCustomWallpaperBlob,
  setCustomWallpaperBlob,
  dataUrlToBlob,
} from "@/lib/wallpaperStorage";

import { CUSTOM_WALLPAPER_BLOB_SENTINEL, SETTINGS_KEY } from "../constants";
import { isLocalStorageAvailable } from "../localStorage";
import type { StoredSettings } from "../types";

export function useCustomWallpaperStorage(args: {
  persistSettings: (overrides?: Partial<StoredSettings>) => void;
  revokeActiveObjectUrl: () => void;
  createWallpaperObjectUrl: (blob: Blob, extHint?: string) => string;
  setCustomWallpaperStoredAsBlob: (next: boolean) => void;
  setCustomWallpaperState: (next: string | null) => void;
}): void {
  const {
    createWallpaperObjectUrl,
    persistSettings,
    revokeActiveObjectUrl,
    setCustomWallpaperState,
    setCustomWallpaperStoredAsBlob,
  } = args;

  // Load custom wallpaper from IndexedDB if present (and migrate legacy data URLs)
  useEffect(() => {
    if (!isLocalStorageAvailable()) return;

    let cancelled = false;
    const run = async () => {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<StoredSettings>;
        const storedCustom = parsed.customWallpaper;

        // Legacy migration: data URL stored inline
        if (typeof storedCustom === "string" && storedCustom.startsWith("data:")) {
          const blob = dataUrlToBlob(storedCustom);
          await setCustomWallpaperBlob(blob);
          if (cancelled) return;
          revokeActiveObjectUrl();
          const next = createWallpaperObjectUrl(blob);
          setCustomWallpaperStoredAsBlob(true);
          setCustomWallpaperState(next);
          persistSettings({ customWallpaper: CUSTOM_WALLPAPER_BLOB_SENTINEL });
          return;
        }

        if (storedCustom !== CUSTOM_WALLPAPER_BLOB_SENTINEL) return;

        const blob = await getCustomWallpaperBlob();
        if (!blob || cancelled) return;
        revokeActiveObjectUrl();
        const next = createWallpaperObjectUrl(blob);
        setCustomWallpaperStoredAsBlob(true);
        setCustomWallpaperState(next);
      } catch {
        // ignore
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    createWallpaperObjectUrl,
    persistSettings,
    revokeActiveObjectUrl,
    setCustomWallpaperState,
    setCustomWallpaperStoredAsBlob,
  ]);
}
