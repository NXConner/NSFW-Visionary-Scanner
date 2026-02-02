export interface ProstateHealthEntry {
  id: string;
  user_id: string;
  entry_date: string;
  psa_level: number | null;
  symptoms: string[];
  pain_level: number | null;
  urination_frequency: number | null;
  urination_difficulty: "none" | "mild" | "moderate" | "severe" | null;
  blood_in_urine: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TesticularHealthEntry {
  id: string;
  user_id: string;
  entry_date: string;
  self_exam_performed: boolean;
  abnormalities_found: boolean;
  abnormality_description: string | null;
  pain_level: number | null;
  swelling: boolean;
  lumps_detected: boolean;
  size_changes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SexualHealthEntry {
  id: string;
  user_id: string;
  entry_date: string;
  erectile_function_score: number | null;
  libido_level: number | null;
  satisfaction_level: number | null;
  frequency_per_week: number | null;
  orgasm_quality: number | null;
  premature_ejaculation: boolean;
  delayed_ejaculation: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface HormoneLevel {
  id: string;
  user_id: string;
  test_date: string;
  testosterone_total: number | null;
  testosterone_free: number | null;
  lh: number | null;
  fsh: number | null;
  prolactin: number | null;
  shbg: number | null;
  notes: string | null;
  lab_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UrinaryHealthEntry {
  id: string;
  user_id: string;
  entry_date: string;
  frequency_per_day: number | null;
  urgency_level: number | null;
  nocturia_count: number | null;
  incontinence: boolean;
  incontinence_type: "stress" | "urge" | "overflow" | "functional" | "mixed" | null;
  stream_strength: number | null;
  incomplete_emptying: boolean;
  pain_on_urination: boolean;
  blood_in_urine: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SexualWellnessScore {
  id: string;
  user_id: string;
  entry_date: string;
  overall_score: number;
  physical_score: number;
  emotional_score: number;
  relationship_score: number;
  factors: Record<string, unknown> | null;
  created_at: string;
}

export interface HealthRiskFactor {
  id: string;
  user_id: string;
  risk_type: "prostate" | "testicular" | "sexual" | "urinary" | "general";
  risk_level: "low" | "moderate" | "high" | "very_high";
  risk_factors: string[];
  recommendations: string[];
  assessed_at: string;
  created_at: string;
}

export interface HealthAlert {
  id: string;
  user_id: string;
  alert_type: "warning" | "caution" | "info" | "reminder";
  category: "prostate" | "testicular" | "sexual" | "urinary" | "general";
  title: string;
  message: string;
  action_required: boolean;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface HealthSummary {
  prostate: { latestEntry: ProstateHealthEntry | null; trend: string };
  testicular: { latestEntry: TesticularHealthEntry | null; examsDone: number };
  sexual: { latestEntry: SexualHealthEntry | null; averageScore: number };
  urinary: { latestEntry: UrinaryHealthEntry | null; trend: string };
  wellness: { latestScore: SexualWellnessScore | null; trend: string };
  alerts: HealthAlert[];
}
