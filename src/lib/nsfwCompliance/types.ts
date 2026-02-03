import type { CONSENT_STATUSES, PERFORMER_ROLES, RECORD_STATUSES } from "./constants";

export type PerformerRole = (typeof PERFORMER_ROLES)[number];
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];
export type RecordStatus = (typeof RECORD_STATUSES)[number];

export type Nsfw2257Custodian = {
  id: string;
  custodian_name: string;
  custodian_company: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  record_location: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type NsfwPerformerRecord = {
  id: string;
  stage_name: string;
  legal_name: string;
  date_of_birth: string;
  document_type: string | null;
  document_last4: string | null;
  document_issuer: string | null;
  document_expiration: string | null;
  document_storage_path: string | null;
  document_sha256: string | null;
  consent_form_path: string | null;
  consent_signed_at: string | null;
  verified_at: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Nsfw2257Record = {
  id: string;
  record_key: string;
  content_id: string | null;
  custodian_id: string | null;
  production_date: string | null;
  release_date: string | null;
  record_location: string | null;
  record_storage_path: string | null;
  record_sha256: string | null;
  verification_status: RecordStatus;
  verification_notes: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NsfwContentPerformer = {
  id: string;
  content_id: string;
  performer_id: string;
  role: PerformerRole;
  consent_status: ConsentStatus;
  consent_signed_at: string | null;
  age_verified_at: string | null;
  release_form_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NsfwVideoOption = {
  id: string;
  title: string;
  content_slug?: string | null;
};
