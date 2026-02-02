export type JsonObject = Record<string, unknown>;

export interface HealthcareProvider {
  id: string;
  user_id: string;
  provider_name: string;
  provider_type: string;
  specialty: string[] | null;
  credentials: string[] | null;
  license_number: string | null;
  license_state: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  subscription_tier: string;
  subscription_status: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  hipaa_compliant: boolean;
  hipaa_certification_date: string | null;
  baa_signed: boolean;
  baa_signed_date: string | null;
  max_patients: number;
  current_patient_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientProviderRelationship {
  id: string;
  patient_id: string;
  provider_id: string;
  consent_granted: boolean;
  consent_date: string | null;
  consent_expires_date: string | null;
  consent_scope: string[];
  relationship_type: string;
  status: string;
  access_level: string;
  can_view_scans: boolean;
  can_view_diary: boolean;
  can_view_analytics: boolean;
  can_view_reports: boolean;
  provider_notes: string | null;
  created_at: string;
  updated_at: string;
  patient?: JsonObject;
  provider?: HealthcareProvider;
}

export interface ProviderProfessionalReport {
  id: string;
  provider_id: string;
  patient_id: string;
  report_type: string;
  report_title: string;
  report_content: JsonObject;
  findings: string[] | null;
  recommendations: string[] | null;
  treatment_plan: JsonObject | null;
  report_status: string;
  is_shared_with_patient: boolean;
  shared_at: string | null;
  file_url: string | null;
  file_format: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlan {
  id: string;
  provider_id: string;
  patient_id: string;
  plan_name: string;
  plan_description: string | null;
  plan_data: JsonObject | null;
  goals: string[] | null;
  milestones: string[] | null;
  timeline_days: number | null;
  plan_status: string;
  start_date: string | null;
  end_date: string | null;
  completed_at: string | null;
  progress_percentage: number;
  milestones_completed: number;
  created_at: string;
  updated_at: string;
}

export interface ProviderDashboardMetrics {
  total_patients: number;
  active_patients: number;
  new_patients_this_month: number;
  reports_generated: number;
  active_treatment_plans: number;
  average_patient_engagement: number;
  upcoming_appointments: number;
  unread_messages: number;
}

export type HIPAAAuditLog = JsonObject;
