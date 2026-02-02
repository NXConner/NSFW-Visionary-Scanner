-- Migration: DLC package keyring (rotation-ready, idempotent)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.dlc_package_keyring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id text NOT NULL,
  key_version integer NOT NULL DEFAULT 1,
  key_ciphertext text NOT NULL,
  key_iv text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz,
  UNIQUE(package_id, key_version)
);

CREATE INDEX IF NOT EXISTS idx_dlc_package_keyring_package_active ON public.dlc_package_keyring(package_id, is_active);

ALTER TABLE public.dlc_package_keyring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access to dlc_package_keyring" ON public.dlc_package_keyring;
CREATE POLICY "No public access to dlc_package_keyring" ON public.dlc_package_keyring
  FOR ALL USING (false);
