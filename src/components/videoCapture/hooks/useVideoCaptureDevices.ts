import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import type { CameraStream, VideoCaptureQuality } from "../types";

function qualityToIdealResolution(quality: VideoCaptureQuality): { width: number; height: number } {
  switch (quality) {
    case "720p":
      return { width: 1280, height: 720 };
    case "1080p":
      return { width: 1920, height: 1080 };
    case "2k":
      return { width: 2560, height: 1440 };
    case "4k":
      return { width: 3840, height: 2160 };
    default:
      return { width: 1920, height: 1080 };
  }
}

export function useVideoCaptureDevices(params: {
  quality: VideoCaptureQuality;
  audioEnabled: boolean;
  maxCameras?: number;
}): {
  cameraStreams: CameraStream[];
  availableDevices: MediaDeviceInfo[];
  refreshDevices: () => Promise<void>;
  startCamera: (deviceId?: string) => Promise<CameraStream | null>;
  stopCamera: (cameraId: string) => void;
  stopAllCameras: () => void;
  syncAudioEnabledToStreams: (next: boolean) => Promise<void>;
} {
  const maxCameras = params.maxCameras ?? 4;

  const [cameraStreams, setCameraStreams] = useState<CameraStream[]>([]);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      setAvailableDevices([]);
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableDevices(devices.filter(d => d.kind === "videoinput"));
    } catch (err) {
      logger.error("useVideoCaptureDevices: enumerateDevices failed", { error: err });
      setAvailableDevices([]);
    }
  }, []);

  useEffect(() => {
    void refreshDevices();
    const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!md?.addEventListener) return;
    md.addEventListener("devicechange", refreshDevices);
    return () => md.removeEventListener("devicechange", refreshDevices);
  }, [refreshDevices]);

  const stopAllCameras = useCallback(() => {
    setCameraStreams(prev => {
      for (const cam of prev) cam.stream.getTracks().forEach(t => t.stop());
      return [];
    });
  }, []);

  useEffect(() => {
    return () => stopAllCameras();
  }, [stopAllCameras]);

  const startCamera = useCallback(
    async (deviceId?: string): Promise<CameraStream | null> => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        toast.error("Camera capture is not available in this environment");
        return null;
      }
      if (cameraStreams.length >= maxCameras) {
        toast.error(`Maximum cameras connected (${maxCameras})`);
        return null;
      }

      const existing = deviceId ? (cameraStreams.find(c => c.deviceId === deviceId) ?? null) : null;
      if (existing) return existing;

      try {
        const { width, height } = qualityToIdealResolution(params.quality);

        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: 30, max: 60 },
        };
        if (deviceId) videoConstraints.deviceId = { exact: deviceId };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        // Best-effort microphone attachment for camera 1 only; do not block video capture.
        if (
          params.audioEnabled &&
          cameraStreams.length === 0 &&
          stream.getAudioTracks().length === 0
        ) {
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: false,
            });
            for (const t of audioStream.getAudioTracks()) stream.addTrack(t);
          } catch (err) {
            logger.warn("useVideoCaptureDevices: mic permission denied; continuing without audio", {
              error: err,
            });
            toast.message("Microphone not available; recording will be silent.");
          }
        }

        const track = stream.getVideoTracks()[0] ?? null;
        const settings = typeof track?.getSettings === "function" ? track.getSettings() : null;
        const resolvedDeviceId =
          (typeof settings?.deviceId === "string" && settings.deviceId.length > 0
            ? settings.deviceId
            : null) ??
          deviceId ??
          "default";

        const deviceLabel =
          availableDevices.find(d => d.deviceId === resolvedDeviceId)?.label ??
          availableDevices.find(d => d.deviceId === deviceId)?.label ??
          "";
        const label =
          (typeof track?.label === "string" && track.label.trim().length > 0
            ? track.label
            : deviceLabel) || `Camera ${cameraStreams.length + 1}`;

        const id =
          typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `cam-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const cam: CameraStream = { id, stream, deviceId: resolvedDeviceId, label };
        setCameraStreams(prev => [...prev, cam]);
        toast.success(`Camera "${label}" connected`);
        return cam;
      } catch (err) {
        logger.error("useVideoCaptureDevices: getUserMedia failed", { error: err });
        toast.error("Failed to access camera. Please check permissions.");
        return null;
      }
    },
    [availableDevices, cameraStreams, maxCameras, params.audioEnabled, params.quality],
  );

  const stopCamera = useCallback((cameraId: string) => {
    setCameraStreams(prev => {
      const target = prev.find(c => c.id === cameraId) ?? null;
      if (target) {
        target.stream.getTracks().forEach(t => t.stop());
        toast.success(`Camera "${target.label}" disconnected`);
      }
      return prev.filter(c => c.id !== cameraId);
    });
  }, []);

  const syncAudioEnabledToStreams = useCallback(
    async (next: boolean) => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;

      if (!next) {
        // Stop and detach all audio tracks from existing streams.
        setCameraStreams(prev => {
          for (const cam of prev) {
            for (const t of cam.stream.getAudioTracks()) {
              try {
                cam.stream.removeTrack(t);
              } catch {
                // ignore
              }
              t.stop();
            }
          }
          return [...prev];
        });
        return;
      }

      // Enable mic on camera 1 best-effort (helps when cameras were connected before toggling).
      const first = cameraStreams[0] ?? null;
      if (!first || first.stream.getAudioTracks().length > 0) return;
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        for (const t of audioStream.getAudioTracks()) first.stream.addTrack(t);
        toast.success("Microphone enabled for recordings");
      } catch (err) {
        logger.warn("useVideoCaptureDevices: mic permission denied; continuing without audio", {
          error: err,
        });
        toast.message("Microphone not available; recording will be silent.");
      }
    },
    [cameraStreams],
  );

  return {
    cameraStreams,
    availableDevices,
    refreshDevices,
    startCamera,
    stopCamera,
    stopAllCameras,
    syncAudioEnabledToStreams,
  };
}
