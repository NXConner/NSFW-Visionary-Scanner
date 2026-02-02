import { useState, useRef, useCallback, useEffect } from "react";
import { requestCameraPermission } from "@/scanner/capture/androidPermissions";

export type CameraFocusMode = "auto" | "continuous" | "manual" | "single-shot";
export type FocusVisualState = "searching" | "focusing" | "locked" | "manual" | "unsupported";
export type TapFocusFeedbackState = "focusing" | "locked" | "failed";

export type CaptureImageOptions = {
  /** Cap output size (keeps aspect). */
  maxWidth?: number;
  /** Cap output size (keeps aspect). */
  maxHeight?: number;
  /** Output mime type. */
  mimeType?: "image/jpeg" | "image/webp";
  /** For jpeg/webp. */
  quality?: number; // 0..1
};

export type CaptureImageBlobResult = {
  blob: Blob;
  width: number;
  height: number;
  mimeType: "image/jpeg" | "image/webp";
};

export type StartCameraResult = { ok: true } | { ok: false; error: string };

export interface TapFocusFeedback {
  visible: boolean;
  xPct: number;
  yPct: number;
  state: TapFocusFeedbackState;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  stream: MediaStream | null;
  isActive: boolean;
  isStarting: boolean;
  error: string | null;
  startCamera: () => Promise<StartCameraResult>;
  stopCamera: () => void;
  captureImage: () => string | null;
  captureImageAsync: (opts?: CaptureImageOptions) => Promise<string | null>;
  /**
   * Blob-first capture for performance and worker-friendly transfers.
   * This does NOT apply visual effects; effects should be applied in a later processing stage.
   */
  captureImageBlobAsync: (opts?: CaptureImageOptions) => Promise<CaptureImageBlobResult | null>;

  // Advanced controls (best-effort; may be unsupported on many browsers/devices)
  getVideoTrack: () => MediaStreamTrack | null;
  focusState: FocusVisualState;
  tapFocusFeedback: TapFocusFeedback | null;
  setFocusMode: (mode: CameraFocusMode) => Promise<boolean>;
  setFocusDistance: (normalized: number) => Promise<boolean>;
  tapToFocus: (
    xNorm: number,
    yNorm: number,
    viewPoint?: { xPct: number; yPct: number },
  ) => Promise<boolean>;
  setTorch: (enabled: boolean) => Promise<boolean>;
  setZoomFactor: (zoom: number) => Promise<boolean>;
  lockExposure: () => Promise<boolean>;
  lockWhiteBalance: () => Promise<boolean>;
}

function describeGetUserMediaError(err: unknown): string {
  const anyErr = err as any;
  const name = String(anyErr?.name ?? "");
  const message = String(anyErr?.message ?? "");

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
    return "Camera constraints not supported on this device.";
  }
  if (name === "AbortError") {
    return "Camera startup was interrupted. Please retry.";
  }
  if (/https/i.test(message) && /secure/i.test(message)) {
    return "Camera requires a secure context (HTTPS). Open the app over HTTPS and retry.";
  }
  return message || "Unable to access camera. Please retry.";
}

