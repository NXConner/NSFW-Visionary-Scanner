export type ScanMode = "idle" | "camera" | "countdown" | "scanning" | "processing" | "complete";
export type GridMode = "none" | "thirds" | "center" | "measure" | "positioning";

export interface MeasurementResult {
  length: number;
  circumference: number;
  curvatureAngle: number;
  curvatureDirection: string;
}
