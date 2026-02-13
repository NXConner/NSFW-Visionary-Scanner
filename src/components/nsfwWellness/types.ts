/**
 * NSFW Wellness Analytics Types
 * Prefer the canonical DB-backed types from `src/lib/nsfwSexualWellnessAnalytics.ts`.
 */

import type { NSFWSexualFunctionTracking as SexualFunctionTrackingDb } from "@/lib/nsfwSexualWellnessAnalytics";

export type {
  NSFWSexualFunctionTracking,
  NSFWLibidoTracking,
  NSFWSatisfactionTracking,
  NSFWFrequencyTracking,
  NSFWWellnessScore,
} from "@/lib/nsfwSexualWellnessAnalytics";

export type ErectionQuality = NonNullable<SexualFunctionTrackingDb["erection_quality"]>;
