-- Migration: Admin DLC package toggles (default OFF)
-- Purpose:
-- - Allow privileged admin accounts to enable/disable specific DLC packages in-app
-- - Default behavior is OFF (no row => disabled)
-- Notes:
-- - Idempotent (safe to re-run)

CREATE TABLE IF NOT EXISTS public.admin_dlc_package_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, package_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_dlc_package_toggles_user_id
  ON public.admin_dlc_package_toggles(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_dlc_package_toggles_package_id
  ON public.admin_dlc_package_toggles(package_id);

ALTER TABLE public.admin_dlc_package_toggles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Only the row owner can read their toggle state (admin UI uses edge function anyway).
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_dlc_package_toggles' AND policyname='Users can view own admin DLC toggles'
  ) THEN
    CREATE POLICY "Users can view own admin DLC toggles"
      ON public.admin_dlc_package_toggles
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Only service_role can write (prevents end-users from creating a self-unlock system).
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='admin_dlc_package_toggles' AND policyname='Service role can manage admin DLC toggles'
  ) THEN
    CREATE POLICY "Service role can manage admin DLC toggles"
      ON public.admin_dlc_package_toggles
      FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

