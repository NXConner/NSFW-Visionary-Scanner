import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import { uploadFile } from "@/lib/mediaUpload";

export type VideoScreenshot = {
  id: string;
  recording_id: string;
  user_id: string;
  screenshot_name: string | null;
  timestamp_seconds: number;
  image_url: string | null;
  image_storage_path: string | null;
  thumbnail_url: string | null;
  is_edited: boolean | null;
  edit_data: Record<string, unknown> | null;
  created_at: string;
};

const DEFAULT_BUCKET = (import.meta as any).env?.VITE_USER_MEDIA_BUCKET ?? "user-media";

function extractStoragePathFromUrl(url: string, bucket: string): string | null {
  try {
    const raw = String(url || "");
    if (!raw) return null;
    const stripped = raw.split("#", 1)[0] || raw;
    const withoutQuery = stripped.split("?", 1)[0] || stripped;

    // Matches:
    // - .../storage/v1/object/public/<bucket>/<path>
    // - .../storage/v1/object/sign/<bucket>/<path>
    const re = new RegExp(`/storage/v1/object/(?:public|sign)/${bucket}/(.+)$`);
    const m = withoutQuery.match(re);
    if (!m?.[1]) return null;
    return decodeURIComponent(m[1]);
  } catch {
    return null;
  }
}

function canvasToPngFile(canvas: HTMLCanvasElement, fileName: string): Promise<File | null> {
  return new Promise(resolve => {
    canvas.toBlob(
      blob => {
        if (!blob) return resolve(null);
        resolve(new File([blob], fileName, { type: "image/png" }));
      },
      "image/png",
      1,
    );
  });
}

function createThumbnailFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  maxWidth: number = 320,
): Promise<File | null> {
  const w = canvas.width;
  const h = canvas.height;
  if (!w || !h) return Promise.resolve(null);
  const scale = Math.min(1, maxWidth / w);
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  const thumb = document.createElement("canvas");
  thumb.width = tw;
  thumb.height = th;
  const ctx = thumb.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(canvas, 0, 0, tw, th);
  return canvasToPngFile(thumb, fileName);
}

export async function captureVideoScreenshot(
  videoEl: HTMLVideoElement,
  timestampSeconds: number,
  recordingId: string,
): Promise<VideoScreenshot | null> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;

    const w = videoEl.videoWidth;
    const h = videoEl.videoHeight;
    if (!w || !h) return null;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(videoEl, 0, 0, w, h);

    const fileName = `screenshot-${recordingId}-${Date.now()}.png`;
    const file = await canvasToPngFile(canvas, fileName);
    if (!file) return null;

    const upload = await uploadFile(file, {
      folder: `screenshots/${recordingId}`,
      compress: false,
      allowedTypes: ["image/png"],
      maxSize: 15 * 1024 * 1024,
    });

    if (!upload) return null;

    const thumbFile = await createThumbnailFile(
      canvas,
      `thumbnail-${recordingId}-${Date.now()}.png`,
    );
    const thumbUpload = thumbFile
      ? await uploadFile(thumbFile, {
          folder: `screenshots/${recordingId}/thumbnails`,
          compress: false,
          allowedTypes: ["image/png"],
          maxSize: 2 * 1024 * 1024,
        })
      : null;

    const { data, error } = await fromExtended("video_screenshots")
      .insert({
        recording_id: recordingId,
        user_id: auth.user.id,
        screenshot_name: fileName,
        timestamp_seconds: Number(timestampSeconds ?? 0),
        image_url: upload.publicUrl ?? null,
        image_storage_path: upload.path,
        thumbnail_url: thumbUpload?.publicUrl ?? upload.publicUrl ?? null,
        is_edited: false,
        edit_data: null,
      })
      .select("*")
      .single();

    if (error) {
      logger.error("captureVideoScreenshot: insert failed", { error: error.message });
      return null;
    }

    return data as VideoScreenshot;
  } catch (error) {
    logger.error("captureVideoScreenshot failed", { error });
    return null;
  }
}

export async function getVideoScreenshots(recordingId: string): Promise<VideoScreenshot[]> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return [];

    const { data, error } = await fromExtended("video_screenshots")
      .select("*")
      .eq("recording_id", recordingId)
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("getVideoScreenshots failed", { error: error.message });
      return [];
    }

    return (data || []) as VideoScreenshot[];
  } catch (error) {
    logger.error("getVideoScreenshots error", { error });
    return [];
  }
}

export async function deleteScreenshot(screenshotId: string): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return false;

    const { data: shot, error: fetchError } = await fromExtended("video_screenshots")
      .select("id,user_id,image_storage_path,thumbnail_url,image_url")
      .eq("id", screenshotId)
      .maybeSingle();

    if (fetchError || !shot) {
      logger.warn("deleteScreenshot: screenshot not found", { screenshotId });
      return false;
    }

    const shotUserId = String((shot as any).user_id || "");
    if (shotUserId !== auth.user.id) {
      logger.warn("deleteScreenshot: user mismatch", { screenshotId });
      return false;
    }

    const bucket = DEFAULT_BUCKET;
    const paths = new Set<string>();
    const storagePath = (shot as any).image_storage_path
      ? String((shot as any).image_storage_path)
      : "";
    if (storagePath) paths.add(storagePath);

    const thumbUrl = (shot as any).thumbnail_url ? String((shot as any).thumbnail_url) : "";
    const imageUrl = (shot as any).image_url ? String((shot as any).image_url) : "";
    const thumbPath = thumbUrl ? extractStoragePathFromUrl(thumbUrl, bucket) : null;
    const imagePathFromUrl = imageUrl ? extractStoragePathFromUrl(imageUrl, bucket) : null;
    if (thumbPath) paths.add(thumbPath);
    if (imagePathFromUrl) paths.add(imagePathFromUrl);

    if (paths.size > 0) {
      const { error: storageError } = await supabase.storage.from(bucket).remove(Array.from(paths));
      if (storageError) {
        // Keep going: DB row deletion still makes the screenshot inaccessible.
        logger.warn("deleteScreenshot: storage removal failed", { error: storageError.message });
      }
    }

    const { error: deleteError } = await fromExtended("video_screenshots")
      .delete()
      .eq("id", screenshotId)
      .eq("user_id", auth.user.id);

    if (deleteError) {
      logger.error("deleteScreenshot: db delete failed", { error: deleteError.message });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("deleteScreenshot failed", { error });
    return false;
  }
}
