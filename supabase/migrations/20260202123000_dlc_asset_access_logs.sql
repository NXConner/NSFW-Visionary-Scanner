-- Migration: DLC asset access logs (NSFW/signed URL auditing)
-- Purpose:
-- - Record signed URL issuance for DLC assets
-- - Support security audits and content lifecycle analysis
-- Idempotent: safe to re-run

CREATE TABLE IF NOT EXISTS public.dlc_asset_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  asset_path TEXT NOT NULL,
  device_id TEXT,
  device_platform TEXT,
  access_type TEXT NOT NULL DEFAULT 'signed_url',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dlc_asset_access_logs_user_id
  ON public.dlc_asset_access_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_dlc_asset_access_logs_package_id
  ON public.dlc_asset_access_logs(package_id);

CREATE INDEX IF NOT EXISTS idx_dlc_asset_access_logs_created_at
  ON public.dlc_asset_access_logs(created_at DESC);

ALTER TABLE public.dlc_asset_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own DLC asset logs" ON public.dlc_asset_access_logs;
CREATE POLICY "Users can view their own DLC asset logs"
  ON public.dlc_asset_access_logs
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view DLC asset logs" ON public.dlc_asset_access_logs;
CREATE POLICY "Admins can view DLC asset logs"
  ON public.dlc_asset_access_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
