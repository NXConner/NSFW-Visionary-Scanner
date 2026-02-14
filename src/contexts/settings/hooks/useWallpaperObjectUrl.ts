import { useCallback, useEffect, useRef } from "react";

import { inferExtFromBlobType } from "../wallpaperUtils";

export function useWallpaperObjectUrl(): {
  createWallpaperObjectUrl: (blob: Blob, extHint?: string) => string;
  revokeActiveObjectUrl: () => void;
} {
  const activeWallpaperObjectUrlRef = useRef<string | null>(null);

  const revokeActiveObjectUrl = useCallback(() => {
    const current = activeWallpaperObjectUrlRef.current;
    if (current && current.startsWith("blob:")) {
      const url = current.split("#", 1)[0];
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
    activeWallpaperObjectUrlRef.current = null;
  }, []);

  const createWallpaperObjectUrl = useCallback((blob: Blob, extHint?: string) => {
    const url = URL.createObjectURL(blob);
    const ext = extHint || inferExtFromBlobType(blob);
    const decorated = `${url}#wallpaper.${ext}`;
    activeWallpaperObjectUrlRef.current = decorated;
    return decorated;
  }, []);

  useEffect(() => {
    return () => {
      revokeActiveObjectUrl();
    };
  }, [revokeActiveObjectUrl]);

  return { createWallpaperObjectUrl, revokeActiveObjectUrl };
}
