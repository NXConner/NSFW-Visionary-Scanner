/**
 * NSFW Wellness Analytics Types
 * Shared type definitions for wellness tracking modules
 */

export type ErectionQuality = "none" | "partial" | "full" | "rigid";

export interface NSFWSexualFunctionTracking {
  entry_date: string;
  erectile_function_score?: number;
  erection_quality?: ErectionQuality;
  erection_duration_minutes?: number;
  stamina_minutes?: number;
  satisfaction_score?: number;
  notes?: string;
}

export interface NSFWLibidoTracking {
  entry_date: string;
  libido_score: number;
  desire_level: number;
  spontaneous_thoughts: number;
  notes?: string;
}

export interface NSFWSatisfactionTracking {
  entry_date: string;
  overall_satisfaction: number;
  emotional_satisfaction: number;
  physical_satisfaction: number;
  notes?: string;
}

export interface NSFWFrequencyTracking {
  entry_date: string;
  activity_count: number;
  solo_count: number;
  partner_count: number;
  notes?: string;
}

export interface NSFWWellnessScore {
  date: string;
  overall_score: number;
  function_score: number;
  libido_score: number;
  satisfaction_score: number;
  frequency_score: number;
}
