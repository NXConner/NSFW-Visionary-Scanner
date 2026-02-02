import type { CalibrationData, ReferenceType } from "@/components/calibrationWizard/types";

export type CalibrationProfileV1 = {
  schemaVersion: 1;
  deviceKey: string;
  createdAt: string;
  updatedAt: string;
  referenceType: ReferenceType;
  referenceWidthMm: number;
  referenceHeightMm: number;
  pixelsPerMm: number;
  calibrationConfidence?: number;
  calibrationDiagnostics?: {
    pixelsPerMmWidth: number;
    pixelsPerMmHeight: number;
    skewPercent: number;
    avgWidthPx: number;
    avgHeightPx: number;
  };
};

export type CalibrationProfile = CalibrationProfileV1;

export function toCalibrationWizardData(profile: CalibrationProfile): CalibrationData {
  return {
    referenceType: profile.referenceType,
    referenceWidth: profile.referenceWidthMm,
    referenceHeight: profile.referenceHeightMm,
    pixelsPerMm: profile.pixelsPerMm,
    isCalibrated: true,
    calibrationDate: new Date(profile.updatedAt),
    calibrationConfidence: profile.calibrationConfidence,
    calibrationDiagnostics: profile.calibrationDiagnostics,
  };
}

export function fromCalibrationWizardData(args: { data: CalibrationData }): CalibrationProfile {
  return {
    schemaVersion: 1,
    deviceKey: "unset",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    referenceType: args.data.referenceType,
    referenceWidthMm: args.data.referenceWidth,
    referenceHeightMm: args.data.referenceHeight,
    pixelsPerMm: args.data.pixelsPerMm,
    calibrationConfidence: args.data.calibrationConfidence,
    calibrationDiagnostics: args.data.calibrationDiagnostics,
  };
}
