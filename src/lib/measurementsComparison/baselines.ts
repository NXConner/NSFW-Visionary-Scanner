import { readOptionalNumberEnv } from "./units";

export type BaselineReadResult = {
  key: string;
  valueCm: number | null;
  isConfigured: boolean;
  isPlausible: boolean;
  warning: string | null;
};

type Range = { min: number; max: number };

export function readBaselineCm(key: string, range: Range): BaselineReadResult {
  const valueCm = readOptionalNumberEnv(key);
  const isConfigured = valueCm != null;
  if (!isConfigured) {
    return { key, valueCm: null, isConfigured: false, isPlausible: true, warning: null };
  }
  const isPlausible = Number.isFinite(valueCm) && valueCm >= range.min && valueCm <= range.max;
  const warning = isPlausible
    ? null
    : `Value looks out of range (${range.min}–${range.max} cm). Check that ${key} is set in centimeters.`;
  return { key, valueCm, isConfigured: true, isPlausible, warning };
}

/**
 * Research-backed baseline (centimeters).
 *
 * Default source:
 * - Veale D, Miles S, Bramley S, et al. Am I normal? A systematic review and construction of
 *   nomograms for flaccid and erect penis length and circumference in up to 15,521 men.
 *   BJU Int. 2015;115(6):978–986.
 *
 * Notes:
 * - These values are population means; real-world variation is large.
 * - Measurement protocol (bone-pressed vs non-bone-pressed, tool, arousal quality) matters.
 */
export const AVERAGE_MAN_BASELINE = {
  // Commonly referenced means (erect).
  erectLengthCm: 13.12,
  erectGirthCm: 11.66,

  // Additional reference points (optional context).
  flaccidLengthCm: 9.16,
  flaccidGirthCm: 9.31,
  stretchedFlaccidLengthCm: 13.24,
} as const;

/**
 * Approximate percentiles (centimeters) from the same Veale et al. meta-analysis.
 *
 * Notes:
 * - These are population-level reference points (not a medical diagnostic).
 * - Percentiles are approximate because studies differ in protocol and sampling.
 */
export const AVERAGE_MAN_PERCENTILES = {
  erectLengthCm: { p5: 10.04, p50: 13.12, p95: 16.53 },
  erectGirthCm: { p5: 9.63, p50: 11.66, p95: 13.52 },
} as const;

export type AverageManBaselineKey = "length" | "girth";

export type AverageManBaselineRead = {
  valueCm: number;
  source: "env" | "default";
  envKeyUsed: string | null;
};

function readAverageManOverride(key: AverageManBaselineKey): AverageManBaselineRead | null {
  // Backward compatible precedence:
  // 1) Explicit average-man keys
  // 2) Older "global average" keys used by the comparison card
  const explicitEnvKey =
    key === "length" ? "VITE_AVERAGE_MAN_LENGTH_CM" : "VITE_AVERAGE_MAN_GIRTH_CM";
  const legacyEnvKey = key === "length" ? "VITE_GLOBAL_AVG_LENGTH_CM" : "VITE_GLOBAL_AVG_GIRTH_CM";

  const explicit = readOptionalNumberEnv(explicitEnvKey);
  if (explicit != null && Number.isFinite(explicit) && explicit > 0) {
    return { valueCm: explicit, source: "env", envKeyUsed: explicitEnvKey };
  }

  const legacy = readOptionalNumberEnv(legacyEnvKey);
  if (legacy != null && Number.isFinite(legacy) && legacy > 0) {
    return { valueCm: legacy, source: "env", envKeyUsed: legacyEnvKey };
  }

  return null;
}

export function getAverageManBaselineCm(): {
  length: AverageManBaselineRead;
  girth: AverageManBaselineRead;
} {
  const lengthOverride = readAverageManOverride("length");
  const girthOverride = readAverageManOverride("girth");

  return {
    length: lengthOverride ?? {
      valueCm: AVERAGE_MAN_BASELINE.erectLengthCm,
      source: "default",
      envKeyUsed: null,
    },
    girth: girthOverride ?? {
      valueCm: AVERAGE_MAN_BASELINE.erectGirthCm,
      source: "default",
      envKeyUsed: null,
    },
  };
}

export function getAverageManPercentilesCm(): typeof AVERAGE_MAN_PERCENTILES {
  return AVERAGE_MAN_PERCENTILES;
}
