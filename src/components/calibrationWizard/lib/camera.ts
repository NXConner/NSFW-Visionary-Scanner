import { useCallback, useEffect, useRef, useState } from "react";

import { toast } from "sonner";

function describeGetUserMediaError(err: unknown): string {
  const anyErr = err as any;
  const name = String(anyErr?.name ?? "");
  const message = String(anyErr?.message ?? "");

  // Normalize the most common failure modes into actionable messages.
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || /denied/i.test(message)) {
    return "Camera permission denied. Please allow camera access in your browser/app settings.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera device found.";
  }
  if (name === "NotReadableError" || /in use|busy/i.test(message)) {
    return "Camera is currently in use by another application. Close other apps using the camera and retry.";
  }
  if (name === "OverconstrainedError" || name === "ConstraintNotSatisfiedError") {
    return "Camera constraints not supported on this device. Retrying with a compatible configuration…";
  }
  if (name === "AbortError") {
    return "Camera startup was interrupted. Please retry.";
  }
  return message || "Unable to access camera. Please retry.";
}

function detachVideoEl(video: HTMLVideoElement | null): void {
  if (!video) return;
  try {
    video.pause();
  } catch {
    // ignore
  }
  try {
    (video as HTMLMediaElement).srcObject = null;
  } catch {
    // ignore
  }
}

export function useCalibrationCamera({
  isOpen,
  step,
  externalVideoRef,
  internalVideoRef,
}: {
  isOpen: boolean;
  step: number;
  externalVideoRef?: React.RefObject<HTMLVideoElement>;
  internalVideoRef: React.RefObject<HTMLVideoElement>;
}) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);
  const hasMirroredExternalStreamRef = useRef(false);
  const hasAutoStartedRef = useRef(false);

  const stopCamera = useCallback(() => {
    // Only stop streams we created. If we're mirroring an external stream, just detach.
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    detachVideoEl(internalVideoRef.current);
    setCameraActive(false);
    hasMirroredExternalStreamRef.current = false;
  }, [internalVideoRef]);

  const startCamera = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    hasAutoStartedRef.current = true; // Mark as started (for both auto and manual)
    try {
      setCameraError(null);

      // Wait for video element to be mounted (up to 1 second with retries)
      let internalVideo = internalVideoRef.current;
      let waitAttempts = 0;
      while (!internalVideo && waitAttempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        internalVideo = internalVideoRef.current;
        waitAttempts++;
      }

      if (!internalVideo) {
        setCameraError("Camera preview not ready. Please retry.");
        return;
      }

      // Always reset internal state before (re)starting.
      stopCamera();

      // If external is provided and has a stream, mirror it for preview/capture.
      const externalVideo = externalVideoRef?.current;
      const externalStream = externalVideo?.srcObject;
      if (externalStream instanceof MediaStream) {
        internalVideo.srcObject = externalStream;
        try {
          await internalVideo.play();
        } catch {
          // iOS/Safari can block autoplay; stream is still attached.
        }
        hasMirroredExternalStreamRef.current = true;
        setCameraActive(true);
        toast.success("Using active camera for calibration");
        return;
      }

      // Otherwise, open our own camera stream.
      const attempts: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 960 },
            height: { ideal: 540 },
          },
        },
        { video: { facingMode: { ideal: "environment" } } },
        { video: { facingMode: { ideal: "user" } } },
        { video: true },
      ];

      let stream: MediaStream | null = null;
      let lastErr: unknown = null;
      for (const c of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c);
          break;
        } catch (e) {
          lastErr = e;
          const msg = describeGetUserMediaError(e);
          // If the device doesn't like our constraints, continue to the next attempt.
          if (/constraints/i.test(msg) || /compatible configuration/i.test(msg)) continue;
          // For other errors, still try a fallback once; if none succeeds, surface the last error.
        }
      }

      if (!stream) {
        const msg = lastErr ? describeGetUserMediaError(lastErr) : "Unable to access camera.";
        setCameraError(msg);
        toast.error("Camera error", { description: msg });
        return;
      }

      internalVideo.srcObject = stream;
      try {
        await internalVideo.play();
      } catch {
        // Stream is attached; video element may require user gesture.
      }
      streamRef.current = stream;
      setCameraActive(true);
      toast.success("Camera ready for calibration");
    } catch (err) {
      const msg = describeGetUserMediaError(err);
      setCameraError(msg);
      toast.error("Camera error", { description: msg });
    } finally {
      startingRef.current = false;
    }
  }, [externalVideoRef, internalVideoRef, stopCamera]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCameraError(null);
      hasMirroredExternalStreamRef.current = false;
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  // Auto-start camera on step 2 (only once per entry)
  useEffect(() => {
    if (isOpen && step === 2 && !cameraActive && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      // Small delay to ensure video element is in DOM
      const timer = setTimeout(() => {
        void startCamera();
      }, 100);
      return () => clearTimeout(timer);
    }
    // Reset auto-start flag when leaving step 2 or closing
    if (!isOpen || step !== 2) {
      hasAutoStartedRef.current = false;
    }
  }, [isOpen, step, cameraActive, startCamera]);

  // Reset auto-start flag on error so retry works
  useEffect(() => {
    if (cameraError) {
      hasAutoStartedRef.current = false;
    }
  }, [cameraError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { cameraActive, cameraError, startCamera, stopCamera };
}
