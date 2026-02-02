-- Add missing columns to dlc_installations table for proper device binding and installation tracking
ALTER TABLE public.dlc_installations 
ADD COLUMN IF NOT EXISTS device_id TEXT,
ADD COLUMN IF NOT EXISTS license_id UUID REFERENCES public.dlc_licenses(id),
ADD COLUMN IF NOT EXISTS content_version TEXT,
ADD COLUMN IF NOT EXISTS install_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS install_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS device_platform TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS app_version TEXT,
ADD COLUMN IF NOT EXISTS is_installed BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_corrupted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_integrity_check TIMESTAMP WITH TIME ZONE;

-- Create a unique constraint for user_id, package_id, device_id combination
-- First, set default device_id for existing rows
UPDATE public.dlc_installations 
SET device_id = 'web-' || gen_random_uuid()::text 
WHERE device_id IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dlc_installations_user_device 
ON public.dlc_installations(user_id, device_id);

CREATE INDEX IF NOT EXISTS idx_dlc_installations_is_installed 
ON public.dlc_installations(is_installed) WHERE is_installed = true;

-- Add unique constraint for the upsert operation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'dlc_installations_user_package_device_key'
  ) THEN
    ALTER TABLE public.dlc_installations 
    ADD CONSTRAINT dlc_installations_user_package_device_key 
    UNIQUE (user_id, package_id, device_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;