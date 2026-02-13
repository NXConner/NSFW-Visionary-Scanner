/**
 * VISIONARY SCANNER CORE TYPES
 * Master schema ensuring 100% parity between Safe and NSFW builds.
 * All scanner logic MUST reference these types.
 */

export interface ScanResult {
  id: string;
  timestamp: string;
  sourceImage: string;
  status: "pending" | "processing" | "completed" | "failed";

  metadata: ScanMetadata;
  analysis: ScanAnalysis;
}

export interface ScanMetadata {
  resolution: { width: number; height: number };
  format: "image/jpeg" | "image/webp" | "image/png" | (string & {});
  fileSize: number;
  deviceInfo?: string;
  platform: "web" | "capacitor";
  orientation?: "upright" | "rotated-90" | "rotated-180" | "rotated-270" | "unknown";
}

export interface ScanAnalysis {
  label: string;
  confidence: number;
  detections: DetectionBox[];

  measurements?: {
    lengthPx: number;
    lengthMm?: number;
    circumferencePx?: number;
    circumferenceMm?: number;
    curvatureAngleDeg: number;
    curvatureDirection: CurvatureDirection;
  };

  /** Gated by CONFIG.version === 'unrestricted' */
  unrestrictedDetails?: UnrestrictedAnalysisDetails;
}

export interface DetectionBox {
  box: [number, number, number, number];
  label: string;
  score: number;
}

export type CurvatureDirection =
  | "dorsal"
  | "ventral"
  | "lateral-left"
  | "lateral-right"
  | "unknown";

export interface UnrestrictedAnalysisDetails {
  rawOutput: unknown;
  sensitiveFlags: string[];
  modelVersion: string;
  enhancedMetrics?: Record<string, number>;
}

export interface ScannerHookOptions {
  autoProcess?: boolean;
  maxResolution?: number;
  enableUnrestricted?: boolean;
}

export interface ScannerHookResult {
  scan: ScanResult | null;
  isProcessing: boolean;
  error: string | null;
  capture: (imageData: string) => Promise<ScanResult>;
  reset: () => void;
}
