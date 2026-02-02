export type MeasurementState = "unknown" | "flaccid" | "erect" | "paired";

export type MeasurementMethod = "unknown" | "bone-pressed" | "non-bone-pressed";
export type MeasurementTool = "unknown" | "tape" | "ruler" | "calipers" | "other";
export type MeasurementPosition = "unknown" | "standing" | "sitting" | "lying";
export type TimeOfDay = "unknown" | "morning" | "afternoon" | "evening" | "night";

export type MeasurementContext = {
  state?: MeasurementState;
  method?: MeasurementMethod;
  tool?: MeasurementTool;
  position?: MeasurementPosition;
  timeOfDay?: TimeOfDay;
  temperatureC?: number | null;

  // Subjective/behavioral context (all optional; no assumptions).
  arousalScore?: number | null; // 0..10
  erectionQuality?: number | null; // 0..10 (only meaningful when erect/paired)
  hydrationScore?: number | null; // 0..10
  stressScore?: number | null; // 0..10
  sleepHours?: number | null; // 0..24

  // Recent factors (optional)
  workoutRecent?: boolean | null;
  pumpRecent?: boolean | null;
  alcoholUnits?: number | null; // e.g., standard drinks
  caffeineMg?: number | null;
  nicotine?: boolean | null;

  // Timing deltas (optional, in hours)
  ejaculationWithinHours?: number | null;
  edgingWithinHours?: number | null;
};

export type GrowerShowersClassification = "insufficient-data" | "grower" | "shower" | "hybrid";

export type GrowersVsShowersSummary = {
  classification: GrowerShowersClassification;
  rationale: string;
  sample: {
    flaccidCount: number;
    erectCount: number;
    pairedCount: number;
    totalScans: number;
  };
  averages: {
    flaccidLengthCm: number | null;
    flaccidGirthCm: number | null;
    erectLengthCm: number | null;
    erectGirthCm: number | null;
  };
  deltas: {
    lengthCm: number | null;
    lengthPercent: number | null;
    girthCm: number | null;
    girthPercent: number | null;
  };
  thresholds: {
    // Classification is based on length delta (cm); thresholds exposed for transparency.
    showerMaxDeltaCm: number;
    growerMinDeltaCm: number;
  };
  insights: Array<{
    key: string;
    title: string;
    description: string;
    sampleSize: number;
  }>;
  warnings: string[];
};
