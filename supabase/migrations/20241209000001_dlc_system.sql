-- =============================================
-- DLC System Database Schema
-- Migration: 20241209000001_dlc_system.sql
-- Description: Core tables for DLC management
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- gen_random_uuid() requires pgcrypto (enabled by default on Supabase, but not guaranteed on self-hosted Postgres)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- Table: dlc_packages
-- Stores all available DLC packages
-- =============================================
CREATE TABLE IF NOT EXISTS dlc_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT UNIQUE NOT NULL,
  package_name TEXT NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('individual', 'bundle', 'subscription')),
  
  -- Descriptions
  safe_description TEXT NOT NULL,
  full_description TEXT,
  marketing_tagline TEXT,
  
  -- Pricing
  price_usd DECIMAL(10,2) NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('one_time', 'subscription')),
  subscription_interval TEXT CHECK (subscription_interval IN ('monthly', 'yearly')),
  regional_pricing JSONB DEFAULT '{}',
  
  -- Features
  features JSONB NOT NULL DEFAULT '[]',
  included_packages TEXT[],
  
  -- Distribution
  download_url TEXT,
  download_size_bytes BIGINT,
  checksum_sha256 TEXT,
  encryption_key_id TEXT,
  
  -- Versioning
  version TEXT NOT NULL DEFAULT '1.0.0',
  content_version TEXT DEFAULT '2024.12.1',
  min_app_version TEXT,
  max_app_version TEXT,
  content_changelog JSONB DEFAULT '[]',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  content_rating TEXT DEFAULT '18+',
  preview_images TEXT[],
  preview_video_url TEXT,
  
  -- Localization
  localized_names JSONB DEFAULT '{}',
  localized_descriptions JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dlc_packages
CREATE INDEX IF NOT EXISTS idx_dlc_packages_package_id ON dlc_packages(package_id);
CREATE INDEX IF NOT EXISTS idx_dlc_packages_is_active ON dlc_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_dlc_packages_is_featured ON dlc_packages(is_featured);
CREATE INDEX IF NOT EXISTS idx_dlc_packages_display_order ON dlc_packages(display_order);

-- =============================================
-- Table: dlc_licenses
-- Stores user licenses for DLC packages
-- =============================================
CREATE TABLE IF NOT EXISTS dlc_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id) ON DELETE CASCADE,
  
  -- License Info
  license_key TEXT UNIQUE NOT NULL,
  license_type TEXT NOT NULL CHECK (license_type IN ('one_time', 'subscription', 'gift', 'promo')),
  
  -- Purchase Info
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purchase_price DECIMAL(10,2),
  purchase_currency TEXT DEFAULT 'USD',
  payment_provider TEXT,
  payment_id TEXT,
  
  -- Subscription Info
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'paused')),
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  subscription_pause_until TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  
  -- Activation
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  
  -- Device Binding
  max_devices INTEGER DEFAULT 3,
  
  -- Offline Support
  offline_cache_expires_at TIMESTAMPTZ,
  last_online_validation TIMESTAMPTZ,
  grace_period_until TIMESTAMPTZ,
  
  -- Refund
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(user_id, package_id)
);

-- Indexes for dlc_licenses
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_user_id ON dlc_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_package_id ON dlc_licenses(package_id);
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_license_key ON dlc_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_is_active ON dlc_licenses(is_active);
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_subscription_status ON dlc_licenses(subscription_status);

-- =============================================
-- Table: dlc_license_devices
-- Tracks devices bound to licenses
-- =============================================
CREATE TABLE IF NOT EXISTS dlc_license_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES dlc_licenses(id) ON DELETE CASCADE,
  
  -- Device Info
  device_id TEXT NOT NULL,
  device_fingerprint TEXT,
  device_name TEXT,
  device_platform TEXT CHECK (device_platform IN ('android', 'ios', 'web')),
  device_model TEXT,
  
  -- Status
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  last_validation_at TIMESTAMPTZ,
  
  -- Unique constraint
  UNIQUE(license_id, device_id)
);

-- Indexes for dlc_license_devices
CREATE INDEX IF NOT EXISTS idx_dlc_license_devices_license_id ON dlc_license_devices(license_id);
CREATE INDEX IF NOT EXISTS idx_dlc_license_devices_device_id ON dlc_license_devices(device_id);