async function withTimeout<T>(p: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await new Promise<T>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
      p.then(resolve).catch(reject);
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const useCamera = (): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusState, setFocusState] = useState<FocusVisualState>("searching");
  const [tapFocusFeedback, setTapFocusFeedback] = useState<TapFocusFeedback | null>(null);
  const startingRef = useRef(false);
  const startSeqRef = useRef(0);

  const getVideoTrack = useCallback(() => trackRef.current, []);

  const applyAdvanced = useCallback(
    async (constraints: Record<string, unknown>): Promise<boolean> => {
      const track = trackRef.current;
      if (!track || typeof track.applyConstraints !== "function") return false;

      const caps =
        typeof (track as MediaStreamTrack).getCapabilities === "function"
          ? ((track as MediaStreamTrack).getCapabilities?.() as unknown as Record<string, unknown>)
          : null;

      // Only include keys that appear supported.
      const advanced: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(constraints)) {
        if (caps && k in caps) advanced[k] = v;
      }

      try {
        if (Object.keys(advanced).length === 0) return false;
        const advancedSet = advanced as unknown as MediaTrackConstraintSet;
        await track.applyConstraints({ advanced: [advancedSet] } as MediaTrackConstraints);
        return true;
      } catch {
        // Fallback: try direct constraints object.
        try {
          await track.applyConstraints(advanced as unknown as MediaTrackConstraints);
          return true;
        } catch {
          return false;
        }
      }
    },
    [],
  );

  const startCamera = useCallback(async (): Promise<StartCameraResult> => {
    if (startingRef.current) return { ok: false, error: "Camera is already starting." };
    startingRef.current = true;
    setIsStarting(true);
    const seq = ++startSeqRef.current;
    try {
      setError(null);

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      trackRef.current = null;
      setStream(null);
      setIsActive(false);
      setTapFocusFeedback(null);

      if (typeof navigator === "undefined") {
        const msg = "Camera is not available in this environment.";
        setError(msg);
        setFocusState("unsupported");
        return { ok: false, error: msg };
      }

      // Request camera permissions (especially important for Android/Capacitor)
      try {
        const permResult = await requestCameraPermission();
        if (permResult.status === "denied") {
          const msg =
            "Camera permission denied. Please allow camera access in your device settings and retry.";
          setError(msg);
          setFocusState("unsupported");
          return { ok: false, error: msg };
        }
        // If permission is granted or can be requested, continue to getUserMedia
        // getUserMedia will handle the actual permission prompt if needed
      } catch (error) {
        // If permission check fails, continue anyway - getUserMedia will handle it
        console.warn("Permission check failed, continuing with getUserMedia:", error);
      }

      // Early permission check when available (best-effort, web only)
      try {
        const perms = (navigator as any)?.permissions;
        if (perms?.query) {
          const res = await perms.query({ name: "camera" as any });
          if (res?.state === "denied") {
            const msg =
              "Camera permission denied. Please allow camera access in your browser/app settings.";
            setError(msg);
            setFocusState("unsupported");
            return { ok: false, error: msg };
          }
        }
      } catch {
        // ignore
      }

      const attempts: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 2560 },
            height: { ideal: 1440 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        { video: { facingMode: { ideal: "environment" } }, audio: false },
        { video: { facingMode: { ideal: "user" } }, audio: false },
        { video: true, audio: false },
      ];

      if (!navigator.mediaDevices?.getUserMedia) {
        const msg = "getUserMedia is not available in this environment.";
        setError(msg);
        setFocusState("unsupported");
        return { ok: false, error: msg };
      }

      let mediaStream: MediaStream | null = null;
      let lastErr: unknown = null;
      for (const c of attempts) {
        try {
          mediaStream = await withTimeout(
            navigator.mediaDevices.getUserMedia(c),
            12000,
            "Camera start timed out. If a permission prompt is hidden behind another window/tab, allow it and retry.",
          );
          break;
        } catch (e) {
          lastErr = e;
          // For constraint issues, continue to fallback attempts.
          const msg = describeGetUserMediaError(e);
          if (/constraints/i.test(msg) || /not supported/i.test(msg)) continue;
        }
      }

      if (!mediaStream) {
        const msg = lastErr ? describeGetUserMediaError(lastErr) : "Unable to access camera.";
        setError(msg);
        setIsActive(false);
        setFocusState("unsupported");
        return { ok: false, error: msg };
      }

      // If a newer start request happened, immediately stop the acquired stream.
      if (seq !== startSeqRef.current) {
        mediaStream.getTracks().forEach(t => t.stop());
        return { ok: false, error: "Camera start superseded by a newer request." };
      }

      streamRef.current = mediaStream;
      trackRef.current = mediaStream.getVideoTracks?.()?.[0] ?? null;
      setStream(mediaStream);
      setIsActive(true);
      setFocusState(trackRef.current ? "searching" : "unsupported");
      return { ok: true };
    } catch (err) {
      const msg = describeGetUserMediaError(err);
      setError(msg);
      setIsActive(false);
      setFocusState("unsupported");
      return { ok: false, error: msg };
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    trackRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsActive(false);
    setIsStarting(false);
    setError(null);
    setFocusState("searching");
    setTapFocusFeedback(null);
  }, []);

  // Attach stream to the <video> once it's mounted. (Bounded retries to avoid infinite loops.)
  useEffect(() => {
    if (!stream) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 80; // ~4s at 50ms

    const tryAttach = () => {
      if (cancelled) return;
      const video = videoRef.current;
      if (video) {
        try {
          video.srcObject = stream;
        } catch {
          // ignore
        }
        try {
          void video.play();
        } catch {
          // ignore
        }
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        setError(prev => prev ?? "Camera preview failed to initialize. Please retry.");
        return;
      }
      setTimeout(tryAttach, 50);
    };

    tryAttach();
    return () => {
      cancelled = true;
    };
  }, [stream]);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Ensure video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    // Note: Visual effects are applied asynchronously in captureImageAsync
    // This sync version returns the raw image for immediate use
    return canvas.toDataURL("image/jpeg", 0.9);
  }, []);

  const captureImageAsync = useCallback(
    async (opts: CaptureImageOptions = {}): Promise<string | null> => {
      try {
        if (!videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.videoWidth === 0 || video.videoHeight === 0) return null;

        const maxWidth = Math.max(320, Math.min(4096, Number(opts.maxWidth ?? 2560)));
        const maxHeight = Math.max(320, Math.min(4096, Number(opts.maxHeight ?? 2560)));
        const mimeType: "image/jpeg" | "image/webp" = opts.mimeType ?? "image/jpeg";
        const quality = Math.max(0.4, Math.min(0.92, Number(opts.quality ?? 0.86)));

        const scale = Math.min(1, maxWidth / video.videoWidth, maxHeight / video.videoHeight);
        const outW = Math.max(1, Math.round(video.videoWidth * scale));
        const outH = Math.max(1, Math.round(video.videoHeight * scale));

        canvas.width = outW;
        canvas.height = outH;

        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, outW, outH);

        const blob = await new Promise<Blob | null>(resolve => {
          canvas.toBlob(b => resolve(b), mimeType, quality);
        });
        if (!blob) return null;

        let dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Failed to encode captured image"));
          reader.readAsDataURL(blob);
        });

        if (!dataUrl) return null;

        // Apply visual effects (capture scope) if enabled.
        // Dynamic import to avoid circular dependencies and reduce initial bundle size.
        const { shouldApplyVisualEffectsToCapture } = await import("@/lib/visualEffectsSettings");
        if (shouldApplyVisualEffectsToCapture()) {
          const { applyVisualEffectsToDataURL } = await import("@/lib/applyVisualEffects");
          dataUrl = await applyVisualEffectsToDataURL(dataUrl);
        }

        return dataUrl || null;
      } catch (err) {
        return null;
      }
    },
    [],
  );

  const captureImageBlobAsync = useCallback(
    async (opts: CaptureImageOptions = {}): Promise<CaptureImageBlobResult | null> => {
      try {
        if (!videoRef.current || !canvasRef.current) return null;
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.videoWidth === 0 || video.videoHeight === 0) return null;

        const maxWidth = Math.max(320, Math.min(4096, Number(opts.maxWidth ?? 2560)));
        const maxHeight = Math.max(320, Math.min(4096, Number(opts.maxHeight ?? 2560)));
        const mimeType: "image/jpeg" | "image/webp" = opts.mimeType ?? "image/jpeg";
        const quality = Math.max(0.4, Math.min(0.92, Number(opts.quality ?? 0.86)));

        const scale = Math.min(1, maxWidth / video.videoWidth, maxHeight / video.videoHeight);
        const outW = Math.max(1, Math.round(video.videoWidth * scale));
        const outH = Math.max(1, Math.round(video.videoHeight * scale));

        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0, outW, outH);

        const blob = await new Promise<Blob | null>(resolve => {
          canvas.toBlob(b => resolve(b), mimeType, quality);
        });
        if (!blob) return null;

        return { blob, width: outW, height: outH, mimeType };
      } catch {
        return null;
      }
    },
    [],
  );

  const setFocusMode = useCallback(
    async (mode: CameraFocusMode): Promise<boolean> => {
      if (!trackRef.current) return false;
      if (mode === "manual") setFocusState("manual");
      else setFocusState("focusing");
      const ok = await applyAdvanced({ focusMode: mode });
      setFocusState(ok ? (mode === "manual" ? "manual" : "searching") : "unsupported");
      return ok;
    },
    [applyAdvanced],
  );

  const setFocusDistance = useCallback(
    async (normalized: number): Promise<boolean> => {
      const n = Math.max(0, Math.min(1, normalized));
      if (!trackRef.current) return false;
      setFocusState("manual");
      const caps =
        typeof (trackRef.current as MediaStreamTrack).getCapabilities === "function"
          ? ((trackRef.current as MediaStreamTrack).getCapabilities?.() as unknown as Record<
              string,
              unknown
            >)
          : null;
      const range =
        (caps?.focusDistance as { min?: unknown; max?: unknown } | undefined) ?? undefined;
      const value =
        range && typeof range.min === "number" && typeof range.max === "number"
          ? range.min + (range.max - range.min) * n
          : n;
      const ok = await applyAdvanced({ focusMode: "manual", focusDistance: value });
      return ok;
    },
    [applyAdvanced],
  );

  const tapToFocus = useCallback(
    async (
      xNorm: number,
      yNorm: number,
      viewPoint?: { xPct: number; yPct: number },
    ): Promise<boolean> => {
      const track = trackRef.current;
      if (!track) return false;

      const x = Math.max(0, Math.min(1, xNorm));
      const y = Math.max(0, Math.min(1, yNorm));

      if (viewPoint) {
        setTapFocusFeedback({
          visible: true,
          xPct: viewPoint.xPct,
          yPct: viewPoint.yPct,
          state: "focusing",
        });
      }
      setFocusState("focusing");

      // Best-effort across implementations
      const ok =
        (await applyAdvanced({ focusMode: "single-shot", pointsOfInterest: [{ x, y }] })) ||
        (await applyAdvanced({ focusMode: "auto", pointsOfInterest: [{ x, y }] })) ||
        (await applyAdvanced({ focusMode: "single-shot" })) ||
        (await applyAdvanced({ focusMode: "auto" }));

      if (viewPoint) {
        setTapFocusFeedback({
          visible: true,
          xPct: viewPoint.xPct,
          yPct: viewPoint.yPct,
          state: ok ? "locked" : "failed",
        });
        setTimeout(
          () => setTapFocusFeedback(prev => (prev ? { ...prev, visible: false } : prev)),
          1500,
        );
      }
      setFocusState(ok ? "locked" : "unsupported");
      if (ok) setTimeout(() => setFocusState("searching"), 900);
      return ok;
    },
    [applyAdvanced],
  );

  const setTorch = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      return applyAdvanced({ torch: enabled });
    },
    [applyAdvanced],
  );

  const setZoomFactor = useCallback(
    async (zoom: number): Promise<boolean> => {
      const z = Math.max(1, zoom);
      return applyAdvanced({ zoom: z });
    },
    [applyAdvanced],
  );

  const lockExposure = useCallback(async (): Promise<boolean> => {
    // There is no universal \"lock\"; commonly exposureMode: manual.
    return applyAdvanced({ exposureMode: "manual" });
  }, [applyAdvanced]);

  const lockWhiteBalance = useCallback(async (): Promise<boolean> => {
    return applyAdvanced({ whiteBalanceMode: "manual" });
  }, [applyAdvanced]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    stream,
    isActive,
    isStarting,
    error,
    startCamera,
    stopCamera,
    captureImage,
    captureImageAsync,
    captureImageBlobAsync,

    getVideoTrack,
    focusState,
    tapFocusFeedback,
    setFocusMode,
    setFocusDistance,
    tapToFocus,
    setTorch,
    setZoomFactor,
    lockExposure,
    lockWhiteBalance,
  };
};
