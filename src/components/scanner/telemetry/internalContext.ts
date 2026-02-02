import * as React from "react";

import type { ScannerTelemetryContextValue } from "@/components/scanner/telemetry/types";
import type { ScanMode } from "@/components/scanner/types";

export const DEFAULT_SCANNER_TELEMETRY: ScannerTelemetryContextValue = {
  enabled: false,
  scanMode: "idle" as ScanMode,
  isStabilized: false,
  tiltX: 0,
  tiltY: 0,
  estimatedDistance: 0,
  autoCapturing: false,
  autoCaptureCountdown: 0,
  qualityScore: 0,
  lightingScore: 0,
  sharpnessScore: 0,
  focusOk: false,
  cancelAutoCapture: () => {},
};

export const ScannerTelemetryContext = React.createContext<ScannerTelemetryContextValue | null>(
  null,
);