-- =============================================
-- Table: dlc_installations
-- Tracks DLC installations on devices
-- =============================================
CREATE TABLE IF NOT EXISTS dlc_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES dlc_licenses(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  
  -- Installation Info
  installed_version TEXT NOT NULL,
  content_version TEXT,
  install_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  install_source TEXT CHECK (install_source IN ('manual', 'auto_update', 'restore')),
  
  -- Device Info
  device_platform TEXT CHECK (device_platform IN ('android', 'ios', 'web')),
  device_model TEXT,
  app_version TEXT,
  
  -- Storage
  storage_used_bytes BIGINT,
  cached_content_bytes BIGINT,
  
  -- Status
  is_installed BOOLEAN DEFAULT true,
  is_corrupted BOOLEAN DEFAULT false,
  last_integrity_check TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(user_id, package_id, device_id)
);

-- Indexes for dlc_installations
CREATE INDEX IF NOT EXISTS idx_dlc_installations_user_id ON dlc_installations(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_installations_package_id ON dlc_installations(package_id);
CREATE INDEX IF NOT EXISTS idx_dlc_installations_device_id ON dlc_installations(device_id);
CREATE INDEX IF NOT EXISTS idx_dlc_installations_is_installed ON dlc_installations(is_installed);

-- =============================================
-- Table: dlc_downloads
-- Tracks download progress and history
-- =============================================
CREATE TABLE IF NOT EXISTS dlc_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id) ON DELETE CASCADE,
  license_id UUID REFERENCES dlc_licenses(id) ON DELETE SET NULL,
  device_id TEXT NOT NULL,
  
  -- Download Info
  download_url TEXT NOT NULL,
  download_type TEXT CHECK (download_type IN ('full', 'delta', 'content_update')),
  
  -- Progress
  download_status TEXT NOT NULL CHECK (download_status IN ('pending', 'downloading', 'paused', 'completed', 'failed', 'cancelled')),
  download_progress INTEGER DEFAULT 0 CHECK (download_progress >= 0 AND download_progress <= 100),
  download_speed_bps BIGINT,
  
  -- Timing
  download_started_at TIMESTAMPTZ,
  download_completed_at TIMESTAMPTZ,
  estimated_time_remaining INTEGER,
  
  -- File Info
  file_size_bytes BIGINT,
  downloaded_bytes BIGINT DEFAULT 0,
  checksum_expected TEXT,
  checksum_verified BOOLEAN,
  
  -- Error Handling
  error_message TEXT,
  error_code TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dlc_downloads
CREATE INDEX IF NOT EXISTS idx_dlc_downloads_user_id ON dlc_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_downloads_package_id ON dlc_downloads(package_id);
CREATE INDEX IF NOT EXISTS idx_dlc_downloads_status ON dlc_downloads(download_status);

-- =============================================
-- Table: dlc_age_verifications
-- Stores age verification records
-- =============================================
CREATE TABLE IF NOT EXISTS dlc_age_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Verification Info
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_method TEXT CHECK (verification_method IN ('self_declared', 'id_check', 'credit_card')),
  declared_age INTEGER,
  date_of_birth DATE,
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  
  -- Terms
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,
  adult_content_consent BOOLEAN DEFAULT false,
  
  -- Audit
  ip_address INET,
  user_agent TEXT,
  country_code TEXT
);

-- Indexes for dlc_age_verifications
CREATE INDEX IF NOT EXISTS idx_dlc_age_verifications_user_id ON dlc_age_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_age_verifications_is_verified ON dlc_age_verifications(is_verified);

-- =============================================
-- Table: dlc_update_sources
-- Tracks app update source preferences
-- =============================================
CREATE TABLE IF NOT EXISTS dlc_update_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  
  -- Source Info
  original_install_source TEXT CHECK (original_install_source IN ('google_play', 'app_store', 'website', 'direct')),
  current_update_source TEXT NOT NULL CHECK (current_update_source IN ('store', 'website')),
  source_changed_at TIMESTAMPTZ,
  source_change_reason TEXT,
  
  -- App Version
  current_app_version TEXT,
  last_update_check TIMESTAMPTZ,
  last_update_installed TIMESTAMPTZ,
  available_update_version TEXT,
  
  -- Acknowledgment
  update_source_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(user_id, device_id)
);

-- Indexes for dlc_update_sources
CREATE INDEX IF NOT EXISTS idx_dlc_update_sources_user_id ON dlc_update_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_update_sources_device_id ON dlc_update_sources(device_id);

