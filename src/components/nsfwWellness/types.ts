/**
 * NSFW Wellness Analytics Types (UI + domain)
 *
 * The source of truth for persisted data types is the Supabase-backed library:
 *   "@/lib/nsfwSexualWellnessAnalytics"
 *
 * UI components may define their own form-state shapes as needed, but anything
 * that represents a persisted row should use these exported types.
 */

import type {
  NSFWFrequencyTracking,
  NSFWLibidoTracking,
  NSFWSatisfactionTracking,
  NSFWSexualFunctionTracking,
  NSFWWellnessScore,
} from "@/lib/nsfwSexualWellnessAnalytics";

export type {
  NSFWFrequencyTracking,
  NSFWLibidoTracking,
  NSFWSatisfactionTracking,
  NSFWSexualFunctionTracking,
  NSFWWellnessScore,
};

export type WellnessTabKey = "function" | "libido" | "satisfaction" | "frequency" | "wellness";

export type ErectionQuality = "none" | "partial" | "full" | "rigid";
