export type ScannerDistributionChannel = "store" | "direct" | (string & {});

export type ScannerAppVariant = "sfw" | "hybrid" | "nsfw" | (string & {});

export type ScannerConsentScope =
  | "camera"
  | "local_processing"
  | "local_storage"
  | "cloud_processing"
  | "cloud_backup"
  | "export_share";

export type ScannerPrivacyMode = "local_only" | "cloud_opt_in";

export type ScanUnitSystem = "metric" | "imperial";

export interface ScanCalibration {
  /**
   * Pixels per millimeter calibration.
   * When absent, outputs in real-world units MUST be considered estimated/unknown.
   */
  pixelsPerMm?: number;

  /** Identifies how calibration was obtained (for audit/debug/export). */
  source: "none" | "reference-object" | "device-profile" | "distance-estimated";

  /** Optional label shown in exports (e.g., "credit-card", "ruler"). */
  referenceLabel?: string;

  /** 0..1 confidence for the calibration itself (not the scan). */
  calibrationConfidence?: number;
}

export interface ScanCaptureMeta {
  createdAt: string;
  mimeType: "image/jpeg" | "image/webp" | "image/png" | (string & {});
  width: number;
  height: number;
  orientation?: "upright" | "rotated-90" | "rotated-180" | "rotated-270" | "unknown";
  platform: "web" | "capacitor";
  deviceModel?: string;
}

export interface ScanOutputs {
  curvatureAngleDeg: number;
  curvatureDirection: "dorsal" | "ventral" | "lateral-left" | "lateral-right" | "unknown";
  lengthPx: number;
  lengthMm?: number;
  confidence: number; // 0..100
  warnings?: string[];
}

export interface ScanArtifacts {
  /**
   * Note: for performance, internal processing should prefer Blob/ImageBitmap.
   * Data URLs are acceptable only at UI/legacy boundaries.
   */
  originalImageDataUrl?: string;
  annotatedImageDataUrl?: string;
}

export interface ScanSessionRecord {
  id: string;
  createdAt: string;
  inputs: {
    calibration: ScanCalibration;
    unitSystem: ScanUnitSystem;
    privacyMode: ScannerPrivacyMode;
  };
  capture: ScanCaptureMeta;
  outputs: ScanOutputs;
  artifacts?: ScanArtifacts;
  notes?: string | null;
  tags?: string[] | null;
}
