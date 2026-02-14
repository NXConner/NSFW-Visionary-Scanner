import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export const DEFAULT_WALLPAPER_BUCKET = "wallpapers";

function getWallpaperBucket(): string {
  const v = (import.meta as any)?.env?.VITE_WALLPAPER_BUCKET;
  return (typeof v === "string" && v.trim() ? v.trim() : DEFAULT_WALLPAPER_BUCKET).slice(0, 64);
}

function safeRandomId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return (crypto as any).randomUUID();
    }
  } catch {
    // ignore
  }
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function extFromMime(mime: string): string {
  const t = String(mime || "")
    .toLowerCase()
    .trim();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("gif")) return "gif";
  if (t.includes("bmp")) return "bmp";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  return "jpg";
}

export async function uploadUserWallpaper(params: {
  userId: string;
  file: Blob;
  filenameHint?: string;
}): Promise<{ bucket: string; path: string } | null> {
  const userId = String(params.userId || "").trim();
  if (!userId) return null;

  const bucket = getWallpaperBucket();
  const ext = extFromMime((params.file as any)?.type ?? "");
  const id = safeRandomId();
  const path = `${userId}/${id}.${ext}`;

  try {
    const { error } = await supabase.storage.from(bucket).upload(path, params.file, {
      upsert: false,
      cacheControl: "3600",
      contentType: (params.file as any)?.type ?? undefined,
    });
    if (error) {
      logger.warn("uploadUserWallpaper failed", { bucket, path, error: error.message });
      return null;
    }
    return { bucket, path };
  } catch (e) {
    logger.warn("uploadUserWallpaper crashed", {
      bucket,
      path,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

export async function downloadUserWallpaper(params: {
  path: string;
}): Promise<{ bucket: string; blob: Blob } | null> {
  const bucket = getWallpaperBucket();
  const path = String(params.path || "").trim();
  if (!path) return null;

  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) {
      logger.warn("downloadUserWallpaper failed", { bucket, path, error: error?.message });
      return null;
    }
    return { bucket, blob: data };
  } catch (e) {
    logger.warn("downloadUserWallpaper crashed", {
      bucket,
      path,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}
