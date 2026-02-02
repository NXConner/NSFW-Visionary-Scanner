-- Migration: DLC schema compatibility patch
-- Purpose: reconcile historical DLC migrations so edge functions + app code agree
-- Notes:
-- - Idempotent (safe to re-run)
-- - Only adds missing columns/indexes; does not drop or rename anything

-- Ensure uuid extension (some envs use uuid_generate_v4 in other migrations)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- dlc_licenses: add commonly referenced columns if missing
-- ------------------------------------------------------------
ALTER TABLE IF EXISTS dlc_licenses
  ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMPTZ;

ALTER TABLE IF EXISTS dlc_licenses
  ADD COLUMN IF NOT EXISTS device_id TEXT;

ALTER TABLE IF EXISTS dlc_licenses
  ADD COLUMN IF NOT EXISTS content_version TEXT;

ALTER TABLE IF EXISTS dlc_licenses
  ADD COLUMN IF NOT EXISTS signature TEXT;

-- Helpful indexes for new columns (no-ops if already exist)
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_expiration_date ON dlc_licenses(expiration_date);
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_device_id ON dlc_licenses(device_id);
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_content_version ON dlc_licenses(content_version);

-- ------------------------------------------------------------
-- dlc_content_packages: ensure table exists for update checks
-- (Some environments rely on later migrations; this keeps edge
-- functions working even if migration order is modified.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dlc_content_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT UNIQUE NOT NULL,
  download_url TEXT NOT NULL,
  checksum TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  release_date TIMESTAMPTZ DEFAULT NOW(),
  changelog JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dlc_content_packages_is_active ON dlc_content_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_dlc_content_packages_version ON dlc_content_packages(version);

-- RLS: public read access for active packages (idempotent)
ALTER TABLE dlc_content_packages ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dlc_content_packages'
      AND policyname = 'Anyone can view active DLC content packages'
  ) THEN
    CREATE POLICY "Anyone can view active DLC content packages"
      ON dlc_content_packages
      FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