-- =============================================
-- Table: dlc_promo_codes
-- Promotional codes and discounts
-- =============================================
CREATE TABLE IF NOT EXISTS dlc_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  
  -- Discount Info
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free')),
  discount_value DECIMAL(10,2) NOT NULL,
  applies_to TEXT[] NOT NULL,
  
  -- Usage Limits
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  max_per_user INTEGER DEFAULT 1,
  
  -- Validity
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Affiliate
  affiliate_id TEXT,
  affiliate_commission DECIMAL(5,2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  campaign_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dlc_promo_codes
CREATE INDEX IF NOT EXISTS idx_dlc_promo_codes_code ON dlc_promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_dlc_promo_codes_is_active ON dlc_promo_codes(is_active);

-- =============================================
-- Table: dlc_gift_codes
-- Gift codes for DLC packages
-- =============================================
CREATE TABLE IF NOT EXISTS dlc_gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id) ON DELETE CASCADE,
  
  -- Purchase Info
  purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchase_price DECIMAL(10,2),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Redemption
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  
  -- Gift Details
  gift_message TEXT,
  recipient_email TEXT,
  
  -- Status
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for dlc_gift_codes
CREATE INDEX IF NOT EXISTS idx_dlc_gift_codes_code ON dlc_gift_codes(code);
CREATE INDEX IF NOT EXISTS idx_dlc_gift_codes_purchased_by ON dlc_gift_codes(purchased_by);
CREATE INDEX IF NOT EXISTS idx_dlc_gift_codes_redeemed_by ON dlc_gift_codes(redeemed_by);
CREATE INDEX IF NOT EXISTS idx_dlc_gift_codes_is_active ON dlc_gift_codes(is_active);

