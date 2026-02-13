import type { ScanMode } from "@/components/scanner/types";

export type ScannerTelemetryState = {
  /** True when motion deltas indicate a steady hold. */
  isStabilized: boolean;
  /** Left-right tilt (deg), rounded. */
  tiltX: number;
  /** Forward-back tilt (deg), rounded. */
  tiltY: number;
  /**
   * Estimated camera-to-subject distance in inches (best-effort).
   * - Uses real device/browser data when available (e.g. `focusDistance`).
   * - 0 means "unknown" (no reliable estimator available).
   */
  estimatedDistance: number;

  /** Auto-capture is currently armed and waiting for countdown completion. */
  autoCapturing: boolean;
  /** Countdown seconds remaining before auto-capture fires. */
  autoCaptureCountdown: number;

  /** 0..100 composite live quality score (lighting + sharpness) */
  qualityScore: number;
  /** 0..100 live lighting score */
  lightingScore: number;
  /** 0..100 live sharpness score */
  sharpnessScore: number;
  /** True when focus is considered acceptable for capture */
  focusOk: boolean;
};

export type ScannerTelemetryControls = {
  cancelAutoCapture: () => void;
};

export type ScannerTelemetryContextValue = ScannerTelemetryState &
  ScannerTelemetryControls & {
    enabled: boolean;
    scanMode: ScanMode;
  };
