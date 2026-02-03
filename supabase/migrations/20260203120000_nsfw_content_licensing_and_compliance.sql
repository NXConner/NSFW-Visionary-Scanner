-- Migration: NSFW content licensing + 2257 compliance (idempotent)
-- Purpose: licensing tracker, ingestion validation support, and record-keeping system

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================
-- Licensing: licensors
-- ============================
CREATE TABLE IF NOT EXISTS public.nsfw_content_licensors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website_url text,
  contact_name text,
  contact_email text,
  jurisdiction text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nsfw_content_licensors_active
  ON public.nsfw_content_licensors(is_active);
CREATE INDEX IF NOT EXISTS idx_nsfw_content_licensors_name
  ON public.nsfw_content_licensors(name);

ALTER TABLE public.nsfw_content_licensors ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='nsfw_content_licensors'
      AND policyname='Admins can manage NSFW licensors'
  ) THEN
    CREATE POLICY "Admins can manage NSFW licensors"
      ON public.nsfw_content_licensors
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_nsfw_content_licensors_updated_at ON public.nsfw_content_licensors;
CREATE TRIGGER update_nsfw_content_licensors_updated_at
  BEFORE UPDATE ON public.nsfw_content_licensors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- Licensing: agreements
-- ============================
CREATE TABLE IF NOT EXISTS public.nsfw_content_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text NOT NULL,
  license_name text NOT NULL,
  license_type text NOT NULL DEFAULT 'non_exclusive',
  licensor_id uuid REFERENCES public.nsfw_content_licensors(id) ON DELETE SET NULL,
  exclusive boolean NOT NULL DEFAULT false,
  start_date date,
  end_date date,
  territory text,
  languages text[] NOT NULL DEFAULT '{}'::text[],
  allowed_content_types text[] NOT NULL DEFAULT '{}'::text[],
  allowed_platforms text[] NOT NULL DEFAULT '{}'::text[],
  distribution_channels text[] NOT NULL DEFAULT '{}'::text[],
  allows_educational boolean NOT NULL DEFAULT true,
  allows_demonstrative boolean NOT NULL DEFAULT true,
  allows_explicit boolean NOT NULL DEFAULT true,
  requires_attribution boolean NOT NULL DEFAULT false,
  attribution_text text,
  edit_rights boolean NOT NULL DEFAULT false,
  derivative_rights boolean NOT NULL DEFAULT false,
  sublicensing_rights boolean NOT NULL DEFAULT false,
  marketing_rights boolean NOT NULL DEFAULT false,
  watermark_required boolean NOT NULL DEFAULT false,
  contract_storage_path text,
  contract_sha256 text,
  requires_2257 boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active',
  is_active boolean NOT NULL DEFAULT true,
  terms jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nsfw_content_licenses_key
  ON public.nsfw_content_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_nsfw_content_licenses_licensor
  ON public.nsfw_content_licenses(licensor_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_content_licenses_status
  ON public.nsfw_content_licenses(status);
CREATE INDEX IF NOT EXISTS idx_nsfw_content_licenses_active
  ON public.nsfw_content_licenses(is_active);
CREATE INDEX IF NOT EXISTS idx_nsfw_content_licenses_end_date
  ON public.nsfw_content_licenses(end_date);

ALTER TABLE public.nsfw_content_licenses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='nsfw_content_licenses'
      AND policyname='Admins can manage NSFW licenses'
  ) THEN
    CREATE POLICY "Admins can manage NSFW licenses"
      ON public.nsfw_content_licenses
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.nsfw_content_licenses') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.nsfw_content_licenses'::regclass
      AND conname = 'nsfw_content_licenses_license_type_check'
  ) THEN
    ALTER TABLE public.nsfw_content_licenses
      ADD CONSTRAINT nsfw_content_licenses_license_type_check
      CHECK (license_type IN ('exclusive', 'non_exclusive', 'time_limited_exclusive', 'content_pool', 'custom'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.nsfw_content_licenses'::regclass
      AND conname = 'nsfw_content_licenses_status_check'
  ) THEN
    ALTER TABLE public.nsfw_content_licenses
      ADD CONSTRAINT nsfw_content_licenses_status_check
      CHECK (status IN ('active', 'pending', 'expired', 'revoked', 'archived'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_nsfw_content_licenses_updated_at ON public.nsfw_content_licenses;
CREATE TRIGGER update_nsfw_content_licenses_updated_at
  BEFORE UPDATE ON public.nsfw_content_licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- 2257 custodians
-- ============================
CREATE TABLE IF NOT EXISTS public.nsfw_2257_custodians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custodian_name text NOT NULL,
  custodian_company text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  phone text,
  email text,
  record_location text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nsfw_2257_custodians_active
  ON public.nsfw_2257_custodians(is_active);

ALTER TABLE public.nsfw_2257_custodians ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='nsfw_2257_custodians'
      AND policyname='Admins can manage NSFW 2257 custodians'
  ) THEN
    CREATE POLICY "Admins can manage NSFW 2257 custodians"
      ON public.nsfw_2257_custodians
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_nsfw_2257_custodians_updated_at ON public.nsfw_2257_custodians;
CREATE TRIGGER update_nsfw_2257_custodians_updated_at
  BEFORE UPDATE ON public.nsfw_2257_custodians
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- Performer records
-- ============================
CREATE TABLE IF NOT EXISTS public.nsfw_performer_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_name text NOT NULL,
  legal_name text NOT NULL,
  date_of_birth date NOT NULL,
  document_type text,
  document_last4 text,
  document_issuer text,
  document_expiration date,
  document_storage_path text,
  document_sha256 text,
  consent_form_path text,
  consent_signed_at timestamptz,
  verified_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nsfw_performer_records_active
  ON public.nsfw_performer_records(is_active);
CREATE INDEX IF NOT EXISTS idx_nsfw_performer_records_stage_name
  ON public.nsfw_performer_records(stage_name);

ALTER TABLE public.nsfw_performer_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='nsfw_performer_records'
      AND policyname='Admins can manage NSFW performer records'
  ) THEN
    CREATE POLICY "Admins can manage NSFW performer records"
      ON public.nsfw_performer_records
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_nsfw_performer_records_updated_at ON public.nsfw_performer_records;
CREATE TRIGGER update_nsfw_performer_records_updated_at
  BEFORE UPDATE ON public.nsfw_performer_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- 2257 records
-- ============================
CREATE TABLE IF NOT EXISTS public.nsfw_2257_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_key text NOT NULL,
  content_id uuid REFERENCES public.nsfw_video_content(id) ON DELETE CASCADE,
  custodian_id uuid REFERENCES public.nsfw_2257_custodians(id) ON DELETE SET NULL,
  production_date date,
  release_date date,
  record_location text,
  record_storage_path text,
  record_sha256 text,
  verification_status text NOT NULL DEFAULT 'pending',
  verification_notes text,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nsfw_2257_records_key
  ON public.nsfw_2257_records(record_key);
CREATE INDEX IF NOT EXISTS idx_nsfw_2257_records_content
  ON public.nsfw_2257_records(content_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_2257_records_status
  ON public.nsfw_2257_records(verification_status);

ALTER TABLE public.nsfw_2257_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='nsfw_2257_records'
      AND policyname='Admins can manage NSFW 2257 records'
  ) THEN
    CREATE POLICY "Admins can manage NSFW 2257 records"
      ON public.nsfw_2257_records
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.nsfw_2257_records') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.nsfw_2257_records'::regclass
      AND conname = 'nsfw_2257_records_status_check'
  ) THEN
    ALTER TABLE public.nsfw_2257_records
      ADD CONSTRAINT nsfw_2257_records_status_check
      CHECK (verification_status IN ('pending', 'verified', 'expired', 'revoked'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_nsfw_2257_records_updated_at ON public.nsfw_2257_records;
CREATE TRIGGER update_nsfw_2257_records_updated_at
  BEFORE UPDATE ON public.nsfw_2257_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- Content performers (link table)
-- ============================
CREATE TABLE IF NOT EXISTS public.nsfw_content_performers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.nsfw_video_content(id) ON DELETE CASCADE,
  performer_id uuid NOT NULL REFERENCES public.nsfw_performer_records(id) ON DELETE RESTRICT,
  role text NOT NULL DEFAULT 'performer',
  consent_status text NOT NULL DEFAULT 'pending',
  consent_signed_at timestamptz,
  age_verified_at timestamptz,
  release_form_path text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(content_id, performer_id)
);

CREATE INDEX IF NOT EXISTS idx_nsfw_content_performers_content
  ON public.nsfw_content_performers(content_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_content_performers_performer
  ON public.nsfw_content_performers(performer_id);

ALTER TABLE public.nsfw_content_performers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='nsfw_content_performers'
      AND policyname='Admins can manage NSFW content performers'
  ) THEN
    CREATE POLICY "Admins can manage NSFW content performers"
      ON public.nsfw_content_performers
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.nsfw_content_performers') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.nsfw_content_performers'::regclass
      AND conname = 'nsfw_content_performers_role_check'
  ) THEN
    ALTER TABLE public.nsfw_content_performers
      ADD CONSTRAINT nsfw_content_performers_role_check
      CHECK (role IN ('performer', 'instructor', 'assistant', 'other'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.nsfw_content_performers'::regclass
      AND conname = 'nsfw_content_performers_consent_status_check'
  ) THEN
    ALTER TABLE public.nsfw_content_performers
      ADD CONSTRAINT nsfw_content_performers_consent_status_check
      CHECK (consent_status IN ('pending', 'verified', 'revoked', 'expired'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_nsfw_content_performers_updated_at ON public.nsfw_content_performers;
CREATE TRIGGER update_nsfw_content_performers_updated_at
  BEFORE UPDATE ON public.nsfw_content_performers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================
-- Extend NSFW video content with license/compliance status
-- ============================
DO $$
BEGIN
  IF to_regclass('public.nsfw_video_content') IS NULL THEN
    RETURN;
  END IF;
  ALTER TABLE public.nsfw_video_content
    ADD COLUMN IF NOT EXISTS license_id uuid REFERENCES public.nsfw_content_licenses(id) ON DELETE SET NULL;
  ALTER TABLE public.nsfw_video_content
    ADD COLUMN IF NOT EXISTS license_status text;
  ALTER TABLE public.nsfw_video_content
    ADD COLUMN IF NOT EXISTS license_verified_at timestamptz;
  ALTER TABLE public.nsfw_video_content
    ADD COLUMN IF NOT EXISTS license_notes text;
  ALTER TABLE public.nsfw_video_content
    ADD COLUMN IF NOT EXISTS compliance_status text;
  ALTER TABLE public.nsfw_video_content
    ADD COLUMN IF NOT EXISTS compliance_verified_at timestamptz;
  ALTER TABLE public.nsfw_video_content
    ADD COLUMN IF NOT EXISTS compliance_notes text;
END $$;

CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_license_id
  ON public.nsfw_video_content(license_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_license_status
  ON public.nsfw_video_content(license_status);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_compliance_status
  ON public.nsfw_video_content(compliance_status);

-- ============================
-- Import job item metadata (license/compliance validation)
-- ============================
DO $$
BEGIN
  IF to_regclass('public.dlc_content_import_job_items') IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dlc_content_import_job_items'
      AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.dlc_content_import_job_items
      ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dlc_content_import_job_items_metadata
  ON public.dlc_content_import_job_items USING gin (metadata);
