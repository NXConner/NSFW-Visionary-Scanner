-- Migration: DLC device binding enhancements (idempotent)
-- Adds missing columns used across edge functions + UI.

DO $$
BEGIN
  IF to_regclass('public.dlc_license_devices') IS NOT NULL THEN
    ALTER TABLE public.dlc_license_devices
      ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false;

    ALTER TABLE public.dlc_license_devices
      ADD COLUMN IF NOT EXISTS device_platform text;

    ALTER TABLE public.dlc_license_devices
      ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

    ALTER TABLE public.dlc_license_devices
      ADD COLUMN IF NOT EXISTS last_validation_at timestamptz;

    -- Backfill device_platform from legacy column names
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='dlc_license_devices' AND column_name='platform'
    ) THEN
      UPDATE public.dlc_license_devices
        SET device_platform = COALESCE(device_platform, platform)
      WHERE device_platform IS NULL;
    END IF;

    -- Optional: keep legacy platform column in sync (best-effort)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='dlc_license_devices' AND column_name='platform'
    ) THEN
      UPDATE public.dlc_license_devices
        SET platform = COALESCE(platform, device_platform)
      WHERE platform IS NULL AND device_platform IS NOT NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_dlc_license_devices_user_active ON public.dlc_license_devices(user_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_dlc_license_devices_license_active ON public.dlc_license_devices(license_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_dlc_license_devices_is_primary ON public.dlc_license_devices(license_id, is_primary);
  END IF;
END $$;
