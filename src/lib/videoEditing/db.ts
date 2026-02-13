import { supabase } from "@/integrations/supabase/client";
import { fromExtended } from "@/lib/supabaseExtensions";
import { logger } from "@/lib/logger";

export type MultiCameraSessionRow = {
  id: string;
  session_name: string;
  recording_status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CameraStreamRow = {
  id: string;
  session_id: string;
  camera_index: number;
  camera_name: string | null;
  device_type: string | null;
  video_url: string | null;
  video_storage_path: string | null;
  video_duration_seconds: number | null;
  created_at: string | null;
};

export type VideoRecordingRow = {
  id: string;
  session_id: string;
  recording_name: string;
  recording_type: string | null;
  video_url: string | null;
  video_storage_path: string | null;
  duration_seconds: number | null;
  created_at: string | null;
};

export type VideoEditRow = {
  id: string;
  recording_id: string;
  edit_name: string | null;
  edit_type: string;
  edit_status: string;
  preview_url: string | null;
  edited_video_url: string | null;
  created_at: string | null;
};

export async function getMyMultiCameraSessions(): Promise<MultiCameraSessionRow[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await fromExtended("multi_camera_sessions")
      .select("id, session_name, recording_status, created_at, updated_at")
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      logger.error("getMyMultiCameraSessions failed", { error: error.message });
      return [];
    }
    return (data || []) as MultiCameraSessionRow[];
  } catch (err) {
    logger.error("getMyMultiCameraSessions error", { error: err });
    return [];
  }
}

export async function getCameraStreamsForSession(sessionId: string): Promise<CameraStreamRow[]> {
  try {
    const { data, error } = await fromExtended("camera_streams")
      .select(
        "id, session_id, camera_index, camera_name, device_type, video_url, video_storage_path, video_duration_seconds, created_at",
      )
      .eq("session_id", sessionId)
      .order("camera_index", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data || []) as CameraStreamRow[];
  } catch (err) {
    logger.error("getCameraStreamsForSession error", { error: err });
    return [];
  }
}

export async function getVideoRecordingsForSession(
  sessionId: string,
): Promise<VideoRecordingRow[]> {
  try {
    const { data, error } = await fromExtended("video_recordings")
      .select(
        "id, session_id, recording_name, recording_type, video_url, video_storage_path, duration_seconds, created_at",
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data || []) as VideoRecordingRow[];
  } catch (err) {
    logger.error("getVideoRecordingsForSession error", { error: err });
    return [];
  }
}

export async function getEditsForRecording(recordingId: string): Promise<VideoEditRow[]> {
  try {
    const { data, error } = await fromExtended("video_edits")
      .select(
        "id, recording_id, edit_name, edit_type, edit_status, preview_url, edited_video_url, created_at",
      )
      .eq("recording_id", recordingId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return [];
    return (data || []) as VideoEditRow[];
  } catch (err) {
    logger.error("getEditsForRecording error", { error: err });
    return [];
  }
}

/**
 * Ensures there is a `video_recordings` row for a given uploaded camera stream.
 * This is required because `video_edits.recording_id` references `video_recordings.id`.
 */
export async function ensureRecordingForCameraStream(params: {
  sessionId: string;
  cameraStream: CameraStreamRow;
  durationSeconds: number | null;
}): Promise<VideoRecordingRow | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const storagePath = params.cameraStream.video_storage_path || null;
    if (!storagePath) return null;

    // Avoid duplicates by matching on `video_storage_path` (stable).
    const { data: existing } = await fromExtended("video_recordings")
      .select(
        "id, session_id, recording_name, recording_type, video_url, video_storage_path, duration_seconds, created_at",
      )
      .eq("user_id", user.id)
      .eq("video_storage_path", storagePath)
      .maybeSingle();

    if (existing?.id) return existing as VideoRecordingRow;

    const recordingName =
      params.cameraStream.camera_name ||
      `Session ${params.sessionId} - Camera ${params.cameraStream.camera_index + 1}`;

    const { data, error } = await fromExtended("video_recordings")
      .insert({
        session_id: params.sessionId,
        user_id: user.id,
        recording_name: recordingName,
        recording_type: "single",
        video_url: params.cameraStream.video_url ?? null,
        video_storage_path: storagePath,
        duration_seconds:
          params.durationSeconds ?? params.cameraStream.video_duration_seconds ?? null,
        file_size_bytes: null,
        is_private: true,
        share_with_partner: true,
      })
      .select(
        "id, session_id, recording_name, recording_type, video_url, video_storage_path, duration_seconds, created_at",
      )
      .single();

    if (error) {
      logger.error("ensureRecordingForCameraStream insert failed", { error: error.message });
      return null;
    }
    return data as VideoRecordingRow;
  } catch (err) {
    logger.error("ensureRecordingForCameraStream error", { error: err });
    return null;
  }
}
