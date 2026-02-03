import type { LICENSE_STATUSES, LICENSE_TYPES } from "./constants";

export type LicenseType = (typeof LICENSE_TYPES)[number];
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];

export type ContentLicensor = {
  id: string;
  name: string;
  website_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  jurisdiction: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ContentLicense = {
  id: string;
  license_key: string;
  license_name: string;
  license_type: LicenseType;
  licensor_id: string | null;
  exclusive: boolean;
  start_date: string | null;
  end_date: string | null;
  territory: string | null;
  languages: string[];
  allowed_content_types: string[];
  allowed_platforms: string[];
  distribution_channels: string[];
  allows_educational: boolean;
  allows_demonstrative: boolean;
  allows_explicit: boolean;
  requires_attribution: boolean;
  attribution_text: string | null;
  edit_rights: boolean;
  derivative_rights: boolean;
  sublicensing_rights: boolean;
  marketing_rights: boolean;
  watermark_required: boolean;
  contract_storage_path: string | null;
  contract_sha256: string | null;
  requires_2257: boolean;
  status: LicenseStatus;
  is_active: boolean;
  terms: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type LicenseWithLicensor = ContentLicense & {
  licensor_name: string | null;
};

export type LicenseCoverageSummary = {
  totalVideos: number;
  missingLicense: number;
  unverifiedLicense: number;
};
