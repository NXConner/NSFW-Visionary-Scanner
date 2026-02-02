-- Create missing DLC tables that code references

-- dlc_packages (alternative naming used by DLCManager)
CREATE TABLE IF NOT EXISTS public.dlc_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  version text NOT NULL DEFAULT '1.0.0',
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  pack_type text NOT NULL DEFAULT 'content',
  category text,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  requires_base_pack boolean DEFAULT false,
  base_pack_id uuid REFERENCES public.dlc_packages(id),
  content_items jsonb DEFAULT '[]'::jsonb,
  item_count integer DEFAULT 0,
  preview_images text[] DEFAULT '{}',
  preview_video_url text,
  tags text[] DEFAULT '{}',
  stripe_product_id text,
  stripe_price_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.dlc_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active packages" ON public.dlc_packages;
CREATE POLICY "Anyone can view active packages" ON public.dlc_packages
  FOR SELECT USING (is_active = true);

-- dlc_installations (tracks installed DLC per user)
CREATE TABLE IF NOT EXISTS public.dlc_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  package_id uuid NOT NULL REFERENCES public.dlc_packages(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.dlc_purchases(id),
  installed_version text NOT NULL,
  install_path text,
  file_size_bytes bigint,
  checksum text,
  is_valid boolean DEFAULT true,
  installed_at timestamptz DEFAULT now(),
  last_verified_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, package_id)
);

ALTER TABLE public.dlc_installations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own installations" ON public.dlc_installations;
CREATE POLICY "Users can manage own installations" ON public.dlc_installations
  FOR ALL USING (auth.uid() = user_id);

-- dlc_license_devices (device binding for licenses)
CREATE TABLE IF NOT EXISTS public.dlc_license_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.dlc_licenses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  device_id text NOT NULL,
  device_name text,
  device_type text,
  platform text,
  is_active boolean DEFAULT true,
  activated_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  UNIQUE(license_id, device_id)
);

-- Ensure dlc_license_devices has user_id when table pre-exists
ALTER TABLE public.dlc_license_devices
  ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.dlc_license_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own device bindings" ON public.dlc_license_devices;
CREATE POLICY "Users can manage own device bindings" ON public.dlc_license_devices
  FOR ALL USING (auth.uid() = user_id);

-- dlc_age_verifications (age verification records)
CREATE TABLE IF NOT EXISTS public.dlc_age_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  verification_method text NOT NULL,
  verified_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_verified boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE public.dlc_age_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own age verification" ON public.dlc_age_verifications;
CREATE POLICY "Users can manage own age verification" ON public.dlc_age_verifications
  FOR ALL USING (auth.uid() = user_id);

-- stripe_webhook_events (webhook idempotency)
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook events (no user access)
DROP POLICY IF EXISTS "No public access to webhook events" ON public.stripe_webhook_events;
CREATE POLICY "No public access to webhook events" ON public.stripe_webhook_events
  FOR ALL USING (false);

-- device_tokens (push notification tokens)
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL,
  platform text NOT NULL,
  device_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own device tokens" ON public.device_tokens;
CREATE POLICY "Users can manage own device tokens" ON public.device_tokens
  FOR ALL USING (auth.uid() = user_id);