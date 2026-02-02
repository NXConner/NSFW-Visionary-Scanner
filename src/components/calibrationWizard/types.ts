import type React from "react";

export type ReferenceType = "credit-card" | "ruler" | "quarter" | "nickel" | "dime" | "custom";

export interface CalibrationData {
  referenceType: ReferenceType;
  referenceWidth: number; // in mm
  referenceHeight: number; // in mm
  pixelsPerMm: number;
  isCalibrated: boolean;
  calibrationDate: Date | null;
  /**
   * 0..1 confidence score based on how consistent the reference geometry is.
   * Used to warn users about skew/poor corner selection without blocking completion.
   */
  calibrationConfidence?: number;
  /**
   * Debug/quality metrics to help users understand calibration quality.
   */
  calibrationDiagnostics?: {
    pixelsPerMmWidth: number;
    pixelsPerMmHeight: number;
    skewPercent: number; // 0..100, higher = worse
    avgWidthPx: number;
    avgHeightPx: number;
  };
}

export interface PointPercent {
  x: number; // 0..100
  y: number; // 0..100
}

export interface CalibrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCalibrationComplete: (data: CalibrationData) => void;
  /**
   * Optional video ref from an external surface (e.g. scanner view).
   * If provided and active, we mirror its stream into this wizard's internal preview.
   */
  videoRef?: React.RefObject<HTMLVideoElement>;
}
