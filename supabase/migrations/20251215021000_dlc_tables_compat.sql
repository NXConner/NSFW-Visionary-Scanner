-- ============================================================
-- DLC compatibility migration (idempotent)
-- Purpose:
-- - Ensure DLC tables match what app + edge functions expect even if
--   a minimal/alternative "missing tables" migration ran first.
-- - Add missing columns, backfill where possible, and normalize key fields.
-- ============================================================

-- Extensions required by common DLC migrations
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- dlc_packages: ensure canonical columns exist + backfill from legacy/minimal schema
-- ------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.dlc_packages') IS NOT NULL THEN
    -- Canonical columns (used across app + edge functions)
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS package_name TEXT;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS package_type TEXT;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS safe_description TEXT;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS full_description TEXT;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS marketing_tagline TEXT;

    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS price_usd DECIMAL(10,2);
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS price_type TEXT;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS subscription_interval TEXT;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS regional_pricing JSONB DEFAULT '{}'::jsonb;

    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS included_packages TEXT[];

    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS download_url TEXT;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS download_size_bytes BIGINT;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS checksum_sha256 TEXT;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS encryption_key_id TEXT;

    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS content_version TEXT;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS min_app_version TEXT;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS max_app_version TEXT;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS content_changelog JSONB DEFAULT '[]'::jsonb;

    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS content_rating TEXT DEFAULT '18+';
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS localized_names JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS localized_descriptions JSONB DEFAULT '{}'::jsonb;

    -- Ensure timestamps exist on minimal schemas
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    ALTER TABLE public.dlc_packages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    -- Backfill from "missing tables" schema if present
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='dlc_packages' AND column_name='name'
    ) THEN
      UPDATE public.dlc_packages
        SET package_name = COALESCE(package_name, name)
      WHERE package_name IS NULL;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='dlc_packages' AND column_name='description'
    ) THEN
      UPDATE public.dlc_packages
        SET safe_description = COALESCE(safe_description, description, ''),
            full_description = COALESCE(full_description, description)
      WHERE safe_description IS NULL OR safe_description = '';
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='dlc_packages' AND column_name='pack_type'
    ) THEN
      UPDATE public.dlc_packages
        SET package_type = COALESCE(
          package_type,
          CASE
            WHEN pack_type IN ('individual','bundle','subscription') THEN pack_type
            WHEN pack_type IN ('content') THEN 'individual'
            ELSE 'individual'
          END
        )
      WHERE package_type IS NULL;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='dlc_packages' AND column_name='price'
    ) THEN
      UPDATE public.dlc_packages
        SET price_usd = COALESCE(price_usd, price::DECIMAL(10,2))
      WHERE price_usd IS NULL;
    END IF;

    -- Derive price_type if absent (conservative default)
    UPDATE public.dlc_packages
      SET price_type = COALESCE(price_type, 'one_time')
    WHERE price_type IS NULL;

    -- If the minimal schema used content_items for features, map it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='dlc_packages' AND column_name='content_items'
    ) THEN
      UPDATE public.dlc_packages
        SET features = COALESCE(NULLIF(features, '[]'::jsonb), content_items)
      WHERE (features IS NULL OR features = '[]'::jsonb) AND content_items IS NOT NULL;
    END IF;

    -- Indexes commonly relied upon by queries
    CREATE INDEX IF NOT EXISTS idx_dlc_packages_is_active ON public.dlc_packages(is_active);
    CREATE INDEX IF NOT EXISTS idx_dlc_packages_display_order ON public.dlc_packages(display_order);

    -- RLS + public read policy for active packages
    ALTER TABLE public.dlc_packages ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='dlc_packages' AND policyname='Anyone can view active DLC packages'
    ) THEN
      CREATE POLICY "Anyone can view active DLC packages"
        ON public.dlc_packages
        FOR SELECT
        USING (is_active = true);
    END IF;
  END IF;
END $$;

