import type { CurvatureCaptureView } from "@/components/scannerOverlays/CurvatureScanOverlay";
import type { CurvatureDirection } from "@/scanner/measurement/types";

export type CurvatureScannerStep = "dorsal" | "lateral" | "results";

export interface CurvatureScanImage {
  view: CurvatureCaptureView;
  /** Raw captured image (data URL). */
  rawImageDataUrl: string;
  /** Annotated image after processing (data URL). */
  annotatedImageDataUrl?: string;
}

export interface CurvatureScanResult {
  view: CurvatureCaptureView;
  curvatureAngleDeg: number;
  curvatureDirection: CurvatureDirection;
  lengthCm?: number;
  confidence: number;
}

export interface CurvatureScanSession {
  id: string;
  createdAt: string; // ISO
  dorsal?: CurvatureScanResult;
  lateral?: CurvatureScanResult;
  estimatedLengthCm?: number;
  overallConfidence?: number;
  /**
   * Optional calibration snapshot used for this session.
   * (Stored locally only; does not imply images are uploaded anywhere.)
   */
  calibration?: {
    pixelsPerMm?: number;
    source?: "reference-object" | "on-screen-ruler" | "none";
    referenceLabel?: string;
  };
  /**
   * Optional base-anchored refinement flags.
   */
  refined?: {
    dorsal?: boolean;
    lateral?: boolean;
  };
  /**
   * Optional processing warnings captured at scan time.
   */
  warnings?: {
    dorsal?: string[];
    lateral?: string[];
  };
  /**
   * Optional annotated images (privacy toggle, encrypted at rest in localStorage).
   * NOTE: storing images may increase localStorage size dramatically.
   */
  images?: {
    dorsalAnnotated?: string;
    lateralAnnotated?: string;
  };
  /**
   * Direction interpretation settings used at save-time, for repeatability.
   */
  interpretation?: {
    flipTopViewLeftRight?: boolean;
    flipSideViewDorsalVentral?: boolean;
  };
  notes?: string;
}

