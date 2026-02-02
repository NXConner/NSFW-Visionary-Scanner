export type UnitSystem = "dual" | "metric" | "imperial";

export type PressureUnitSystem = "dual" | "imperial" | "metric";

export type MeasurementPoint = {
  lengthCm: number;
  girthCm: number;
  capturedAtIso?: string;
};

export type MeasurementSummary = {
  avgLengthCm: number | null;
  avgGirthCm: number | null;
  sampleSize: number;
};

export type CommunityAverages = {
  sampleSize: number;
  isSufficient: boolean;
  isPlaceholder?: boolean;
  avgLengthCm: number | null;
  avgGirthCm: number | null;
  windowDays: number;
  computedAtIso: string;
  placeholderNote?: string;
};
