import { useEffect, useMemo, useState } from "react";
import { useCameraCapabilities } from "@/hooks/useCameraCapabilities";
import { useObjectDetection } from "@/hooks/useObjectDetection";
import { useObjectTracking } from "@/hooks/useObjectTracking";
import type { ScannerSettings } from "@/components/scannerOverlays/types";

export function useAdvancedCamera(args: {
  videoRef: React.RefObject<HTMLVideoElement>;
  getVideoTrack: () => MediaStreamTrack | null;
  isActive: boolean;
  settings: ScannerSettings;
}) {
  const { videoRef, getVideoTrack, isActive, settings } = args;

  const [track, setTrack] = useState<MediaStreamTrack | null>(null);

  useEffect(() => {
    if (!isActive) {
      setTrack(null);
      return;
    }
    setTrack(getVideoTrack());
  }, [getVideoTrack, isActive]);

  const capabilities = useCameraCapabilities(track);

  // Use a state to hold the video element so hooks remain stable
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    setVideoEl(videoRef.current ?? null);
  }, [videoRef, isActive]);

  const detectionEnabled =
    isActive &&
    (settings.enableRealDetection ?? false) &&
    settings.showObjectDetection &&
    (settings.detectionThreshold ?? 0.72) > 0;

  const detection = useObjectDetection(videoEl, {
    enabled: detectionEnabled,
    threshold: settings.detectionThreshold ?? 0.72,
    maxObjects: settings.maxDetectedObjects ?? 5,
    // Lower default target FPS to keep UI responsive on mid/low-end devices.
    // (Inference is heavy; fewer runs avoids main-thread backlog.)
    targetFps: 12,
  });

  const tracking = useObjectTracking(detection.detections, {
    enabled: isActive && (settings.enableTracking ?? false),
    iouThreshold: 0.18,
    maxTrackAgeMs: 900,
    maxHistoryPoints: (settings.showMotionTrails ?? false) ? 18 : 8,
  });

  return {
    track,
    capabilities,
    detection,
    tracking,
  };
}