-- =============================================
-- Table: dlc_promo_redemptions
-- Tracks promo code usage
-- =============================================
CREATE TABLE IF NOT EXISTS dlc_promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES dlc_promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id) ON DELETE CASCADE,
  
  -- Pricing
  original_price DECIMAL(10,2) NOT NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2) NOT NULL,
  
  -- Timestamps
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for dlc_promo_redemptions
CREATE INDEX IF NOT EXISTS idx_dlc_promo_redemptions_promo_code_id ON dlc_promo_redemptions(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_dlc_promo_redemptions_user_id ON dlc_promo_redemptions(user_id);

-- =============================================
-- Table: dlc_analytics_events
-- Analytics tracking for DLC store
-- =============================================
CREATE TABLE IF NOT EXISTS dlc_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Event Info
  event_type TEXT NOT NULL,
  package_id TEXT,
  event_data JSONB DEFAULT '{}',
  
  -- Context
  device_id TEXT,
  device_platform TEXT,
  app_version TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for dlc_analytics_events
CREATE INDEX IF NOT EXISTS idx_dlc_analytics_events_user_id ON dlc_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_analytics_events_event_type ON dlc_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_dlc_analytics_events_package_id ON dlc_analytics_events(package_id);
CREATE INDEX IF NOT EXISTS idx_dlc_analytics_events_created_at ON dlc_analytics_events(created_at);

-- =============================================
-- Row Level Security Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE dlc_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_license_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_age_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_update_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_gift_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_analytics_events ENABLE ROW LEVEL SECURITY;

-- DLC Packages: Public read for active packages
CREATE POLICY "Anyone can view active DLC packages"
  ON dlc_packages FOR SELECT
  USING (is_active = true);

-- DLC Licenses: Users can only see their own
CREATE POLICY "Users can view their own licenses"
  ON dlc_licenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own licenses"
  ON dlc_licenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own licenses"
  ON dlc_licenses FOR UPDATE
  USING (auth.uid() = user_id);

-- License Devices: Users can manage devices for their licenses
CREATE POLICY "Users can manage their license devices"
  ON dlc_license_devices FOR ALL
  USING (
    license_id IN (
      SELECT id FROM dlc_licenses WHERE user_id = auth.uid()
    )
  );

-- Installations: Users can manage their own installations
CREATE POLICY "Users can manage their own installations"
  ON dlc_installations FOR ALL
  USING (auth.uid() = user_id);

-- Downloads: Users can manage their own downloads
CREATE POLICY "Users can manage their own downloads"
  ON dlc_downloads FOR ALL
  USING (auth.uid() = user_id);

-- Age Verifications: Users can only see and update their own
CREATE POLICY "Users can manage their age verification"
  ON dlc_age_verifications FOR ALL
  USING (auth.uid() = user_id);

-- Update Sources: Users can manage their update preferences
CREATE POLICY "Users can manage their update sources"
  ON dlc_update_sources FOR ALL
  USING (auth.uid() = user_id);

-- Promo Codes: Anyone can view active codes
CREATE POLICY "Anyone can view active promo codes"
  ON dlc_promo_codes FOR SELECT
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- Gift Codes: Users can see codes they purchased or received
CREATE POLICY "Users can view their gift codes"
  ON dlc_gift_codes FOR SELECT
  USING (auth.uid() = purchased_by OR auth.uid() = redeemed_by);

CREATE POLICY "Users can update gift codes they redeem"
  ON dlc_gift_codes FOR UPDATE
  USING (redeemed_by IS NULL OR auth.uid() = redeemed_by);

-- Promo Redemptions: Users can see their own redemptions
CREATE POLICY "Users can view their promo redemptions"
  ON dlc_promo_redemptions FOR ALL
  USING (auth.uid() = user_id);

-- Analytics: Users can insert their own events
CREATE POLICY "Users can insert their own analytics events"
  ON dlc_analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_dlc_packages_updated_at
  BEFORE UPDATE ON dlc_packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dlc_licenses_updated_at
  BEFORE UPDATE ON dlc_licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dlc_installations_updated_at
  BEFORE UPDATE ON dlc_installations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dlc_update_sources_updated_at
  BEFORE UPDATE ON dlc_update_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment promo code redemption count
CREATE OR REPLACE FUNCTION increment_promo_redemptions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE dlc_promo_codes
  SET current_redemptions = current_redemptions + 1
  WHERE id = NEW.promo_code_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_promo_redemptions_trigger
  AFTER INSERT ON dlc_promo_redemptions
  FOR EACH ROW EXECUTE FUNCTION increment_promo_redemptions();

-- =============================================
-- Seed Initial Packages
-- =============================================
INSERT INTO dlc_packages (
  package_id, package_name, package_type, safe_description, full_description,
  marketing_tagline, price_usd, price_type, features, version, display_order,
  is_featured
) VALUES
  ('dlc-positions', 'Positions Collection', 'individual',
   'Comprehensive guide to partner connection techniques with visual instructions and expert tips for adults',
   '100+ intimate positions with detailed instructions, images, difficulty ratings, and expert tips.',
   'Explore 100+ ways to connect', 9.99, 'one_time',
   '[{"id":"positions_gallery","name":"Positions Gallery","category":"positions"}]',
   '1.0.0', 1, false),
  ('dlc-videos', 'Video Library', 'individual',
   'Premium video library featuring expert demonstrations and educational wellness content for adults',
   'Extensive library of adult educational videos with HD streaming, offline downloads, and playlists.',
   'Learn from the experts', 14.99, 'one_time',
   '[{"id":"video_library","name":"Video Library","category":"videos"}]',
   '1.0.0', 2, false),
  ('dlc-complete', 'Ultimate Complete Pack', 'bundle',
   'The complete experience - all premium features unlocked forever with lifetime access',
   'Every feature, every piece of content, lifetime access. Includes all current and future content updates.',
   'The ultimate experience', 39.99, 'one_time',
   '[{"id":"positions_gallery","name":"Positions Gallery","category":"positions"},{"id":"video_library","name":"Video Library","category":"videos"}]',
   '1.0.0', 6, true)
ON CONFLICT (package_id) DO NOTHING;

-- =============================================
-- Comments
-- =============================================
COMMENT ON TABLE dlc_packages IS 'Available DLC packages for purchase';
COMMENT ON TABLE dlc_licenses IS 'User licenses for DLC packages';
COMMENT ON TABLE dlc_license_devices IS 'Devices bound to DLC licenses';
COMMENT ON TABLE dlc_installations IS 'DLC installations on user devices';
COMMENT ON TABLE dlc_downloads IS 'DLC download history and progress';
COMMENT ON TABLE dlc_age_verifications IS 'User age verification records';
COMMENT ON TABLE dlc_update_sources IS 'App update source preferences per device';
COMMENT ON TABLE dlc_promo_codes IS 'Promotional codes and discounts';
COMMENT ON TABLE dlc_gift_codes IS 'Gift codes for DLC packages';
COMMENT ON TABLE dlc_promo_redemptions IS 'Promo code redemption history';
COMMENT ON TABLE dlc_analytics_events IS 'DLC store analytics events';
