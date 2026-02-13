import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { uploadVideo, getFileUrl, STORAGE_BUCKETS } from "@/lib/mediaUpload";
import { createVideoThumbnail } from "./thumbnails";
import type { VideoRecording } from "./types";

/**
 * Upload a recorded video blob to Storage and persist metadata to `video_recordings`.
 *
 * This helper is intended for single recordings. For multi-camera sessions, prefer:
 * - `useVideoRecording()` for capture + chunk upload
 * - `persistMultiCameraRecordingUploads()` for DB persistence
 */
export async function uploadRecordedVideo(
  recording: VideoRecording,
  sessionId: string,
  folder?: string,
): Promise<string | null> {
  try {
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      toast.error("Please sign in");
      return null;
    }

    const file = new File([recording.blob], `recording-${recording.id}.webm`, {
      type: recording.blob.type || "video/webm",
    });

    const upload = await uploadVideo(file, {
      bucket: STORAGE_BUCKETS.RECORDINGS,
      folder: folder || `sessions/${sessionId}`,
      maxSize: 500 * 1024 * 1024,
      onProgress: _progress => {
        // Progress is handled by uploadVideo (chunked upload reports granular progress).
      },
    });

    if (!upload) return null;

    // "recordings" is typically private: store path + sign at read time.
    const resolvedUrl =
      upload.bucket === STORAGE_BUCKETS.RECORDINGS ? null : (upload.publicUrl ?? null);

    // Best-effort thumbnail generation (does not block core upload success).
    let thumbnailUrl: string | null = null;
    try {
      const thumb = await createVideoThumbnail(recording.blob, 0);
      thumbnailUrl = thumb ? String(thumb) : null;
    } catch {
      thumbnailUrl = null;
    }

    const recordingName = folder
      ? `Session ${sessionId} (${folder})`
      : `Session ${sessionId} - Recording`;

    const { error: dbErr } = await supabase.from("video_recordings").insert({
      session_id: sessionId,
      user_id: user.id,
      recording_name: recordingName,
      recording_type: "single",
      video_url: resolvedUrl,
      video_storage_path: upload.path,
      thumbnail_url: thumbnailUrl,
      duration_seconds: Number.isFinite(recording.duration) ? Math.round(recording.duration) : null,
      file_size_bytes: recording.blob.size,
      codec: upload.mimeType || file.type,
      is_private: true,
      share_with_partner: true,
      updated_at: new Date().toISOString(),
    } as any);

    if (dbErr) {
      logger.warn("uploadRecordedVideo: failed to persist video_recordings row", {
        error: dbErr.message,
        sessionId,
        path: upload.path,
      });
    }

    return resolvedUrl ?? upload.publicUrl ?? upload.path ?? null;
  } catch (error) {
    logger.error("uploadRecordedVideo failed", { error });
    toast.error("Failed to upload video");
    return null;
  }
}

export function getVideoUrl(path: string): string {
  return getFileUrl(path, STORAGE_BUCKETS.VIDEOS);
}
