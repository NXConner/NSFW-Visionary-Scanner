import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useVideoRecording } from "@/hooks/useVideoRecording";
import {
  createMultiCameraSession,
  persistMultiCameraRecordingUploads,
  startRecording as markSessionRecording,
  stopRecording as markSessionCompleted,
  updateMultiCameraSessionMetadata,
  type MultiCameraSession,
} from "@/lib/nsfwAdvancedFeatures";
import type { CameraStream, VideoCaptureQuality } from "../types";

function isReusableSession(session: MultiCameraSession | null): session is MultiCameraSession {
  return (
    Boolean(session) &&
    (session.recording_status === "draft" || session.recording_status === "paused")
  );
}

export function useVideoCaptureRecording(params: {
  cameraStreams: CameraStream[];
  startCamera: (deviceId?: string) => Promise<CameraStream | null>;
  maxCameras: number;

  currentSession: MultiCameraSession | null;
  setCurrentSession: (next: MultiCameraSession | null) => void;
  addSession: (session: MultiCameraSession) => void;
  refreshSessions: () => Promise<void>;

  draftSessionName: string;
  quality: VideoCaptureQuality;
  onRequestPartnerTab?: () => void;
}): {
  isRecording: boolean;
  isUploading: boolean;
  uploadPercent: number;
  recordingTimeSeconds: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
} {
  const {
    isRecording,
    isUploading,
    uploadPercent,
    startMultiCameraRecording,
    stopMultiCameraRecording,
    uploadRecordingSet,
  } = useVideoRecording();

  const {
    cameraStreams,
    startCamera,
    maxCameras,
    currentSession,
    setCurrentSession,
    addSession,
    refreshSessions,
    draftSessionName,
    quality,
    onRequestPartnerTab,
  } = params;

  const currentSessionRef = useRef<MultiCameraSession | null>(null);
  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  const recordingCamerasRef = useRef<CameraStream[]>([]);
  const startStopBusyRef = useRef(false);

  const startedUiAtRef = useRef<number | null>(null);
  const uiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordingTimeSeconds, setRecordingTimeSeconds] = useState(0);

  const clearRecordingTimer = useCallback(() => {
    startedUiAtRef.current = null;
    if (uiTimerRef.current) {
      clearInterval(uiTimerRef.current);
      uiTimerRef.current = null;
    }
    setRecordingTimeSeconds(0);
  }, []);

  const startRecordingTimer = useCallback(() => {
    startedUiAtRef.current = Date.now();
    setRecordingTimeSeconds(0);
    if (uiTimerRef.current) clearInterval(uiTimerRef.current);
    uiTimerRef.current = setInterval(() => {
      const startedAt = startedUiAtRef.current;
      if (!startedAt) return;
      setRecordingTimeSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
  }, []);

  useEffect(() => {
    return () => clearRecordingTimer();
  }, [clearRecordingTimer]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isRecording) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isRecording]);

  const startRecording = useCallback(async (): Promise<void> => {
    if (startStopBusyRef.current) return;
    if (isRecording || isUploading) return;
    startStopBusyRef.current = true;

    try {
      let cams = cameraStreams;
      if (cams.length === 0) {
        const cam = await startCamera();
        if (!cam) return;
        cams = [cam];
      }

      const existing = currentSessionRef.current;
      const reusable = isReusableSession(existing);

      if (existing?.session_type === "partner_sync" && !reusable) {
        toast.message("Create a new shared session in Partner Sync before recording.");
        onRequestPartnerTab?.();
        return;
      }

      const effectiveName = draftSessionName.trim() || `Recording ${new Date().toLocaleString()}`;

      let session: MultiCameraSession | null = reusable ? existing : null;
      if (!session) {
        session = await createMultiCameraSession(effectiveName, "multi_camera", null, quality);
        if (!session) return;
        setCurrentSession(session);
        addSession(session);
      } else if (effectiveName !== session.session_name || quality !== session.quality) {
        const updated = await updateMultiCameraSessionMetadata(session.id, {
          session_name: effectiveName,
          quality,
        });
        if (updated) {
          session = updated;
          setCurrentSession(updated);
        }
      }

      const ok = await markSessionRecording(session.id);
      if (!ok) return;

      const camerasForRecording = cams.slice(0, maxCameras);
      recordingCamerasRef.current = camerasForRecording;

      const started = startMultiCameraRecording(camerasForRecording.map(c => c.stream));
      if (!started) {
        toast.error("Failed to start recording");
        return;
      }

      startRecordingTimer();
      await refreshSessions();
    } finally {
      startStopBusyRef.current = false;
    }
  }, [
    addSession,
    isRecording,
    isUploading,
    cameraStreams,
    draftSessionName,
    maxCameras,
    onRequestPartnerTab,
    quality,
    refreshSessions,
    setCurrentSession,
    startCamera,
    startMultiCameraRecording,
    startRecordingTimer,
  ]);

  const stopRecording = useCallback(async (): Promise<void> => {
    if (startStopBusyRef.current) return;
    if (!isRecording) return;
    startStopBusyRef.current = true;

    try {
      const session = currentSessionRef.current;
      if (!session) {
        toast.error("No session selected");
        return;
      }

      clearRecordingTimer();
      const { durationSeconds, blobs } = await stopMultiCameraRecording();
      recordingCamerasRef.current = recordingCamerasRef.current.length
        ? recordingCamerasRef.current
        : cameraStreams;

      await markSessionCompleted(session.id, durationSeconds);

      if (blobs.length === 0) {
        toast.error("No video data captured");
        await refreshSessions();
        return;
      }

      toast.success("Recording stopped. Uploading…");
      const uploads = await uploadRecordingSet({ sessionId: session.id, blobs });
      if (uploads.length > 0) {
        const cams = recordingCamerasRef.current;
        await persistMultiCameraRecordingUploads({
          session,
          uploads,
          durationSeconds,
          cameraStreams: cams.map(c => c.stream),
          cameraLabels: cams.map(c => c.label),
          cameraDeviceIds: cams.map(c => c.deviceId),
        });
      }

      recordingCamerasRef.current = [];
      await refreshSessions();
    } catch (err) {
      logger.error("useVideoCaptureRecording: stop flow failed", { error: err });
      toast.error("Failed to stop recording");
    } finally {
      startStopBusyRef.current = false;
    }
  }, [
    cameraStreams,
    clearRecordingTimer,
    isRecording,
    refreshSessions,
    stopMultiCameraRecording,
    uploadRecordingSet,
  ]);

  return {
    isRecording,
    isUploading,
    uploadPercent,
    recordingTimeSeconds,
    startRecording,
    stopRecording,
  };
}