-- ------------------------------------------------------------
-- dlc_installations: normalize package_id (text) and add canonical columns
-- ------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.dlc_installations') IS NULL THEN
    RETURN;
  END IF;

  -- If an alternative schema created package_id as UUID FK to dlc_packages(id),
  -- rename it to package_uuid and introduce canonical package_id TEXT.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='dlc_installations' AND column_name='package_id' AND data_type='uuid'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='dlc_installations' AND column_name='package_uuid'
  ) THEN
    EXECUTE 'ALTER TABLE public.dlc_installations RENAME COLUMN package_id TO package_uuid';
    ALTER TABLE public.dlc_installations ADD COLUMN package_id TEXT;
  END IF;

  -- Canonical columns
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS license_id UUID;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS device_id TEXT;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS content_version TEXT;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS install_date TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS install_source TEXT;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS device_platform TEXT;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS device_model TEXT;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS app_version TEXT;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS cached_content_bytes BIGINT;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS is_installed BOOLEAN DEFAULT true;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS is_corrupted BOOLEAN DEFAULT false;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS last_integrity_check TIMESTAMPTZ;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE public.dlc_installations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

  -- Backfill from alternative schema columns if present
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='dlc_installations' AND column_name='installed_at'
  ) THEN
    UPDATE public.dlc_installations
      SET install_date = COALESCE(install_date, installed_at)
    WHERE install_date IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='dlc_installations' AND column_name='last_verified_at'
  ) THEN
    UPDATE public.dlc_installations
      SET last_integrity_check = COALESCE(last_integrity_check, last_verified_at)
    WHERE last_integrity_check IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='dlc_installations' AND column_name='file_size_bytes'
  ) THEN
    UPDATE public.dlc_installations
      SET storage_used_bytes = COALESCE(storage_used_bytes, file_size_bytes)
    WHERE storage_used_bytes IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='dlc_installations' AND column_name='is_valid'
  ) THEN
    UPDATE public.dlc_installations
      SET is_corrupted = COALESCE(is_corrupted, NOT is_valid)
    WHERE is_corrupted IS NULL;
  END IF;

  -- Populate package_id from package_uuid -> dlc_packages.id mapping when applicable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='dlc_installations' AND column_name='package_uuid'
  ) THEN
    UPDATE public.dlc_installations di
      SET package_id = dp.package_id
    FROM public.dlc_packages dp
    WHERE di.package_id IS NULL
      AND dp.id = di.package_uuid;
  END IF;

  -- Ensure device_id is non-null-ish for upserts (best-effort)
  UPDATE public.dlc_installations
    SET device_id = COALESCE(device_id, 'unknown')
  WHERE device_id IS NULL;

  -- Ensure unique index for app upserts (onConflict: user_id,package_id,device_id)
  CREATE UNIQUE INDEX IF NOT EXISTS idx_dlc_installations_user_package_device_unique
    ON public.dlc_installations(user_id, package_id, device_id);

  -- RLS policy (idempotent)
  ALTER TABLE public.dlc_installations ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='dlc_installations' AND policyname='Users can manage their own installations'
  ) THEN
    CREATE POLICY "Users can manage their own installations"
      ON public.dlc_installations
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ------------------------------------------------------------
-- dlc_age_verifications: add canonical fields used by serializers + policies
-- ------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.dlc_age_verifications') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.dlc_age_verifications ADD COLUMN IF NOT EXISTS declared_age INTEGER;
  ALTER TABLE public.dlc_age_verifications ADD COLUMN IF NOT EXISTS date_of_birth DATE;
  ALTER TABLE public.dlc_age_verifications ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
  ALTER TABLE public.dlc_age_verifications ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
  ALTER TABLE public.dlc_age_verifications ADD COLUMN IF NOT EXISTS terms_version TEXT;
  ALTER TABLE public.dlc_age_verifications ADD COLUMN IF NOT EXISTS adult_content_consent BOOLEAN DEFAULT false;
  ALTER TABLE public.dlc_age_verifications ADD COLUMN IF NOT EXISTS ip_address INET;
  ALTER TABLE public.dlc_age_verifications ADD COLUMN IF NOT EXISTS user_agent TEXT;
  ALTER TABLE public.dlc_age_verifications ADD COLUMN IF NOT EXISTS country_code TEXT;
  ALTER TABLE public.dlc_age_verifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE public.dlc_age_verifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

  ALTER TABLE public.dlc_age_verifications ENABLE ROW LEVEL SECURITY;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='dlc_age_verifications' AND policyname='Users can manage their age verification'
  ) THEN
    CREATE POLICY "Users can manage their age verification"
      ON public.dlc_age_verifications
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

