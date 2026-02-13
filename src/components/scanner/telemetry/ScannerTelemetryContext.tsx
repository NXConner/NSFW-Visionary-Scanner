import * as React from "react";

import { ScannerTelemetryContext } from "./internalContext";
import type { ScanMode } from "../types";
import { useLiveQualityMetrics } from "./useLiveQualityMetrics";

type Props = {
  enabled: boolean;
  scanMode: ScanMode;
  brightness: number;
  videoRef: React.RefObject<HTMLVideoElement>;
  focusState: "searching" | "focusing" | "locked" | "manual" | "unsupported";
  scannerSettings: {
    autoCapture: boolean;
    autoCaptureDelay: number;
    hapticFeedback: boolean;
    showTiltIndicator: boolean;
    showDistanceIndicator: boolean;
    showQualityIndicators: boolean;
    showStatusBar: boolean;
  };
  /**
   * Called when auto-capture countdown reaches 0.
   * This should bypass timer-delay capture logic and capture immediately.
   */
  onAutoCaptureNow: () => void;
  children: React.ReactNode;
};

export function ScannerTelemetryProvider({
  enabled,
  scanMode,
  brightness,
  videoRef,
  focusState,
  scannerSettings,
  onAutoCaptureNow,
  children,
}: Props) {
  const [isStabilized, setIsStabilized] = React.useState(false);
  const [tiltX, setTiltX] = React.useState(0);
  const [tiltY, setTiltY] = React.useState(0);
  // Real distance estimation (best-effort):
  // - When the browser exposes `MediaTrackSettings.focusDistance`, we convert it to inches.
  // - Otherwise we keep 0 to indicate "unknown" (and avoid fake/simulated values).
  const [estimatedDistance, setEstimatedDistance] = React.useState(0);

  const [autoCapturing, setAutoCapturing] = React.useState(false);
  const [autoCaptureCountdown, setAutoCaptureCountdown] = React.useState(0);

  const stabilityRef = React.useRef<{ x: number; y: number; z: number } | null>(null);
  const lastMotionAtRef = React.useRef(0);
  const lastOrientAtRef = React.useRef(0);

  const readEstimatedDistanceInches = React.useCallback((): number => {
    try {
      const videoEl = videoRef.current;
      const stream = (videoEl?.srcObject as MediaStream | null) ?? null;
      const track = stream?.getVideoTracks?.()?.[0] ?? null;
      if (!track || typeof track.getSettings !== "function") return 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const settings = track.getSettings() as any;
      const focusDistance = settings?.focusDistance;
      // Per spec this is "double" in meters. Many browsers don't implement it.
      if (
        typeof focusDistance !== "number" ||
        !Number.isFinite(focusDistance) ||
        focusDistance <= 0
      ) {
        return 0;
      }
      const inches = focusDistance * 39.3701;
      // Clamp to a reasonable human-held range for display/logic.
      const clamped = Math.max(0, Math.min(96, inches));
      return Math.round(clamped * 10) / 10;
    } catch {
      return 0;
    }
  }, [videoRef]);

  const videoEl = videoRef.current ?? null;
  const qualityMetricsEnabled =
    enabled &&
    scanMode === "camera" &&
    (scannerSettings.autoCapture ||
      scannerSettings.showQualityIndicators ||
      scannerSettings.showStatusBar);
  const liveQuality = useLiveQualityMetrics({
    enabled: qualityMetricsEnabled,
    videoEl,
    // When auto-capture is enabled we sample a bit more often; otherwise keep it low to
    // protect UI responsiveness while still providing a meaningful status bar.
    sampleFps: scannerSettings.autoCapture ? 4 : 2,
    sampleSize: { width: 112, height: 84 },
  });

  // Many devices/browsers don't expose controllable focus state. In those cases we rely on
  // sharpnessScore rather than blocking auto-capture entirely.
  const focusOk =
    focusState === "unsupported" ||
    focusState === "locked" ||
    focusState === "manual" ||
    focusState === "searching";
  const qualityScore = liveQuality.scores.qualityScore;
  const lightingScore = liveQuality.scores.lightingScore;
  const sharpnessScore = liveQuality.scores.sharpnessScore;

  const cancelAutoCapture = React.useCallback(() => {
    setAutoCapturing(false);
    setAutoCaptureCountdown(0);
  }, []);

  // Device motion for stabilization (throttled to reduce render load)
  React.useEffect(() => {
    if (!enabled) return;
    if (scanMode !== "camera") return;

    const handleMotion = (event: DeviceMotionEvent) => {
      const now = performance.now();
      // These can fire at ~60Hz. Keep it low to protect UI thread.
      if (now - lastMotionAtRef.current < 180) return;
      lastMotionAtRef.current = now;

      const acc = event.accelerationIncludingGravity;
      if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        if (stabilityRef.current) {
          const diff =
            Math.abs(acc.x - stabilityRef.current.x) +
            Math.abs(acc.y - stabilityRef.current.y) +
            Math.abs(acc.z - stabilityRef.current.z);
          const nextStable = diff < 0.5;
          setIsStabilized(prev => (prev === nextStable ? prev : nextStable));
        }
        stabilityRef.current = { x: acc.x, y: acc.y, z: acc.z };
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [enabled, scanMode]);

  // Device orientation for tilt detection (throttled)
  React.useEffect(() => {
    if (!enabled) return;
    if (scanMode !== "camera") return;
    if (!scannerSettings.showTiltIndicator) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const now = performance.now();
      if (now - lastOrientAtRef.current < 160) return;
      lastOrientAtRef.current = now;

      if (event.beta !== null && event.gamma !== null) {
        const nextX = Math.round(event.gamma); // Left-right tilt
        const nextY = Math.round(event.beta - 90); // Forward-back tilt (adjusted for holding phone)
        setTiltX(prev => (prev === nextX ? prev : nextX));
        setTiltY(prev => (prev === nextY ? prev : nextY));
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [enabled, scanMode, scannerSettings.showTiltIndicator]);

  React.useEffect(() => {
    if (!enabled) return;
    if (scanMode !== "camera") return;
    if (!scannerSettings.showDistanceIndicator) return;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const next = readEstimatedDistanceInches();
      setEstimatedDistance(prev => (prev === next ? prev : next));
    };

    // Initial read (fast UI feedback), then poll at a low rate.
    tick();
    const interval = window.setInterval(tick, 900);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [enabled, scanMode, scannerSettings.showDistanceIndicator, readEstimatedDistanceInches]);

  // Auto-capture arming logic
  React.useEffect(() => {
    if (!enabled) return;
    if (scanMode !== "camera") return;
    if (!scannerSettings.autoCapture) return;
    if (autoCapturing) return;
    if (autoCaptureCountdown > 0) return;

    const lightingOk = brightness >= 80 && brightness <= 120;
    const stabilityOk = isStabilized;
    const tiltOk = Math.abs(tiltX) < 10 && Math.abs(tiltY) < 10;
    const distanceOk =
      !scannerSettings.showDistanceIndicator ||
      // If we can't estimate distance on this device/browser, don't block auto-capture.
      estimatedDistance <= 0 ||
      (estimatedDistance >= 12 && estimatedDistance <= 18);

    // Require focus + quality thresholds for real scanner-grade auto-capture.
    const qualityOk = qualityScore >= 70 && sharpnessScore >= 60;

    if (lightingOk && stabilityOk && tiltOk && distanceOk && focusOk && qualityOk) {
      setAutoCapturing(true);
      setAutoCaptureCountdown(scannerSettings.autoCaptureDelay);

      if (scannerSettings.hapticFeedback && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  }, [
    enabled,
    scanMode,
    scannerSettings.autoCapture,
    scannerSettings.autoCaptureDelay,
    scannerSettings.hapticFeedback,
    scannerSettings.showDistanceIndicator,
    brightness,
    isStabilized,
    tiltX,
    tiltY,
    estimatedDistance,
    autoCapturing,
    autoCaptureCountdown,
    focusOk,
    qualityScore,
    sharpnessScore,
  ]);

  // Auto-capture countdown
  React.useEffect(() => {
    if (!enabled) return;
    if (!autoCapturing) return;
    if (scanMode !== "camera") return;

    if (autoCaptureCountdown > 0) {
      const t = window.setTimeout(() => {
        setAutoCaptureCountdown(v => Math.max(0, v - 1));
      }, 1000);
      return () => window.clearTimeout(t);
    }

    // Countdown reached 0
    if (autoCaptureCountdown === 0) {
      onAutoCaptureNow();
      setAutoCapturing(false);
    }
  }, [enabled, autoCapturing, autoCaptureCountdown, scanMode, onAutoCaptureNow]);

  // Reset telemetry when leaving camera mode
  React.useEffect(() => {
    if (!enabled) return;
    if (scanMode === "camera") return;
    setIsStabilized(false);
    setTiltX(0);
    setTiltY(0);
    setEstimatedDistance(0);
    setAutoCapturing(false);
    setAutoCaptureCountdown(0);
  }, [enabled, scanMode]);

  const value = React.useMemo(
    () => ({
      enabled,
      scanMode,
      isStabilized,
      tiltX,
      tiltY,
      estimatedDistance,
      autoCapturing,
      autoCaptureCountdown,
      qualityScore,
      lightingScore,
      sharpnessScore,
      focusOk,
      cancelAutoCapture,
    }),
    [
      enabled,
      scanMode,
      isStabilized,
      tiltX,
      tiltY,
      estimatedDistance,
      autoCapturing,
      autoCaptureCountdown,
      qualityScore,
      lightingScore,
      sharpnessScore,
      focusOk,
      cancelAutoCapture,
    ],
  );

  return (
    <ScannerTelemetryContext.Provider value={value}>{children}</ScannerTelemetryContext.Provider>
  );
}
