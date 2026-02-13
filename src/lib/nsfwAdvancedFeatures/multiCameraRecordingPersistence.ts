import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";
import { ensureRecordingForCameraStream, type CameraStreamRow } from "@/lib/videoEditing";
import type { MultiCameraSession } from "./types";

export type MultiCameraUploadResult = {
  cameraIndex: number;
  bucket: string;
  path: string;
  publicUrl: string;
  sizeBytes: number;
  mimeType: string;
};

function pickCameraMeta(params: {
  cameraIndex: number;
  cameraStreams?: Array<MediaStream | null | undefined>;
  cameraLabels?: Array<string | null | undefined>;
  cameraDeviceIds?: Array<string | null | undefined>;
}): { cameraName: string | null; deviceId: string | null } {
  const explicitLabel = params.cameraLabels?.[params.cameraIndex];
  const explicitDeviceId = params.cameraDeviceIds?.[params.cameraIndex];
  const stream = params.cameraStreams?.[params.cameraIndex] ?? null;

  const track = stream?.getVideoTracks?.()?.[0] ?? null;
  const cameraName =
    (typeof explicitLabel === "string" && explicitLabel.trim().length > 0
      ? explicitLabel.trim()
      : null) ??
    (typeof track?.label === "string" && track.label.trim().length > 0 ? track.label.trim() : null);

  let settingsDeviceId: string | null = null;
  try {
    const settings = typeof track?.getSettings === "function" ? track.getSettings() : null;
    settingsDeviceId =
      typeof settings?.deviceId === "string" && settings.deviceId.length > 0
        ? settings.deviceId
        : null;
  } catch {
    // ignore
  }

  const deviceId =
    (typeof explicitDeviceId === "string" && explicitDeviceId.length > 0
      ? explicitDeviceId
      : null) ??
    settingsDeviceId ??
    null;

  return { cameraName, deviceId };
}

/**
 * Persist a set of uploaded camera blobs:
 * - Insert/update `camera_streams` rows (idempotent by `video_storage_path`)
 * - Ensure matching `video_recordings` rows exist (required for edits FK)
 * - Update `multi_camera_sessions.camera_count`
 */
export async function persistMultiCameraRecordingUploads(params: {
  session: Pick<MultiCameraSession, "id" | "user_id" | "partner_id">;
  uploads: MultiCameraUploadResult[];
  durationSeconds: number;
  cameraStreams?: Array<MediaStream | null | undefined>;
  cameraLabels?: Array<string | null | undefined>;
  cameraDeviceIds?: Array<string | null | undefined>;
}): Promise<{ cameraStreams: CameraStreamRow[] }> {
  const uploads = params.uploads.filter(u => typeof u.path === "string" && u.path.length > 0);
  if (uploads.length === 0) return { cameraStreams: [] };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { cameraStreams: [] };

  const isPartnerRecorder =
    params.session.partner_id === user.id && params.session.user_id !== user.id;
  const paths = uploads.map(u => u.path);

  const fields =
    "id, session_id, camera_index, camera_name, device_type, video_url, video_storage_path, video_duration_seconds, created_at";

  const existingByPath = new Map<string, CameraStreamRow>();
  try {
    const { data, error } = await fromExtended("camera_streams")
      .select(fields)
      .eq("session_id", params.session.id)
      .eq("user_id", user.id)
      .in("video_storage_path", paths);
    if (!error && Array.isArray(data)) {
      for (const row of data as CameraStreamRow[]) {
        const p = row.video_storage_path;
        if (p) existingByPath.set(p, row);
      }
    }
  } catch (err) {
    logger.warn("persistMultiCameraRecordingUploads: failed to prefetch existing camera_streams", {
      error: err,
    });
  }

  const streamRows: CameraStreamRow[] = [];
  for (const u of uploads) {
    const existing = existingByPath.get(u.path);
    if (existing) {
      streamRows.push(existing);
      continue;
    }

    const { cameraName, deviceId } = pickCameraMeta({
      cameraIndex: u.cameraIndex,
      cameraStreams: params.cameraStreams,
      cameraLabels: params.cameraLabels,
      cameraDeviceIds: params.cameraDeviceIds,
    });

    // If the bucket is private (default: "recordings"), store the path and sign URLs at read time.
    const resolvedUrl = u.bucket === "recordings" ? null : u.publicUrl;

    try {
      const { data: inserted, error } = await fromExtended("camera_streams")
        .insert({
          session_id: params.session.id,
          user_id: user.id,
          camera_index: u.cameraIndex,
          camera_name: cameraName,
          device_id: deviceId,
          device_type: isPartnerRecorder ? "partner_device" : "webcam",
          is_active: false,
          is_recording: false,
          video_url: resolvedUrl,
          video_storage_path: u.path,
          video_duration_seconds: params.durationSeconds,
          video_size_bytes: u.sizeBytes,
          codec: u.mimeType,
        })
        .select(fields)
        .single();

      if (error || !inserted) {
        logger.error("persistMultiCameraRecordingUploads: camera_streams insert failed", {
          error: error?.message,
          sessionId: params.session.id,
          path: u.path,
        });
        continue;
      }

      const row = inserted as CameraStreamRow;
      streamRows.push(row);
      if (row.video_storage_path) existingByPath.set(row.video_storage_path, row);
    } catch (err) {
      logger.error("persistMultiCameraRecordingUploads: camera_streams insert threw", {
        error: err,
        sessionId: params.session.id,
        path: u.path,
      });
    }
  }

  // Ensure we also have `video_recordings` rows (required for `video_edits` FK).
  await Promise.all(
    streamRows.map(row =>
      ensureRecordingForCameraStream({
        sessionId: params.session.id,
        cameraStream: row,
        durationSeconds: params.durationSeconds,
      }),
    ),
  );

  try {
    await supabase
      .from("multi_camera_sessions")
      .update({ camera_count: uploads.length, updated_at: new Date().toISOString() })
      .eq("id", params.session.id);
  } catch (err) {
    logger.warn("persistMultiCameraRecordingUploads: failed to update multi_camera_sessions", {
      error: err,
      sessionId: params.session.id,
    });
  }

  return { cameraStreams: streamRows };
}
