-- DLC Packs table
CREATE TABLE IF NOT EXISTS public.dlc_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_name TEXT NOT NULL,
  description TEXT NOT NULL,
  pack_type TEXT NOT NULL CHECK (pack_type IN ('positions', 'videos', 'education', 'bundle', 'premium_content')),
  content_items JSONB DEFAULT '[]'::jsonb,
  item_count INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  is_subscription BOOLEAN DEFAULT false,
  subscription_duration_days INTEGER,
  preview_images TEXT[] DEFAULT '{}',
  preview_video_url TEXT,
  preview_description TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  content_rating TEXT DEFAULT 'adult',
  requires_base_pack BOOLEAN DEFAULT false,
  base_pack_id UUID REFERENCES public.dlc_packs(id),
  is_standalone BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  release_date TIMESTAMPTZ,
  sales_count INTEGER DEFAULT 0,
  revenue_total NUMERIC(12,2) DEFAULT 0,
  average_rating NUMERIC(3,2),
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- DLC Bundles table
CREATE TABLE IF NOT EXISTS public.dlc_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_name TEXT NOT NULL,
  description TEXT NOT NULL,
  pack_ids UUID[] NOT NULL DEFAULT '{}',
  pack_count INTEGER NOT NULL DEFAULT 0,
  bundle_price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  discount_percentage INTEGER,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  preview_image_url TEXT,
  preview_description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_limited_time BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  sales_count INTEGER DEFAULT 0,
  revenue_total NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- DLC Purchases table
CREATE TABLE IF NOT EXISTS public.dlc_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pack_id UUID REFERENCES public.dlc_packs(id),
  bundle_id UUID REFERENCES public.dlc_bundles(id),
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('one_time', 'subscription')),
  price_paid NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  access_granted_at TIMESTAMPTZ DEFAULT now(),
  access_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  download_enabled BOOLEAN DEFAULT true,
  stream_enabled BOOLEAN DEFAULT true,
  refunded_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT check_pack_or_bundle CHECK (pack_id IS NOT NULL OR bundle_id IS NOT NULL)
);

-- DLC Download Queue table
CREATE TABLE IF NOT EXISTS public.dlc_download_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  purchase_id UUID NOT NULL REFERENCES public.dlc_purchases(id),
  content_item_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('position', 'video', 'image', '3d_model', 'other')),
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  download_status TEXT DEFAULT 'queued' CHECK (download_status IN ('queued', 'downloading', 'paused', 'completed', 'failed', 'cancelled')),
  download_priority INTEGER DEFAULT 5,
  downloaded_bytes BIGINT DEFAULT 0,
  download_progress NUMERIC(5,2) DEFAULT 0,
  download_speed_bytes_per_sec INTEGER,
  estimated_time_remaining_seconds INTEGER,
  queued_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DLC Updates table
CREATE TABLE IF NOT EXISTS public.dlc_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.dlc_packs(id),
  version_number TEXT NOT NULL,
  update_type TEXT CHECK (update_type IN ('patch', 'minor', 'major', 'content_add')),
  changelog TEXT[],
  new_content_items JSONB DEFAULT '[]'::jsonb,
  removed_content_items TEXT[],
  modified_content_items JSONB DEFAULT '[]'::jsonb,
  update_file_url TEXT,
  update_file_size_bytes BIGINT,
  checksum TEXT,
  is_required BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  release_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DLC Licenses table
CREATE TABLE IF NOT EXISTS public.dlc_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  license_key TEXT NOT NULL UNIQUE,
  purchase_id UUID REFERENCES public.dlc_purchases(id),
  device_id TEXT,
  content_version TEXT DEFAULT '1.0.0',
  signature TEXT,
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.dlc_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_download_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_licenses ENABLE ROW LEVEL SECURITY;

-- DLC Packs policies (public read for active packs)
DROP POLICY IF EXISTS "Anyone can view active DLC packs" ON public.dlc_packs;
DROP POLICY IF EXISTS "Anyone can view active DLC bundles" ON public.dlc_bundles;
DROP POLICY IF EXISTS "Users can view own DLC purchases" ON public.dlc_purchases;
DROP POLICY IF EXISTS "Users can create DLC purchases" ON public.dlc_purchases;
DROP POLICY IF EXISTS "Users can manage own download queue" ON public.dlc_download_queue;
DROP POLICY IF EXISTS "Anyone can view available DLC updates" ON public.dlc_updates;
DROP POLICY IF EXISTS "Users can view own DLC licenses" ON public.dlc_licenses;
DROP POLICY IF EXISTS "Users can create own DLC licenses" ON public.dlc_licenses;
DROP POLICY IF EXISTS "Users can update own DLC licenses" ON public.dlc_licenses;

CREATE POLICY "Anyone can view active DLC packs" ON public.dlc_packs
  FOR SELECT USING (is_active = true);

-- DLC Bundles policies (public read for active bundles)
CREATE POLICY "Anyone can view active DLC bundles" ON public.dlc_bundles
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- DLC Purchases policies (users can only see their own)
CREATE POLICY "Users can view own DLC purchases" ON public.dlc_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create DLC purchases" ON public.dlc_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DLC Download Queue policies
CREATE POLICY "Users can manage own download queue" ON public.dlc_download_queue
  FOR ALL USING (auth.uid() = user_id);

-- DLC Updates policies (public read)
CREATE POLICY "Anyone can view available DLC updates" ON public.dlc_updates
  FOR SELECT USING (is_available = true);

-- DLC Licenses policies
CREATE POLICY "Users can view own DLC licenses" ON public.dlc_licenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own DLC licenses" ON public.dlc_licenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own DLC licenses" ON public.dlc_licenses
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dlc_packs_type ON public.dlc_packs(pack_type);
CREATE INDEX IF NOT EXISTS idx_dlc_packs_featured ON public.dlc_packs(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_dlc_purchases_user ON public.dlc_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_purchases_pack ON public.dlc_purchases(pack_id);
CREATE INDEX IF NOT EXISTS idx_dlc_download_queue_user ON public.dlc_download_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_user ON public.dlc_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_key ON public.dlc_licenses(license_key);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_dlc_packs_updated_at ON public.dlc_packs;
CREATE TRIGGER update_dlc_packs_updated_at
  BEFORE UPDATE ON public.dlc_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_dlc_bundles_updated_at ON public.dlc_bundles;
CREATE TRIGGER update_dlc_bundles_updated_at
  BEFORE UPDATE ON public.dlc_bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_dlc_licenses_updated_at ON public.dlc_licenses;
CREATE TRIGGER update_dlc_licenses_updated_at
  BEFORE UPDATE ON public.dlc_licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();