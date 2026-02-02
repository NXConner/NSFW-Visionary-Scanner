export type JsonObject = Record<string, unknown>;

export interface RoutineExercise {
  id: string;
  name: string;
  description?: string | null;
  sets: number;
  reps?: number | null;
  duration_seconds?: number | null;
  rest_seconds: number;
  intensity?: "low" | "medium" | "high" | null;
  order: number;
}

export interface RoutineTemplate {
  id: string;
  template_name: string;
  description: string;
  category:
    | "beginner"
    | "intermediate"
    | "advanced"
    | "recovery"
    | "maintenance"
    | "intensive"
    | "custom"
    | "stretching"
    | "jelqing"
    | null;
  exercises: RoutineExercise[];
  duration_weeks?: number | null;
  sessions_per_week?: number | null;
  estimated_time_per_session_minutes: number | null;
  difficulty_level: number | null;
  intensity_level: "low" | "moderate" | "high" | "very_high" | null;
  target_goals?: string[] | null;
  expected_outcomes?: string | null;
  has_video_guidance: boolean;
  video_urls?: JsonObject | null;
  equipment_required?: string[] | null;
  experience_required?: string | null;
  time_commitment?: string | null;
  created_by?: string | null;
  is_system_template: boolean;
  is_premium: boolean;
  is_featured: boolean;
  is_verified: boolean;
  usage_count: number;
  success_rate?: number | null;
  average_rating?: number | null;
  rating_count?: number;
  review_count?: number;
  created_at: string;
  updated_at: string;
}

export interface IntervalTimer {
  id: string;
  name: string;
  type: "work" | "rest" | "prepare" | "cooldown";
  duration_seconds: number;
  is_active: boolean;
  audio_cue?: string | null;
}

export interface ActiveSession {
  id: string;
  template_id?: string;
  routine_name: string;
  exercises: RoutineExercise[];
  current_exercise_index: number;
  current_set: number;
  is_resting: boolean;
  elapsed_seconds: number;
  started_at: Date;
  paused_at?: Date;
}

export interface RoutinePreferences {
  defaultRestSeconds: number;
  audioEnabled: boolean;
  audioCueVolume: number;
  vibrationEnabled: boolean;
  countdownBeeps: boolean;
  autoAdvance: boolean;
}
