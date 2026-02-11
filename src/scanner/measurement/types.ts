export type CurvatureDirection =
  | "dorsal" // upward
  | "ventral" // downward
  | "lateral-left"
  | "lateral-right"
  | "unknown";

/** Curvature type classification based on PMC10150132 methodology */
export type CurvatureType = "hinge" | "arc" | "complex" | "straight";

/** Detection method for curvature measurement */
export type CurvatureMethod = "4-point-landmark" | "centerline-fallback";

export type MeasurementUnits = "mm" | "cm" | "in";

export type CalibrationSource = "reference-object" | "on-screen-ruler" | "none";

export interface Calibration {
  /**
   * Pixels per millimeter. This is the canonical conversion factor.
   * If not present, length estimates are returned in px only.
   */
  pixelsPerMm?: number;
  source: CalibrationSource;
  /**
   * Optional metadata (e.g., selected reference object)
   */
  referenceLabel?: string;
}

export interface ScanInputs {
  /** Captured image as data URL (jpeg/webp/png). */
  imageDataUrl: string;
  /** Optional multi-angle images (data URLs) for advanced workflows. */
  additionalAngles?: Array<{ angleId: string; imageDataUrl: string }>;
  calibration?: Calibration;
  /** For UI overlays; not required for analysis. */
  requestedUnits?: MeasurementUnits;
}

export interface MeasurementDebugInfo {
  version: string;
  image: { width: number; height: number };
  preprocessing: { downscale: number; grayscale: boolean };
  edges: { threshold: number; edgePx: number; edgeDensity: number };
  contour: { points: number; componentCount: number };
  fit: {
    rotated: boolean;
    polynomialDegree: number;
    rmse: number;
    samples: number;
  };
  length: { px: number; mm?: number };
  warnings: string[];
}

export interface MeasurementResult {
  /** Curvature angle in degrees (0..90). */
  curvatureAngleDeg: number;
  curvatureDirection: CurvatureDirection;
  /** Curvature type (hinge vs arc) - PMC10150132 classification */
  curvatureType?: CurvatureType;
  /** Detection method used for curvature */
  curvatureMethod?: CurvatureMethod;
  /** Curvature detection confidence (0-1) */
  curvatureConfidence?: number;
  /** Length estimate (if calibrated), plus raw px length. */
  lengthPx: number;
  lengthMm?: number;
  lengthCm?: number;
  lengthIn?: number;
  /** Girth/circumference estimate (if calibrated), plus raw px. */
  girthPx?: number;
  girthMm?: number;
  girthCm?: number;
  girthIn?: number;
  /** Average width in pixels (diameter). */
  avgWidthPx?: number;
  /** Confidence 0..100. */
  confidence: number;
  /** Annotated image (data URL) showing the extracted curve + measurements. */
  annotatedImageDataUrl: string;
  /**
   * Optional internal geometry (not required for export).
   * Centerline polyline in original image pixel coordinates.
   */
  centerlinePx?: Array<{ x: number; y: number }>;
  /** 4-point landmark positions for curvature visualization */
  landmarkPoints?: Array<{
    position: { x: number; y: number };
    type: "D1" | "D2" | "P1" | "P2";
    confidence: number;
  }>;
  /** Machine-readable export payload (JSON-safe). */
  export: {
    createdAt: string;
    inputs: {
      calibration?: Calibration;
    };
    outputs: {
      curvatureAngleDeg: number;
      curvatureDirection: CurvatureDirection;
      curvatureType?: CurvatureType;
      curvatureMethod?: CurvatureMethod;
      lengthPx: number;
      lengthMm?: number;
      girthPx?: number;
      girthMm?: number;
      girthCm?: number;
      confidence: number;
    };
    debug?: MeasurementDebugInfo;
  };
}
