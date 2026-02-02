export interface EnhancedDiaryEntry {
  id: string;
  user_id: string;
  base_entry_id: string | null;
  entry_date: string;
  entry_time: string | null;
  symptoms: Array<Record<string, unknown>> | null;
  symptom_count: number;
  medications: Array<Record<string, unknown>> | null;
  medication_count: number;
  mood_score: number | null;
  mood_label: "excellent" | "good" | "okay" | "poor" | "terrible" | null;
  mood_notes: string | null;
  mood_tags: string[] | null;
  energy_level: number | null;
  energy_notes: string | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
  sleep_start_time: string | null;
  sleep_end_time: string | null;
  sleep_notes: string | null;
  sleep_interruptions: number;
  meals: Array<Record<string, unknown>> | null;
  total_calories: number | null;
  water_intake_ml: number | null;
  diet_notes: string | null;
  exercises: Array<Record<string, unknown>> | null;
  total_exercise_minutes: number | null;
  exercise_notes: string | null;
  photos: Array<Record<string, unknown>> | null;
  photo_count: number;
  voice_notes: Array<Record<string, unknown>> | null;
  voice_note_count: number;
  notes: string | null;
  tags: string[] | null;
  weather: string | null;
  temperature_celsius: number | null;
  location: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiaryTemplate {
  id: string;
  user_id: string | null;
  template_name: string;
  description: string | null;
  category:
    | "daily"
    | "weekly"
    | "health_focus"
    | "symptom_tracking"
    | "medication"
    | "exercise"
    | "custom"
    | null;
  template_config: Record<string, unknown>;
  required_fields: string[] | null;
  optional_fields: string[] | null;
  default_values: Record<string, unknown> | null;
  usage_count: number;
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationSchedule {
  id: string;
  user_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  times_per_day: number | null;
  specific_times: string[] | null;
  days_of_week: number[] | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  reminder_enabled: boolean;
  reminder_minutes_before: number;
  total_doses: number;
  missed_doses: number;
  adherence_percentage: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiaryAnalytics {
  id: string;
  user_id: string;
  analysis_period_start: string;
  analysis_period_end: string;
  total_entries: number;
  entries_with_symptoms: number;
  entries_with_medications: number;
  entries_with_photos: number;
  entries_with_voice_notes: number;
  average_mood_score: number | null;
  average_energy_level: number | null;
  average_sleep_hours: number | null;
  average_sleep_quality: number | null;
  total_calories: number | null;
  total_water_intake_ml: number | null;
  total_exercise_minutes: number | null;
  most_common_symptoms: unknown;
  most_common_moods: string[] | null;
  activity_patterns: unknown;
  mood_trend: "improving" | "stable" | "declining" | "fluctuating" | null;
  energy_trend: string | null;
  sleep_trend: string | null;
  insights: string[] | null;
  recommendations: string[] | null;
  calculated_at: string;
  created_at: string;
}
