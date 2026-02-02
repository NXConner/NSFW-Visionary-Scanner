-- Consolidated schema export
-- Source: supabase/migrations (ordered)
-- Generated: 2026-01-31 22:43:04

-- BEGIN MIGRATION: 20241209000001_dlc_system.sql

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


-- END MIGRATION: 20241209000001_dlc_system.sql

-- BEGIN MIGRATION: 20251204021139_3ed471db-bb31-4e9d-8701-8401e307023b.sql

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scan_history table
CREATE TABLE public.scan_history (
-- =============================================
-- MorphoScan Pro - Complete Database Schema Export
-- Generated: 2026-01-31
-- Source Project: thajylrvfzjmerqqkmjv
-- Target: New Supabase Project
-- =============================================

-- IMPORTANT: Run this file in order, section by section
-- Some sections depend on previous sections

-- =============================================
-- SECTION 1: Extensions
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- SECTION 2: Custom Types
-- =============================================
DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'pro', 'user', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- SECTION 3: Core Tables
-- =============================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  theme TEXT DEFAULT 'dark',
  theme_preset TEXT DEFAULT 'obsidian',
  font_size TEXT DEFAULT 'medium',
  color_blind_mode TEXT DEFAULT 'none',
  haptic_enabled BOOLEAN DEFAULT true,
  notifications_enabled BOOLEAN DEFAULT false,
  reminder_time TEXT DEFAULT '09:00',
  reminder_days INTEGER[] DEFAULT '{1,3,5}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- SECTION 4: Scans & Health Data
-- =============================================

-- Scans table
CREATE TABLE IF NOT EXISTS public.scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL DEFAULT '3d',
  length DECIMAL(5,2),
  circumference DECIMAL(5,2),
  curvature_angle DECIMAL(5,2),
  curvature_direction TEXT,
  image_path TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Scan history table
CREATE TABLE IF NOT EXISTS public.scan_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL DEFAULT '3d',
  length DECIMAL(5,2),
  circumference DECIMAL(5,2),
  curvature_angle DECIMAL(5,2),
  curvature_direction TEXT,
  image_path TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health_diary table
CREATE TABLE public.health_diary (
-- Health diary table
CREATE TABLE IF NOT EXISTS public.health_diary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  length DECIMAL(5,2),
  circumference DECIMAL(5,2),
  curvature_angle DECIMAL(5,2),
  curvature_direction TEXT,
  symptoms TEXT[],
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_diary ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Scan history policies
CREATE POLICY "Users can view own scans" ON public.scan_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON public.scan_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans" ON public.scan_history
  FOR DELETE USING (auth.uid() = user_id);

-- Health diary policies
CREATE POLICY "Users can view own diary" ON public.health_diary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert diary entries" ON public.health_diary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diary entries" ON public.health_diary
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diary entries" ON public.health_diary
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_diary_updated_at
  BEFORE UPDATE ON public.health_diary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- END MIGRATION: 20251204021139_3ed471db-bb31-4e9d-8701-8401e307023b.sql

-- BEGIN MIGRATION: 20251204140000_subscription_tables.sql

-- Create user_subscriptions table for Stripe integration
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
-- AI Scan Analysis
CREATE TABLE IF NOT EXISTS public.ai_scan_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'standard',
  overall_quality_score DECIMAL(3,2),
  quality_breakdown JSONB,
  quality_recommendations TEXT[],
  suggested_measurements JSONB,
  measurement_confidence DECIMAL(3,2),
  measurement_reasoning TEXT,
  anomalies_detected JSONB,
  anomaly_confidence DECIMAL(3,2),
  detected_conditions JSONB,
  health_alerts JSONB,
  risk_factors JSONB,
  trend_data JSONB,
  trend_direction TEXT,
  previous_scan_id UUID,
  comparison_results JSONB,
  ai_model_version TEXT,
  ai_model_confidence DECIMAL(3,2),
  processing_time_ms INTEGER,
  visualization_url TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Anomaly Detection Log
CREATE TABLE IF NOT EXISTS public.anomaly_detection_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL,
  severity TEXT DEFAULT 'low',
  confidence DECIMAL(3,2) NOT NULL,
  description TEXT NOT NULL,
  location JSONB,
  affected_measurements TEXT[],
  deviation_amount DECIMAL(5,2),
  compared_to_previous BOOLEAN DEFAULT false,
  previous_scan_id UUID,
  recommendation TEXT,
  requires_attention BOOLEAN DEFAULT false,
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- SECTION 5: Subscriptions & Payments
-- =============================================

-- User subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_history table for tracking payments
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  stripe_invoice_id TEXT UNIQUE,
-- Payment history
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for payment_history
CREATE POLICY "Users can view own payment history" ON public.payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment history" ON public.payment_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for updating updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscription_updated_at();

-- Function to automatically set user_id from stripe_customer_id
CREATE OR REPLACE FUNCTION public.set_subscription_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is not set but we have a stripe_customer_id,
  -- try to find the user from the customer metadata
  IF NEW.user_id IS NULL AND NEW.stripe_customer_id IS NOT NULL THEN
    -- This would be populated by the webhook or checkout completion
    -- For now, we'll require user_id to be set explicitly
    RAISE EXCEPTION 'user_id must be provided for subscription records';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to ensure user_id is set
CREATE TRIGGER set_subscription_user_id_trigger
  BEFORE INSERT ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_subscription_user_id();


-- END MIGRATION: 20251204140000_subscription_tables.sql

-- BEGIN MIGRATION: 20251204152020_d793bea6-cb1d-4e4d-ab25-1e7eb50593d7.sql

-- Create role enum
DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'pro', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- RLS Policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Insert admin and pro roles for the specified user
DO $$
BEGIN
  -- Guard: only seed if that auth user exists (avoids hard-failing migrations in fresh envs)
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = 'e33ffca2-4261-423e-a769-85227f27b9a5') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES
      ('e33ffca2-4261-423e-a769-85227f27b9a5', 'admin'),
      ('e33ffca2-4261-423e-a769-85227f27b9a5', 'pro')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;


-- END MIGRATION: 20251204152020_d793bea6-cb1d-4e4d-ab25-1e7eb50593d7.sql

-- BEGIN MIGRATION: 20251204172002_f6172b8e-c27c-4bb8-98b9-2709d688e786.sql

-- Create user_preferences table for cloud sync
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  theme text DEFAULT 'dark',
  theme_preset text DEFAULT 'obsidian',
  font_size text DEFAULT 'medium',
  color_blind_mode text DEFAULT 'none',
  haptic_enabled boolean DEFAULT true,
  notifications_enabled boolean DEFAULT false,
  reminder_time text DEFAULT '09:00',
  reminder_days integer[] DEFAULT '{1,3,5}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- END MIGRATION: 20251204172002_f6172b8e-c27c-4bb8-98b9-2709d688e786.sql

-- BEGIN MIGRATION: 20251205000000_device_tokens.sql

-- Device tokens table for push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id TEXT,
  device_name TEXT,
  app_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON device_tokens(platform);

-- RLS policies
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view their own device tokens"
  ON device_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own device tokens"
  ON device_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update their own device tokens"
  ON device_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own device tokens"
  ON device_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_device_tokens_updated_at
  BEFORE UPDATE ON device_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_device_tokens_updated_at();



-- END MIGRATION: 20251205000000_device_tokens.sql

-- BEGIN MIGRATION: 20251206000000_dlc_licenses_and_pricing.sql

-- Migration: DLC Licenses and Pricing Tiers
-- Creates tables for DLC license management and pricing configuration

-- DLC Licenses Table
CREATE TABLE IF NOT EXISTS dlc_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_key TEXT UNIQUE NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiration_date TIMESTAMP WITH TIME ZONE,
  device_id TEXT,
  content_version TEXT NOT NULL DEFAULT '1.0.0',
  signature TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for DLC licenses
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_user_id ON dlc_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_license_key ON dlc_licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_is_active ON dlc_licenses(is_active);

-- Pricing Tiers Table
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier_name TEXT NOT NULL,
  version_type TEXT NOT NULL CHECK (version_type IN ('sfw', 'nsfw', 'dlc')),
  distribution_channel TEXT NOT NULL CHECK (distribution_channel IN ('store', 'direct')),
  price_type TEXT NOT NULL CHECK (price_type IN ('one-time', 'monthly', 'yearly', 'lifetime')),
  price_amount DECIMAL(10, 2) NOT NULL,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tier_name, version_type, distribution_channel, price_type)
);

-- Indexes for pricing tiers
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_version_type ON pricing_tiers(version_type);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_distribution_channel ON pricing_tiers(distribution_channel);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_is_active ON pricing_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_stripe_price_id ON pricing_tiers(stripe_price_id);

-- DLC Content Packages Table
CREATE TABLE IF NOT EXISTS dlc_content_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version TEXT UNIQUE NOT NULL,
  download_url TEXT NOT NULL,
  checksum TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  release_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changelog JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for DLC content packages
CREATE INDEX IF NOT EXISTS idx_dlc_content_packages_version ON dlc_content_packages(version);
CREATE INDEX IF NOT EXISTS idx_dlc_content_packages_is_active ON dlc_content_packages(is_active);

-- Row Level Security Policies

-- DLC Licenses: Users can only see their own licenses
ALTER TABLE dlc_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own DLC licenses"
  ON dlc_licenses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DLC licenses"
  ON dlc_licenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DLC licenses"
  ON dlc_licenses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Pricing Tiers: Public read access
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing tiers"
  ON pricing_tiers
  FOR SELECT
  USING (is_active = true);

-- DLC Content Packages: Public read access for active packages
ALTER TABLE dlc_content_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active DLC content packages"
  ON dlc_content_packages
  FOR SELECT
  USING (is_active = true);

-- Insert default pricing tiers
INSERT INTO pricing_tiers (tier_name, version_type, distribution_channel, price_type, price_amount, features) VALUES
-- SFW Store Pricing
('SFW App', 'sfw', 'store', 'one-time', 14.99, '["Basic 3D/2D Scanner", "Health Diary", "Education Center", "Emergency Guidance"]'::jsonb),
('SFW Pro', 'sfw', 'store', 'monthly', 12.99, '["Everything in Free", "Unlimited Scans", "Advanced Analytics", "Cloud Backup", "Progress Photos", "PE Routine Builder"]'::jsonb),
('SFW Premium', 'sfw', 'store', 'monthly', 24.99, '["Everything in Pro", "AI Health Chatbot", "AI Scan Analysis", "Medical Export (HL7 FHIR)", "Priority Support", "Custom PE Routines", "Predictive Analytics"]'::jsonb),
('SFW Pro Yearly', 'sfw', 'store', 'yearly', 124.99, '["Everything in Pro", "20% discount"]'::jsonb),
('SFW Premium Yearly', 'sfw', 'store', 'yearly', 239.99, '["Everything in Premium", "20% discount"]'::jsonb),
('SFW Lifetime', 'sfw', 'store', 'lifetime', 299.99, '["All SFW features forever", "All future SFW updates"]'::jsonb),

-- SFW Direct Pricing
('SFW App', 'sfw', 'direct', 'one-time', 9.99, '["Basic 3D/2D Scanner", "Health Diary", "Education Center", "Emergency Guidance"]'::jsonb),
('SFW Pro', 'sfw', 'direct', 'monthly', 9.99, '["Everything in Free", "Unlimited Scans", "Advanced Analytics", "Cloud Backup", "Progress Photos", "PE Routine Builder"]'::jsonb),
('SFW Premium', 'sfw', 'direct', 'monthly', 19.99, '["Everything in Pro", "AI Health Chatbot", "AI Scan Analysis", "Medical Export (HL7 FHIR)", "Priority Support", "Custom PE Routines", "Predictive Analytics"]'::jsonb),
('SFW Pro Yearly', 'sfw', 'direct', 'yearly', 95.99, '["Everything in Pro", "20% discount"]'::jsonb),
('SFW Premium Yearly', 'sfw', 'direct', 'yearly', 191.99, '["Everything in Premium", "20% discount"]'::jsonb),
('SFW Lifetime', 'sfw', 'direct', 'lifetime', 199.99, '["All SFW features forever", "All future SFW updates"]'::jsonb),

-- NSFW Direct Pricing
('NSFW App', 'nsfw', 'direct', 'one-time', 19.99, '["All SFW features", "Positions Gallery", "NSFW Visual Content", "Complete visual content system"]'::jsonb),
('NSFW Pro', 'nsfw', 'direct', 'monthly', 14.99, '["Everything in SFW Pro", "NSFW visual content", "Positions Gallery access"]'::jsonb),
('NSFW Premium', 'nsfw', 'direct', 'monthly', 29.99, '["Everything in SFW Premium", "All NSFW content", "Full visual content system", "Priority NSFW content updates"]'::jsonb),
('NSFW Pro Yearly', 'nsfw', 'direct', 'yearly', 143.99, '["Everything in NSFW Pro", "20% discount"]'::jsonb),
('NSFW Premium Yearly', 'nsfw', 'direct', 'yearly', 287.99, '["Everything in NSFW Premium", "20% discount"]'::jsonb),
('NSFW Lifetime', 'nsfw', 'direct', 'lifetime', 399.99, '["All SFW + NSFW features forever", "All future updates (SFW + NSFW)"]'::jsonb),

-- DLC Pricing (Store Users)
('NSFW DLC', 'dlc', 'store', 'one-time', 24.99, '["Unlocks all NSFW content", "Requires base SFW app"]'::jsonb),

-- DLC Pricing (Direct Users)
('NSFW DLC', 'dlc', 'direct', 'one-time', 19.99, '["Unlocks all NSFW content", "Requires base SFW app", "20% discount for direct users"]'::jsonb)
ON CONFLICT (tier_name, version_type, distribution_channel, price_type) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_dlc_licenses_updated_at
  BEFORE UPDATE ON dlc_licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_tiers_updated_at
  BEFORE UPDATE ON pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dlc_content_packages_updated_at
  BEFORE UPDATE ON dlc_content_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



-- END MIGRATION: 20251206000000_dlc_licenses_and_pricing.sql

-- BEGIN MIGRATION: 20251207000000_referral_system.sql

-- Migration: Referral System
-- Creates tables for referral program tracking and rewards

-- Referral Codes Table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  max_uses INTEGER, -- NULL = unlimited
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral Tracking Table
CREATE TABLE IF NOT EXISTS referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded', 'expired')),
  reward_type TEXT CHECK (reward_type IN ('discount', 'free_month', 'credit', 'badge')),
  reward_value DECIMAL(10, 2),
  reward_applied BOOLEAN DEFAULT false,
  referred_subscribed BOOLEAN DEFAULT false,
  referred_subscription_tier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE
);

-- Referral Rewards History
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_tracking_id UUID NOT NULL REFERENCES referral_tracking(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_value DECIMAL(10, 2) NOT NULL,
  reward_status TEXT NOT NULL DEFAULT 'pending' CHECK (reward_status IN ('pending', 'applied', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_is_active ON referral_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON referral_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred ON referral_tracking(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_status ON referral_tracking(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(reward_status);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view own referral codes" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral codes" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral codes" ON referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active referral codes for validation" ON referral_codes
  FOR SELECT USING (is_active = true);

-- RLS Policies for referral_tracking
CREATE POLICY "Users can view own referral tracking" ON referral_tracking
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Service role can manage referral tracking" ON referral_tracking
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view own rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage rewards" ON referral_rewards
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || NOW()::TEXT) 
        FROM 1 FOR 8
      )
    );
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_codes.code = generate_referral_code.code) INTO exists_check;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to update referral tracking when user subscribes
CREATE OR REPLACE FUNCTION update_referral_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user was referred
  UPDATE referral_tracking
  SET 
    referred_subscribed = true,
    referred_subscription_tier = NEW.status,
    status = CASE 
      WHEN status = 'pending' THEN 'completed'
      ELSE status
    END,
    completed_at = CASE 
      WHEN status = 'pending' THEN NOW()
      ELSE completed_at
    END
  WHERE referred_id = NEW.user_id 
    AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update referral tracking on subscription
CREATE TRIGGER trigger_update_referral_on_subscription
  AFTER INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION update_referral_on_subscription();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_referral_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_referral_codes_updated_at
  BEFORE UPDATE ON referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_updated_at();



-- END MIGRATION: 20251207000000_referral_system.sql

-- BEGIN MIGRATION: 20251207000001_achievement_system.sql

-- Migration: Achievement System
-- Creates tables for achievements, badges, streaks, and milestones

-- Achievement Definitions Table
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('consistency', 'progress', 'health', 'community', 'premium', 'special')),
  icon_name TEXT,
  badge_color TEXT DEFAULT '#3b82f6',
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('streak', 'count', 'milestone', 'custom')),
  requirement_value INTEGER,
  requirement_data JSONB, -- For custom requirements
  points INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  progress_data JSONB, -- Store additional progress data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Streak Tracking Table
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL CHECK (streak_type IN ('scan', 'routine', 'diary', 'education', 'community')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

-- Milestone Tracking Table
CREATE TABLE IF NOT EXISTS user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('scan_count', 'routine_count', 'diary_count', 'days_active', 'measurement_growth', 'custom')),
  milestone_value INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  milestone_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard Table (Opt-in, Anonymous)
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('achievements', 'streaks', 'progress', 'community')),
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  is_anonymous BOOLEAN DEFAULT true,
  display_name TEXT, -- Anonymous identifier
  period TEXT NOT NULL DEFAULT 'all_time' CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, leaderboard_type, period, period_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_category ON achievement_definitions(category);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_code ON achievement_definitions(code);
CREATE INDEX IF NOT EXISTS idx_achievement_definitions_is_active ON achievement_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_is_unlocked ON user_achievements(is_unlocked);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON user_streaks(streak_type);
CREATE INDEX IF NOT EXISTS idx_user_streaks_is_active ON user_streaks(is_active);
CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id ON user_milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestones_type ON user_milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_leaderboards_type_period ON leaderboards(leaderboard_type, period);
CREATE INDEX IF NOT EXISTS idx_leaderboards_score ON leaderboards(score DESC);

-- Enable RLS
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievement_definitions (public read)
CREATE POLICY "Anyone can view active achievement definitions" ON achievement_definitions
  FOR SELECT USING (is_active = true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage achievements" ON user_achievements
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for user_streaks
CREATE POLICY "Users can view own streaks" ON user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage streaks" ON user_streaks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for user_milestones
CREATE POLICY "Users can view own milestones" ON user_milestones
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage milestones" ON user_milestones
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for leaderboards (public read for opt-in users)
CREATE POLICY "Anyone can view leaderboards" ON leaderboards
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own leaderboard entries" ON leaderboards
  FOR ALL USING (auth.uid() = user_id);

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievement_progress(
  p_user_id UUID,
  p_achievement_code TEXT,
  p_progress_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_achievement achievement_definitions%ROWTYPE;
  v_user_achievement user_achievements%ROWTYPE;
  v_new_progress INTEGER;
  v_unlocked BOOLEAN := false;
BEGIN
  -- Get achievement definition
  SELECT * INTO v_achievement
  FROM achievement_definitions
  WHERE code = p_achievement_code AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get or create user achievement
  SELECT * INTO v_user_achievement
  FROM user_achievements
  WHERE user_id = p_user_id AND achievement_id = v_achievement.id;
  
  IF NOT FOUND THEN
    INSERT INTO user_achievements (user_id, achievement_id, progress)
    VALUES (p_user_id, v_achievement.id, p_progress_increment)
    RETURNING * INTO v_user_achievement;
  ELSE
    v_new_progress := v_user_achievement.progress + p_progress_increment;
    
    UPDATE user_achievements
    SET progress = v_new_progress,
        updated_at = NOW()
    WHERE id = v_user_achievement.id
    RETURNING * INTO v_user_achievement;
  END IF;
  
  -- Check if achievement should be unlocked
  IF NOT v_user_achievement.is_unlocked THEN
    CASE v_achievement.requirement_type
      WHEN 'streak' THEN
        IF v_user_achievement.progress >= COALESCE(v_achievement.requirement_value, 0) THEN
          v_unlocked := true;
        END IF;
      WHEN 'count' THEN
        IF v_user_achievement.progress >= COALESCE(v_achievement.requirement_value, 0) THEN
          v_unlocked := true;
        END IF;
      WHEN 'milestone' THEN
        IF v_user_achievement.progress >= COALESCE(v_achievement.requirement_value, 0) THEN
          v_unlocked := true;
        END IF;
      ELSE
        -- Custom requirement logic would go here
        v_unlocked := false;
    END CASE;
    
    IF v_unlocked THEN
      UPDATE user_achievements
      SET is_unlocked = true,
          unlocked_at = NOW(),
          updated_at = NOW()
      WHERE id = v_user_achievement.id;
    END IF;
  END IF;
  
  RETURN v_unlocked;
END;
$$ LANGUAGE plpgsql;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_streak(
  p_user_id UUID,
  p_streak_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_streak user_streaks%ROWTYPE;
  v_new_streak INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get or create streak
  SELECT * INTO v_streak
  FROM user_streaks
  WHERE user_id = p_user_id AND streak_type = p_streak_type;
  
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_start_date)
    VALUES (p_user_id, p_streak_type, 1, 1, v_today, v_today)
    RETURNING * INTO v_streak;
    RETURN 1;
  END IF;
  
  -- Check if streak is broken (last activity was not yesterday)
  IF v_streak.last_activity_date IS NULL OR v_streak.last_activity_date < v_today - INTERVAL '1 day' THEN
    -- Reset streak if broken
    IF v_streak.last_activity_date < v_today - INTERVAL '1 day' THEN
      UPDATE user_streaks
      SET current_streak = 1,
          streak_start_date = v_today,
          last_activity_date = v_today,
          updated_at = NOW()
      WHERE id = v_streak.id;
      RETURN 1;
    END IF;
  END IF;
  
  -- Increment streak if continuing
  IF v_streak.last_activity_date = v_today - INTERVAL '1 day' OR v_streak.last_activity_date = v_today THEN
    IF v_streak.last_activity_date < v_today THEN
      v_new_streak := v_streak.current_streak + 1;
      
      UPDATE user_streaks
      SET current_streak = v_new_streak,
          longest_streak = GREATEST(longest_streak, v_new_streak),
          last_activity_date = v_today,
          updated_at = NOW()
      WHERE id = v_streak.id;
      
      RETURN v_new_streak;
    END IF;
  END IF;
  
  RETURN v_streak.current_streak;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_achievement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_achievement_definitions_updated_at
  BEFORE UPDATE ON achievement_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_achievement_updated_at();

CREATE TRIGGER trigger_user_achievements_updated_at
  BEFORE UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_achievement_updated_at();

CREATE TRIGGER trigger_user_streaks_updated_at
  BEFORE UPDATE ON user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_achievement_updated_at();

CREATE TRIGGER trigger_leaderboards_updated_at
  BEFORE UPDATE ON leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION update_achievement_updated_at();



-- END MIGRATION: 20251207000001_achievement_system.sql

-- BEGIN MIGRATION: 20251207000002_testimonials_system.sql

-- Migration: Testimonials System
-- Creates tables for user testimonials, reviews, and trust badges

-- Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
  display_name TEXT, -- Anonymous display name
  is_anonymous BOOLEAN DEFAULT true,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('general', 'health', 'progress', 'support', 'premium')),
  is_verified BOOLEAN DEFAULT false, -- Verified user
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false, -- Moderation
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Testimonial Helpful Votes
CREATE TABLE IF NOT EXISTS testimonial_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES testimonials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(testimonial_id, user_id)
);

-- Success Stories Table
CREATE TABLE IF NOT EXISTS success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  before_data JSONB, -- Before metrics/data
  after_data JSONB, -- After metrics/data
  time_period TEXT, -- e.g., "3 months", "6 months"
  category TEXT CHECK (category IN ('growth', 'health', 'routine', 'overall')),
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Before/After Photos (Opt-in, Anonymous)
CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  before_image_url TEXT,
  after_image_url TEXT,
  time_period TEXT,
  category TEXT CHECK (category IN ('growth', 'health', 'routine')),
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trust Badges Configuration
CREATE TABLE IF NOT EXISTS trust_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_name TEXT UNIQUE NOT NULL,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('security', 'compliance', 'certification', 'award')),
  icon_url TEXT,
  description TEXT,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_testimonials_is_approved ON testimonials(is_approved);
CREATE INDEX IF NOT EXISTS idx_testimonials_is_featured ON testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_testimonials_category ON testimonials(category);
CREATE INDEX IF NOT EXISTS idx_testimonials_rating ON testimonials(rating);
CREATE INDEX IF NOT EXISTS idx_testimonial_votes_testimonial ON testimonial_votes(testimonial_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_is_approved ON success_stories(is_approved);
CREATE INDEX IF NOT EXISTS idx_success_stories_is_featured ON success_stories(is_featured);
CREATE INDEX IF NOT EXISTS idx_progress_photos_is_approved ON progress_photos(is_approved);
CREATE INDEX IF NOT EXISTS idx_trust_badges_is_active ON trust_badges(is_active);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for testimonials
CREATE POLICY "Anyone can view approved testimonials" ON testimonials
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create own testimonials" ON testimonials
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own testimonials" ON testimonials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can moderate testimonials" ON testimonials
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for testimonial_votes
CREATE POLICY "Users can vote on testimonials" ON testimonial_votes
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for success_stories
CREATE POLICY "Anyone can view approved success stories" ON success_stories
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create own success stories" ON success_stories
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can moderate success stories" ON success_stories
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for progress_photos
CREATE POLICY "Anyone can view approved progress photos" ON progress_photos
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create own progress photos" ON progress_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can moderate progress photos" ON progress_photos
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for trust_badges (public read)
CREATE POLICY "Anyone can view active trust badges" ON trust_badges
  FOR SELECT USING (is_active = true);

-- Function to update helpful count
CREATE OR REPLACE FUNCTION update_testimonial_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE testimonials
    SET helpful_count = helpful_count + CASE WHEN NEW.is_helpful THEN 1 ELSE -1 END
    WHERE id = NEW.testimonial_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE testimonials
    SET helpful_count = helpful_count + CASE 
      WHEN NEW.is_helpful AND NOT OLD.is_helpful THEN 2
      WHEN NOT NEW.is_helpful AND OLD.is_helpful THEN -2
      ELSE 0
    END
    WHERE id = NEW.testimonial_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE testimonials
    SET helpful_count = helpful_count - CASE WHEN OLD.is_helpful THEN 1 ELSE -1 END
    WHERE id = OLD.testimonial_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for helpful count
CREATE TRIGGER trigger_update_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON testimonial_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonial_helpful_count();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_testimonial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_testimonials_updated_at
  BEFORE UPDATE ON testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonial_updated_at();

CREATE TRIGGER trigger_success_stories_updated_at
  BEFORE UPDATE ON success_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonial_updated_at();



-- END MIGRATION: 20251207000002_testimonials_system.sql

-- BEGIN MIGRATION: 20251207000003_privacy_settings.sql

-- Migration: Enhanced Privacy Settings
-- Creates table for advanced privacy controls

CREATE TABLE IF NOT EXISTS user_privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  app_lock_enabled BOOLEAN DEFAULT false,
  app_lock_method TEXT DEFAULT 'biometric' CHECK (app_lock_method IN ('pin', 'biometric', 'both')),
  content_lock_enabled BOOLEAN DEFAULT false,
  locked_content_ids TEXT[] DEFAULT '{}',
  hidden_mode_enabled BOOLEAN DEFAULT false,
  private_browsing_enabled BOOLEAN DEFAULT false,
  incognito_mode_enabled BOOLEAN DEFAULT false,
  data_anonymization_enabled BOOLEAN DEFAULT false,
  privacy_dashboard_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON user_privacy_settings(user_id);

-- Enable RLS
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own privacy settings" ON user_privacy_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings" ON user_privacy_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings" ON user_privacy_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_privacy_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_privacy_settings_updated_at
  BEFORE UPDATE ON user_privacy_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_privacy_settings_updated_at();



-- END MIGRATION: 20251207000003_privacy_settings.sql

-- BEGIN MIGRATION: 20251207000004_email_analytics.sql

-- Migration: Email Analytics
-- Creates table for email marketing analytics

CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_address TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aggregate email analytics view
CREATE OR REPLACE VIEW email_analytics_summary AS
SELECT
  DATE(created_at) as date,
  event_type,
  COUNT(*) as count
FROM email_analytics
GROUP BY DATE(created_at), event_type;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_analytics_user_id ON email_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_campaign_id ON email_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_event_type ON email_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_email_analytics_created_at ON email_analytics(created_at);

-- Enable RLS
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own email analytics" ON email_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage email analytics" ON email_analytics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');



-- END MIGRATION: 20251207000004_email_analytics.sql

-- BEGIN MIGRATION: 20251207000005_comprehensive_health_monitoring.sql

-- Migration: Comprehensive Health Monitoring System
-- Creates tables for prostate, testicular, sexual health, and overall wellness tracking

-- Prostate Health Tracking
CREATE TABLE IF NOT EXISTS prostate_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  psa_level DECIMAL(5,2), -- PSA level if provided
  symptoms TEXT[], -- Array of symptoms
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  urination_frequency INTEGER, -- Times per day
  urination_difficulty TEXT CHECK (urination_difficulty IN ('none', 'mild', 'moderate', 'severe')),
  blood_in_urine BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Testicular Health Tracking
CREATE TABLE IF NOT EXISTS testicular_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  self_exam_performed BOOLEAN DEFAULT false,
  abnormalities_found BOOLEAN DEFAULT false,
  abnormality_description TEXT,
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  swelling BOOLEAN DEFAULT false,
  lumps_detected BOOLEAN DEFAULT false,
  size_changes TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Sexual Health Metrics
CREATE TABLE IF NOT EXISTS sexual_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  erectile_function_score INTEGER CHECK (erectile_function_score >= 0 AND erectile_function_score <= 10),
  libido_level INTEGER CHECK (libido_level >= 0 AND libido_level <= 10),
  satisfaction_level INTEGER CHECK (satisfaction_level >= 0 AND satisfaction_level <= 10),
  frequency_per_week INTEGER,
  orgasm_quality INTEGER CHECK (orgasm_quality >= 0 AND orgasm_quality <= 10),
  premature_ejaculation BOOLEAN DEFAULT false,
  delayed_ejaculation BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Hormone Level Tracking (User-Provided)
CREATE TABLE IF NOT EXISTS hormone_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_date DATE NOT NULL,
  testosterone_total DECIMAL(6,2), -- ng/dL
  testosterone_free DECIMAL(5,2), -- pg/mL
  lh DECIMAL(5,2), -- Luteinizing Hormone
  fsh DECIMAL(5,2), -- Follicle-Stimulating Hormone
  prolactin DECIMAL(5,2),
  shbg DECIMAL(5,2), -- Sex Hormone Binding Globulin
  notes TEXT,
  lab_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Urinary Health Tracking
CREATE TABLE IF NOT EXISTS urinary_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  frequency_per_day INTEGER,
  urgency_level INTEGER CHECK (urgency_level >= 0 AND urgency_level <= 10),
  nocturia_count INTEGER, -- Times waking up at night
  incontinence BOOLEAN DEFAULT false,
  incontinence_type TEXT CHECK (incontinence_type IN ('stress', 'urge', 'overflow', 'functional', 'mixed')),
  stream_strength INTEGER CHECK (stream_strength >= 0 AND stream_strength <= 10),
  incomplete_emptying BOOLEAN DEFAULT false,
  pain_on_urination BOOLEAN DEFAULT false,
  blood_in_urine BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Overall Sexual Wellness Score
CREATE TABLE IF NOT EXISTS sexual_wellness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  physical_score INTEGER CHECK (physical_score >= 0 AND physical_score <= 100),
  emotional_score INTEGER CHECK (emotional_score >= 0 AND emotional_score <= 100),
  relationship_score INTEGER CHECK (relationship_score >= 0 AND relationship_score <= 100),
  factors JSONB, -- Contributing factors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Health Risk Factors
CREATE TABLE IF NOT EXISTS health_risk_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_type TEXT NOT NULL CHECK (risk_type IN ('prostate', 'testicular', 'sexual', 'urinary', 'general')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  risk_factors TEXT[], -- Array of identified risk factors
  recommendations TEXT[],
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Alerts
CREATE TABLE IF NOT EXISTS health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('warning', 'caution', 'info', 'reminder')),
  category TEXT NOT NULL CHECK (category IN ('prostate', 'testicular', 'sexual', 'urinary', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_required BOOLEAN DEFAULT false,
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prostate_health_user_date ON prostate_health(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_testicular_health_user_date ON testicular_health(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_sexual_health_user_date ON sexual_health_metrics(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_hormone_levels_user_date ON hormone_levels(user_id, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_urinary_health_user_date ON urinary_health(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_wellness_scores_user_date ON sexual_wellness_scores(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_risk_factors_user_type ON health_risk_factors(user_id, risk_type);
CREATE INDEX IF NOT EXISTS idx_health_alerts_user_read ON health_alerts(user_id, is_read);

-- Enable RLS
ALTER TABLE prostate_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE testicular_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE sexual_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hormone_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE urinary_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE sexual_wellness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies - All tables follow same pattern
CREATE POLICY "Users can view own prostate health" ON prostate_health
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own prostate health" ON prostate_health
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own testicular health" ON testicular_health
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own testicular health" ON testicular_health
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sexual health" ON sexual_health_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sexual health" ON sexual_health_metrics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own hormone levels" ON hormone_levels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own hormone levels" ON hormone_levels
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own urinary health" ON urinary_health
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own urinary health" ON urinary_health
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own wellness scores" ON sexual_wellness_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wellness scores" ON sexual_wellness_scores
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own risk factors" ON health_risk_factors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own health alerts" ON health_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own health alerts" ON health_alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can create health alerts" ON health_alerts
  FOR INSERT USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_health_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_prostate_health_updated_at
  BEFORE UPDATE ON prostate_health
  FOR EACH ROW
  EXECUTE FUNCTION update_health_updated_at();

CREATE TRIGGER trigger_testicular_health_updated_at
  BEFORE UPDATE ON testicular_health
  FOR EACH ROW
  EXECUTE FUNCTION update_health_updated_at();

CREATE TRIGGER trigger_sexual_health_updated_at
  BEFORE UPDATE ON sexual_health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_health_updated_at();

CREATE TRIGGER trigger_hormone_levels_updated_at
  BEFORE UPDATE ON hormone_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_health_updated_at();

CREATE TRIGGER trigger_urinary_health_updated_at
  BEFORE UPDATE ON urinary_health
  FOR EACH ROW
  EXECUTE FUNCTION update_health_updated_at();



-- END MIGRATION: 20251207000005_comprehensive_health_monitoring.sql

-- BEGIN MIGRATION: 20251207000006_prostate_testicular_education.sql

-- Migration: Prostate & Testicular Health Education Content
-- Creates tables for educational content, assessments, and guides

-- Educational Content Library
CREATE TABLE IF NOT EXISTS health_education_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'guide', 'assessment', 'tutorial', 'faq')),
  category TEXT NOT NULL CHECK (category IN ('prostate', 'testicular', 'sexual', 'urinary', 'general', 'prevention')),
  content TEXT NOT NULL,
  summary TEXT,
  video_url TEXT,
  image_url TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  reading_time_minutes INTEGER,
  tags TEXT[],
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Assessments
CREATE TABLE IF NOT EXISTS health_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prostate', 'testicular', 'sexual', 'urinary', 'general')),
  description TEXT,
  questions JSONB NOT NULL, -- Array of assessment questions
  scoring_logic JSONB, -- How to calculate scores
  risk_levels JSONB, -- Risk level thresholds
  recommendations JSONB, -- Recommendations by score/risk level
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Assessment Results
CREATE TABLE IF NOT EXISTS user_assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES health_assessments(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  recommendations TEXT[],
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Self-Examination Guides
CREATE TABLE IF NOT EXISTS self_examination_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('testicular', 'prostate', 'general')),
  step_by_step_instructions TEXT[] NOT NULL,
  video_url TEXT,
  image_urls TEXT[],
  frequency_recommendation TEXT, -- e.g., "Monthly", "Every 3 months"
  warning_signs TEXT[],
  when_to_see_doctor TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Screening Reminders
CREATE TABLE IF NOT EXISTS screening_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('psa_test', 'testicular_exam', 'general_checkup', 'specialist_visit')),
  frequency_months INTEGER,
  last_reminder_date DATE,
  next_reminder_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Symptom Checker Database
CREATE TABLE IF NOT EXISTS symptom_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prostate', 'testicular', 'sexual', 'urinary', 'general')),
  possible_conditions TEXT[],
  severity_levels TEXT[],
  when_to_see_doctor TEXT,
  self_care_tips TEXT[],
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Risk Factor Calculator Data
CREATE TABLE IF NOT EXISTS risk_factor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_type TEXT NOT NULL CHECK (risk_type IN ('prostate_cancer', 'testicular_cancer', 'sexual_dysfunction', 'urinary_issues')),
  factor_name TEXT NOT NULL,
  factor_weight DECIMAL(3,2), -- Weight in risk calculation
  description TEXT,
  mitigation_strategies TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_education_content_category ON health_education_content(category);
CREATE INDEX IF NOT EXISTS idx_education_content_type ON health_education_content(content_type);
CREATE INDEX IF NOT EXISTS idx_education_content_featured ON health_education_content(is_featured);
CREATE INDEX IF NOT EXISTS idx_assessments_category ON health_assessments(category);
CREATE INDEX IF NOT EXISTS idx_user_assessment_results_user ON user_assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assessment_results_assessment ON user_assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_self_exam_guides_type ON self_examination_guides(exam_type);
CREATE INDEX IF NOT EXISTS idx_screening_reminders_user ON screening_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_screening_reminders_next_date ON screening_reminders(next_reminder_date);
CREATE INDEX IF NOT EXISTS idx_symptom_patterns_category ON symptom_patterns(category);
CREATE INDEX IF NOT EXISTS idx_risk_factor_data_type ON risk_factor_data(risk_type);

-- Enable RLS
ALTER TABLE health_education_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_examination_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_factor_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active education content" ON health_education_content
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view active assessments" ON health_assessments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own assessment results" ON user_assessment_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assessment results" ON user_assessment_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view active self-exam guides" ON self_examination_guides
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own screening reminders" ON screening_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own screening reminders" ON screening_reminders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view symptom patterns" ON symptom_patterns
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view risk factor data" ON risk_factor_data
  FOR SELECT USING (true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_education_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_education_content_updated_at
  BEFORE UPDATE ON health_education_content
  FOR EACH ROW
  EXECUTE FUNCTION update_education_updated_at();

CREATE TRIGGER trigger_assessments_updated_at
  BEFORE UPDATE ON health_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_education_updated_at();

CREATE TRIGGER trigger_self_exam_guides_updated_at
  BEFORE UPDATE ON self_examination_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_education_updated_at();

CREATE TRIGGER trigger_screening_reminders_updated_at
  BEFORE UPDATE ON screening_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_education_updated_at();



-- END MIGRATION: 20251207000006_prostate_testicular_education.sql

-- BEGIN MIGRATION: 20251207000007_ai_health_insights.sql

-- Migration: AI Health Insights System
-- Creates tables for daily insights, patterns, and predictions

-- Daily Health Insights
CREATE TABLE IF NOT EXISTS daily_health_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_date DATE NOT NULL DEFAULT CURRENT_DATE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern', 'prediction', 'recommendation', 'warning', 'celebration')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prostate', 'testicular', 'sexual', 'urinary', 'general', 'routine')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  actionable BOOLEAN DEFAULT false,
  action_items TEXT[],
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, insight_date, title)
);

-- Health Pattern Analysis Cache
CREATE TABLE IF NOT EXISTS health_pattern_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_data JSONB NOT NULL,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Prediction Cache
CREATE TABLE IF NOT EXISTS health_prediction_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timeframe TEXT NOT NULL CHECK (timeframe IN ('1_month', '3_months', '6_months', '1_year')),
  prediction_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_date ON daily_health_insights(user_id, insight_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_insights_read ON daily_health_insights(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_pattern_cache_user ON health_pattern_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_cache_user_timeframe ON health_prediction_cache(user_id, timeframe);

-- Enable RLS
ALTER TABLE daily_health_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_pattern_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_prediction_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own insights" ON daily_health_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON daily_health_insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can create insights" ON daily_health_insights
  FOR INSERT USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view own pattern cache" ON health_pattern_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage pattern cache" ON health_pattern_cache
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view own prediction cache" ON health_prediction_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage prediction cache" ON health_prediction_cache
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');



-- END MIGRATION: 20251207000007_ai_health_insights.sql

-- BEGIN MIGRATION: 20251207000008_community_system.sql

-- Migration: Community System
-- Creates tables for forums, discussions, posts, comments, and social features

-- Community Forums
CREATE TABLE IF NOT EXISTS community_forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('general', 'health', 'progress', 'support', 'nsfw', 'education')),
  icon_url TEXT,
  is_nsfw BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forum Posts
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES community_forums(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Comments
CREATE TABLE IF NOT EXISTS forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Likes
CREATE TABLE IF NOT EXISTS forum_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Comment Likes
CREATE TABLE IF NOT EXISTS forum_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES forum_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- User Follows (Follow other users)
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community Challenges
CREATE TABLE IF NOT EXISTS community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('streak', 'goal', 'milestone', 'community')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rules JSONB,
  rewards JSONB,
  participant_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge Participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES community_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_data JSONB,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forum_posts_forum ON forum_posts(forum_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_user ON forum_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent ON forum_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_read ON direct_messages(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);

-- Enable RLS
ALTER TABLE community_forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active forums" ON community_forums
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view forum posts" ON forum_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create own posts" ON forum_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments" ON forum_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create own comments" ON forum_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON forum_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can like posts" ON forum_post_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can like comments" ON forum_comment_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own follows" ON user_follows
  FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can manage own follows" ON user_follows
  FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Users can view own messages" ON direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own received messages" ON direct_messages
  FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Anyone can view active challenges" ON community_challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own challenge participation" ON challenge_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges" ON challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_forum_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_forums
    SET post_count = post_count + 1
    WHERE id = NEW.forum_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_forums
    SET post_count = GREATEST(post_count - 1, 0)
    WHERE id = OLD.forum_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_posts
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_forum_post_counts
  AFTER INSERT OR DELETE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_forum_post_counts();

CREATE TRIGGER trigger_update_post_comment_count
  AFTER INSERT OR DELETE ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

CREATE TRIGGER trigger_update_post_like_count
  AFTER INSERT OR DELETE ON forum_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_community_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_forums_updated_at
  BEFORE UPDATE ON community_forums
  FOR EACH ROW
  EXECUTE FUNCTION update_community_updated_at();

CREATE TRIGGER trigger_posts_updated_at
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_community_updated_at();

CREATE TRIGGER trigger_comments_updated_at
  BEFORE UPDATE ON forum_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_community_updated_at();



-- END MIGRATION: 20251207000008_community_system.sql

-- BEGIN MIGRATION: 20251207000008_sexual_wellness_tracking.sql

-- Sexual Wellness Tracking System
-- Tracks sexual function, libido, satisfaction, frequency, and relationship health

-- Sexual wellness entries
CREATE TABLE IF NOT EXISTS sexual_wellness_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  
  -- Sexual function metrics
  erectile_function_score INTEGER CHECK (erectile_function_score >= 0 AND erectile_function_score <= 10),
  ejaculation_quality_score INTEGER CHECK (ejaculation_quality_score >= 0 AND ejaculation_quality_score <= 10),
  orgasm_intensity_score INTEGER CHECK (orgasm_intensity_score >= 0 AND orgasm_intensity_score <= 10),
  stamina_duration_minutes INTEGER,
  
  -- Libido and desire
  libido_level INTEGER CHECK (libido_level >= 0 AND libido_level <= 10),
  desire_frequency TEXT CHECK (desire_frequency IN ('daily', 'few_times_week', 'weekly', 'few_times_month', 'monthly', 'rarely')),
  morning_erections BOOLEAN,
  
  -- Satisfaction and experience
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 0 AND overall_satisfaction <= 10),
  partner_satisfaction INTEGER CHECK (partner_satisfaction >= 0 AND partner_satisfaction <= 10),
  sexual_confidence INTEGER CHECK (sexual_confidence >= 0 AND sexual_confidence <= 10),
  
  -- Frequency tracking
  sexual_activity_count INTEGER DEFAULT 0,
  masturbation_count INTEGER DEFAULT 0,
  activity_type TEXT CHECK (activity_type IN ('intercourse', 'masturbation', 'oral', 'other', 'none')),
  
  -- Relationship health (optional, privacy-controlled)
  relationship_satisfaction INTEGER CHECK (relationship_satisfaction >= 0 AND relationship_satisfaction <= 10),
  communication_quality INTEGER CHECK (communication_quality >= 0 AND communication_quality <= 10),
  intimacy_level INTEGER CHECK (intimacy_level >= 0 AND intimacy_level <= 10),
  
  -- Contextual factors
  stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 10),
  sleep_quality INTEGER CHECK (sleep_quality >= 0 AND sleep_quality <= 10),
  exercise_level TEXT CHECK (exercise_level IN ('none', 'light', 'moderate', 'intense')),
  alcohol_consumption TEXT CHECK (alcohol_consumption IN ('none', 'light', 'moderate', 'heavy')),
  
  -- Wellness score (calculated)
  wellness_score DECIMAL(5,2) CHECK (wellness_score >= 0 AND wellness_score <= 100),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, entry_date)
);

-- Sexual wellness goals
CREATE TABLE IF NOT EXISTS sexual_wellness_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  goal_type TEXT NOT NULL CHECK (goal_type IN ('erectile_function', 'libido', 'satisfaction', 'frequency', 'stamina', 'confidence', 'communication', 'intimacy')),
  target_value INTEGER,
  target_date DATE,
  current_value INTEGER,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sexual wellness patterns (AI-generated insights)
CREATE TABLE IF NOT EXISTS sexual_wellness_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('correlation', 'trend', 'anomaly', 'improvement', 'decline')),
  pattern_description TEXT NOT NULL,
  affected_metrics TEXT[],
  correlation_factors TEXT[],
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner mode (optional, privacy-controlled)
CREATE TABLE IF NOT EXISTS partner_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_email TEXT, -- For non-user partners
  
  connection_code TEXT UNIQUE NOT NULL,
  connection_status TEXT NOT NULL DEFAULT 'pending' CHECK (connection_status IN ('pending', 'active', 'paused', 'disconnected')),
  
  -- Privacy settings
  share_wellness_data BOOLEAN DEFAULT false,
  share_goals BOOLEAN DEFAULT false,
  share_insights BOOLEAN DEFAULT false,
  
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sexual_wellness_entries_user_date ON sexual_wellness_entries(user_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_sexual_wellness_entries_user_id ON sexual_wellness_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_sexual_wellness_goals_user_id ON sexual_wellness_goals(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sexual_wellness_patterns_user_id ON sexual_wellness_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_connections_user_id ON partner_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_connections_code ON partner_connections(connection_code);

-- RLS Policies
ALTER TABLE sexual_wellness_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sexual_wellness_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sexual_wellness_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_connections ENABLE ROW LEVEL SECURITY;

-- Sexual wellness entries policies
CREATE POLICY "Users can view their own sexual wellness entries"
  ON sexual_wellness_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sexual wellness entries"
  ON sexual_wellness_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sexual wellness entries"
  ON sexual_wellness_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sexual wellness entries"
  ON sexual_wellness_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Sexual wellness goals policies
CREATE POLICY "Users can view their own sexual wellness goals"
  ON sexual_wellness_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sexual wellness goals"
  ON sexual_wellness_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sexual wellness goals"
  ON sexual_wellness_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sexual wellness goals"
  ON sexual_wellness_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Sexual wellness patterns policies
CREATE POLICY "Users can view their own sexual wellness patterns"
  ON sexual_wellness_patterns FOR SELECT
  USING (auth.uid() = user_id);

-- Partner connections policies
CREATE POLICY "Users can view their own partner connections"
  ON partner_connections FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = partner_user_id);

CREATE POLICY "Users can insert their own partner connections"
  ON partner_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own partner connections"
  ON partner_connections FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = partner_user_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = partner_user_id);

CREATE POLICY "Users can delete their own partner connections"
  ON partner_connections FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = partner_user_id);

-- Function to calculate wellness score
CREATE OR REPLACE FUNCTION calculate_sexual_wellness_score(
  p_erectile_function INTEGER,
  p_libido INTEGER,
  p_satisfaction INTEGER,
  p_confidence INTEGER,
  p_frequency_count INTEGER
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_score DECIMAL(5,2);
BEGIN
  -- Weighted calculation: function (30%), libido (20%), satisfaction (25%), confidence (15%), frequency (10%)
  v_score := (
    COALESCE(p_erectile_function, 5) * 0.30 +
    COALESCE(p_libido, 5) * 0.20 +
    COALESCE(p_satisfaction, 5) * 0.25 +
    COALESCE(p_confidence, 5) * 0.15 +
    LEAST(COALESCE(p_frequency_count, 0) * 0.5, 10) * 0.10
  ) * 10;
  
  RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-calculate wellness score
CREATE OR REPLACE FUNCTION update_sexual_wellness_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.wellness_score := calculate_sexual_wellness_score(
    NEW.erectile_function_score,
    NEW.libido_level,
    NEW.overall_satisfaction,
    NEW.sexual_confidence,
    NEW.sexual_activity_count
  );
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sexual_wellness_score
  BEFORE INSERT OR UPDATE ON sexual_wellness_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_sexual_wellness_score();

-- Function to update goal progress
CREATE OR REPLACE FUNCTION update_sexual_wellness_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_goal sexual_wellness_goals%ROWTYPE;
  v_current_value INTEGER;
BEGIN
  -- Update goals based on latest entry
  FOR v_goal IN 
    SELECT * FROM sexual_wellness_goals 
    WHERE user_id = NEW.user_id AND is_active = true
  LOOP
    CASE v_goal.goal_type
      WHEN 'erectile_function' THEN
        v_current_value := NEW.erectile_function_score;
      WHEN 'libido' THEN
        v_current_value := NEW.libido_level;
      WHEN 'satisfaction' THEN
        v_current_value := NEW.overall_satisfaction;
      WHEN 'frequency' THEN
        v_current_value := NEW.sexual_activity_count;
      WHEN 'stamina' THEN
        v_current_value := NEW.stamina_duration_minutes;
      WHEN 'confidence' THEN
        v_current_value := NEW.sexual_confidence;
      ELSE
        v_current_value := NULL;
    END CASE;
    
    IF v_current_value IS NOT NULL AND v_goal.target_value IS NOT NULL THEN
      UPDATE sexual_wellness_goals
      SET 
        current_value = v_current_value,
        progress_percentage = LEAST((v_current_value::DECIMAL / NULLIF(v_goal.target_value, 0)) * 100, 100),
        updated_at = NOW()
      WHERE id = v_goal.id;
      
      -- Mark as completed if target reached
      IF v_current_value >= v_goal.target_value THEN
        UPDATE sexual_wellness_goals
        SET 
          is_active = false,
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = v_goal.id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sexual_wellness_goals
  AFTER INSERT OR UPDATE ON sexual_wellness_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_sexual_wellness_goal_progress();



-- END MIGRATION: 20251207000008_sexual_wellness_tracking.sql

-- BEGIN MIGRATION: 20251207000009_sexual_health_education.sql

-- Comprehensive Sexual Health Education System
-- Manages educational content, interactive learning, Q&A, and expert content

-- Education modules/categories
CREATE TABLE IF NOT EXISTS sexual_health_education_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('anatomy', 'function', 'conditions', 'treatment', 'prevention', 'wellness', 'relationships', 'myths')),
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  age_group TEXT CHECK (age_group IN ('18-25', '26-35', '36-45', '46-55', '56+', 'all')),
  estimated_duration_minutes INTEGER,
  content_type TEXT CHECK (content_type IN ('article', 'video', 'interactive', 'quiz', 'assessment')),
  
  -- Content
  content_text TEXT,
  content_html TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  
  -- Metadata
  author TEXT,
  expert_reviewed BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Organization
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interactive learning content (quizzes, assessments)
CREATE TABLE IF NOT EXISTS education_interactive_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES sexual_health_education_modules(id) ON DELETE CASCADE,
  
  content_type TEXT NOT NULL CHECK (content_type IN ('quiz', 'assessment', 'interactive_guide')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Quiz/Assessment structure (stored as JSON)
  questions JSONB NOT NULL,
  answers JSONB,
  passing_score INTEGER DEFAULT 70,
  
  -- Results tracking
  completion_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS education_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES sexual_health_education_modules(id) ON DELETE CASCADE,
  
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  
  -- Quiz/Assessment results
  quiz_score DECIMAL(5,2),
  quiz_attempts INTEGER DEFAULT 0,
  quiz_completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, module_id)
);

-- Q&A database
CREATE TABLE IF NOT EXISTS education_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT CHECK (category IN ('anatomy', 'function', 'conditions', 'treatment', 'prevention', 'wellness', 'relationships', 'myths', 'general')),
  
  -- Expert information
  answered_by TEXT,
  expert_verified BOOLEAN DEFAULT false,
  source_url TEXT,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- Organization
  tags TEXT[],
  related_module_ids UUID[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Q&A interactions
CREATE TABLE IF NOT EXISTS education_qa_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qa_id UUID NOT NULL REFERENCES education_qa(id) ON DELETE CASCADE,
  
  was_helpful BOOLEAN,
  user_question TEXT, -- User's specific question if asking new one
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, qa_id)
);

-- Expert interviews/content
CREATE TABLE IF NOT EXISTS education_expert_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  expert_name TEXT NOT NULL,
  expert_title TEXT,
  expert_credentials TEXT,
  expert_bio TEXT,
  expert_image_url TEXT,
  
  content_type TEXT CHECK (content_type IN ('interview', 'article', 'video', 'webinar')),
  title TEXT NOT NULL,
  description TEXT,
  content_text TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  
  duration_minutes INTEGER,
  transcript TEXT,
  
  -- Metadata
  topics TEXT[],
  tags TEXT[],
  is_premium BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Research updates/news
CREATE TABLE IF NOT EXISTS education_research_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_article TEXT,
  source_url TEXT,
  source_name TEXT,
  
  category TEXT CHECK (category IN ('research', 'news', 'breakthrough', 'study', 'guideline')),
  tags TEXT[],
  
  published_date DATE,
  relevance_score INTEGER DEFAULT 0, -- 0-100
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User bookmarks/favorites
CREATE TABLE IF NOT EXISTS education_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content_type TEXT NOT NULL CHECK (content_type IN ('module', 'qa', 'expert_content', 'research_update')),
  content_id UUID NOT NULL,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, content_type, content_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_education_modules_category ON sexual_health_education_modules(category);
CREATE INDEX IF NOT EXISTS idx_education_modules_featured ON sexual_health_education_modules(is_featured, order_index);
CREATE INDEX IF NOT EXISTS idx_education_modules_premium ON sexual_health_education_modules(is_premium);
CREATE INDEX IF NOT EXISTS idx_education_interactive_module ON education_interactive_content(module_id);
CREATE INDEX IF NOT EXISTS idx_education_progress_user ON education_user_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_education_progress_module ON education_user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_education_qa_category ON education_qa(category);
CREATE INDEX IF NOT EXISTS idx_education_qa_verified ON education_qa(expert_verified);
CREATE INDEX IF NOT EXISTS idx_education_qa_interactions_user ON education_qa_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_education_expert_published ON education_expert_content(published_at);
CREATE INDEX IF NOT EXISTS idx_education_research_category ON education_research_updates(category, published_date);
CREATE INDEX IF NOT EXISTS idx_education_bookmarks_user ON education_bookmarks(user_id, content_type);

-- RLS Policies
ALTER TABLE sexual_health_education_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_interactive_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_qa_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_expert_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_research_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_bookmarks ENABLE ROW LEVEL SECURITY;

-- Education modules policies (public read, admin write)
CREATE POLICY "Anyone can view education modules"
  ON sexual_health_education_modules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage education modules"
  ON sexual_health_education_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Interactive content policies
CREATE POLICY "Anyone can view interactive content"
  ON education_interactive_content FOR SELECT
  USING (true);

-- User progress policies
CREATE POLICY "Users can view their own progress"
  ON education_user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress"
  ON education_user_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Q&A policies
CREATE POLICY "Anyone can view Q&A"
  ON education_qa FOR SELECT
  USING (true);

CREATE POLICY "Users can interact with Q&A"
  ON education_qa_interactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Expert content policies
CREATE POLICY "Anyone can view expert content"
  ON education_expert_content FOR SELECT
  USING (true);

-- Research updates policies
CREATE POLICY "Anyone can view research updates"
  ON education_research_updates FOR SELECT
  USING (true);

-- Bookmarks policies
CREATE POLICY "Users can manage their own bookmarks"
  ON education_bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update module view count
CREATE OR REPLACE FUNCTION increment_module_view_count(module_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE sexual_health_education_modules
  SET view_count = view_count + 1
  WHERE id = module_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user's education completion percentage
CREATE OR REPLACE FUNCTION get_user_education_completion(user_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_modules INTEGER;
  completed_modules INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_modules
  FROM sexual_health_education_modules
  WHERE is_premium = false; -- Only count free modules for completion
  
  SELECT COUNT(*) INTO completed_modules
  FROM education_user_progress
  WHERE education_user_progress.user_id = get_user_education_completion.user_id
    AND is_completed = true;
  
  IF total_modules = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (completed_modules::DECIMAL / total_modules::DECIMAL) * 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- END MIGRATION: 20251207000009_sexual_health_education.sql

-- BEGIN MIGRATION: 20251207000010_community_forum.sql

-- Community Forum System
-- Discussion boards, threads, posts, replies, moderation, and user engagement

-- Forum categories
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  is_nsfw BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  requires_premium BOOLEAN DEFAULT false,
  post_count INTEGER DEFAULT 0,
  thread_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum threads
CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_expert_qa BOOLEAN DEFAULT false,
  is_success_story BOOLEAN DEFAULT false,
  
  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  moderation_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  
  -- Last activity
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum posts (replies to threads)
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE, -- For nested replies
  
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_expert_answer BOOLEAN DEFAULT false,
  
  -- Engagement
  like_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  moderation_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interactions (likes, helpful marks)
CREATE TABLE IF NOT EXISTS forum_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content_type TEXT NOT NULL CHECK (content_type IN ('thread', 'post')),
  content_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'helpful', 'bookmark')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, content_type, content_id, interaction_type)
);

-- User reputation/points
CREATE TABLE IF NOT EXISTS forum_user_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  reputation_points INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  thread_count INTEGER DEFAULT 0,
  helpful_marks_received INTEGER DEFAULT 0,
  expert_answers_count INTEGER DEFAULT 0,
  
  -- Badges/achievements
  badges TEXT[],
  level INTEGER DEFAULT 1,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation actions log
CREATE TABLE IF NOT EXISTS forum_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  
  action_type TEXT NOT NULL CHECK (action_type IN ('approve', 'reject', 'delete', 'lock', 'unlock', 'pin', 'unpin', 'warn', 'ban')),
  content_type TEXT NOT NULL CHECK (content_type IN ('thread', 'post', 'user')),
  content_id UUID NOT NULL,
  
  reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Q&A sessions
CREATE TABLE IF NOT EXISTS forum_expert_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES auth.users(id),
  category_id UUID REFERENCES forum_categories(id),
  
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  actual_start_at TIMESTAMPTZ,
  actual_end_at TIMESTAMPTZ,
  
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
  
  question_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support groups (peer support)
CREATE TABLE IF NOT EXISTS forum_support_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('health_condition', 'treatment', 'recovery', 'general_support')),
  
  is_private BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support group members
CREATE TABLE IF NOT EXISTS forum_support_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES forum_support_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(group_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON forum_threads(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_user ON forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_pinned ON forum_threads(is_pinned DESC, last_reply_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_approved ON forum_threads(is_approved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_parent ON forum_posts(parent_post_id);
CREATE INDEX IF NOT EXISTS idx_forum_interactions_user ON forum_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_interactions_content ON forum_interactions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_forum_moderation_log_moderator ON forum_moderation_log(moderator_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_expert_sessions_status ON forum_expert_sessions(status, scheduled_start_at);
CREATE INDEX IF NOT EXISTS idx_forum_support_groups_category ON forum_support_groups(category);
CREATE INDEX IF NOT EXISTS idx_forum_support_group_members_user ON forum_support_group_members(user_id);

-- RLS Policies
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_user_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_expert_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_support_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_support_group_members ENABLE ROW LEVEL SECURITY;

-- Forum categories policies (public read, admin write)
CREATE POLICY "Anyone can view forum categories"
  ON forum_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage forum categories"
  ON forum_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Forum threads policies
CREATE POLICY "Anyone can view approved threads"
  ON forum_threads FOR SELECT
  USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create threads"
  ON forum_threads FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own threads"
  ON forum_threads FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own threads"
  ON forum_threads FOR DELETE
  USING (user_id = auth.uid());

-- Forum posts policies
CREATE POLICY "Anyone can view approved posts"
  ON forum_posts FOR SELECT
  USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create posts"
  ON forum_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own posts"
  ON forum_posts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts"
  ON forum_posts FOR DELETE
  USING (user_id = auth.uid());

-- Forum interactions policies
CREATE POLICY "Users can manage their own interactions"
  ON forum_interactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User reputation policies
CREATE POLICY "Users can view all reputation"
  ON forum_user_reputation FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own reputation"
  ON forum_user_reputation FOR SELECT
  USING (auth.uid() = user_id);

-- Expert sessions policies
CREATE POLICY "Anyone can view expert sessions"
  ON forum_expert_sessions FOR SELECT
  USING (true);

-- Support groups policies
CREATE POLICY "Anyone can view public support groups"
  ON forum_support_groups FOR SELECT
  USING (is_private = false OR EXISTS (
    SELECT 1 FROM forum_support_group_members
    WHERE group_id = forum_support_groups.id AND user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create support groups"
  ON forum_support_groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Support group members policies
CREATE POLICY "Users can view group members"
  ON forum_support_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM forum_support_groups
      WHERE id = group_id AND (is_private = false OR EXISTS (
        SELECT 1 FROM forum_support_group_members
        WHERE group_id = forum_support_group_members.group_id AND user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can join support groups"
  ON forum_support_group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_thread_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_threads
    SET 
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at,
      last_reply_by = NEW.user_id
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_threads
    SET reply_count = GREATEST(reply_count - 1, 0)
    WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thread_reply_count
  AFTER INSERT OR DELETE ON forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_reply_count();

CREATE OR REPLACE FUNCTION update_category_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_categories
    SET 
      thread_count = thread_count + 1,
      last_activity_at = NEW.created_at
    WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_categories
    SET thread_count = GREATEST(thread_count - 1, 0)
    WHERE id = OLD.category_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_category_stats
  AFTER INSERT OR DELETE ON forum_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_category_stats();

CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.interaction_type = 'helpful' THEN
    -- Update reputation for helpful marks
    IF NEW.content_type = 'post' THEN
      UPDATE forum_user_reputation
      SET helpful_marks_received = helpful_marks_received + 1,
          reputation_points = reputation_points + 5
      WHERE user_id = (
        SELECT user_id FROM forum_posts WHERE id = NEW.content_id
      );
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_reputation
  AFTER INSERT ON forum_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_reputation();



-- END MIGRATION: 20251207000010_community_forum.sql

-- BEGIN MIGRATION: 20251207000011_progress_sharing_challenges.sql

-- Progress Sharing & Challenges System
-- Anonymous progress sharing, challenges, leaderboards, and community engagement

-- Progress shares (anonymous sharing)
CREATE TABLE IF NOT EXISTS progress_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  share_type TEXT NOT NULL CHECK (share_type IN ('scan', 'wellness', 'routine', 'achievement', 'milestone', 'general')),
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'chart', 'metric')),
  
  title TEXT,
  description TEXT,
  content_data JSONB, -- Flexible data storage
  
  -- Anonymization
  is_anonymous BOOLEAN DEFAULT true,
  display_name TEXT, -- Optional display name if not anonymous
  
  -- Engagement
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('30_day', '60_day', '90_day', 'custom', 'community', 'premium')),
  duration_days INTEGER NOT NULL,
  
  -- Goals and metrics
  goal_description TEXT,
  target_metrics JSONB, -- Flexible goal structure
  success_criteria JSONB,
  
  -- Timing
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT false,
  
  -- Engagement
  participant_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  -- Rewards
  reward_description TEXT,
  badge_id UUID, -- Reference to achievement badge
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'paused')),
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  current_metrics JSONB,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(challenge_id, user_id)
);

-- Challenge check-ins (daily/weekly progress)
CREATE TABLE IF NOT EXISTS challenge_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES challenge_participants(id) ON DELETE CASCADE,
  
  checkin_date DATE NOT NULL,
  metrics JSONB,
  notes TEXT,
  photo_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(participant_id, checkin_date)
);

-- Leaderboards (opt-in, anonymous)
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('challenge', 'overall', 'monthly', 'all_time', 'category')),
  
  metric_type TEXT NOT NULL CHECK (metric_type IN ('wellness_score', 'streak', 'achievements', 'challenge_completion', 'reputation', 'custom')),
  period_start DATE,
  period_end DATE,
  
  is_active BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT true,
  requires_opt_in BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard entries
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rank INTEGER,
  score DECIMAL(10,2),
  display_name TEXT, -- For anonymous leaderboards
  is_anonymous BOOLEAN DEFAULT true,
  
  metrics JSONB,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(leaderboard_id, user_id)
);

-- Progress share interactions (likes, comments)
CREATE TABLE IF NOT EXISTS progress_share_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_id UUID NOT NULL REFERENCES progress_shares(id) ON DELETE CASCADE,
  
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'comment', 'share')),
  comment_text TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, share_id, interaction_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_progress_shares_user ON progress_shares(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_shares_type ON progress_shares(share_type, is_approved);
CREATE INDEX IF NOT EXISTS idx_progress_shares_featured ON progress_shares(is_featured, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active, start_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id, status);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id, status);
CREATE INDEX IF NOT EXISTS idx_challenge_checkins_participant ON challenge_checkins(participant_id, checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_leaderboard ON leaderboard_entries(leaderboard_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_share_interactions_share ON progress_share_interactions(share_id);

-- RLS Policies
ALTER TABLE progress_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_share_interactions ENABLE ROW LEVEL SECURITY;

-- Progress shares policies
CREATE POLICY "Anyone can view approved progress shares"
  ON progress_shares FOR SELECT
  USING (is_approved = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own progress shares"
  ON progress_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress shares"
  ON progress_shares FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress shares"
  ON progress_shares FOR DELETE
  USING (auth.uid() = user_id);

-- Challenges policies
CREATE POLICY "Anyone can view active challenges"
  ON challenges FOR SELECT
  USING (true);

-- Challenge participants policies
CREATE POLICY "Users can view challenge participants"
  ON challenge_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own challenge participation"
  ON challenge_participants FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Challenge check-ins policies
CREATE POLICY "Users can view check-ins for challenges they participate in"
  ON challenge_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE id = challenge_checkins.participant_id
        AND (user_id = auth.uid() OR EXISTS (
          SELECT 1 FROM challenge_participants cp2
          WHERE cp2.challenge_id = challenge_participants.challenge_id
            AND cp2.user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Users can create check-ins for their own participation"
  ON challenge_checkins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE id = challenge_checkins.participant_id AND user_id = auth.uid()
    )
  );

-- Leaderboards policies
CREATE POLICY "Anyone can view leaderboards"
  ON leaderboards FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view leaderboard entries"
  ON leaderboard_entries FOR SELECT
  USING (true);

-- Progress share interactions policies
CREATE POLICY "Users can manage their own interactions"
  ON progress_share_interactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_challenge_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE challenges
    SET participant_count = participant_count + 1
    WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE challenges
    SET participant_count = GREATEST(participant_count - 1, 0)
    WHERE id = OLD.challenge_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_challenge_participant_count
  AFTER INSERT OR DELETE ON challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_participant_count();

CREATE OR REPLACE FUNCTION update_progress_share_interaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.interaction_type = 'like' THEN
      UPDATE progress_shares
      SET like_count = like_count + 1
      WHERE id = NEW.share_id;
    ELSIF NEW.interaction_type = 'comment' THEN
      UPDATE progress_shares
      SET comment_count = comment_count + 1
      WHERE id = NEW.share_id;
    ELSIF NEW.interaction_type = 'share' THEN
      UPDATE progress_shares
      SET share_count = share_count + 1
      WHERE id = NEW.share_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.interaction_type = 'like' THEN
      UPDATE progress_shares
      SET like_count = GREATEST(like_count - 1, 0)
      WHERE id = OLD.share_id;
    ELSIF OLD.interaction_type = 'comment' THEN
      UPDATE progress_shares
      SET comment_count = GREATEST(comment_count - 1, 0)
      WHERE id = OLD.share_id;
    ELSIF OLD.interaction_type = 'share' THEN
      UPDATE progress_shares
      SET share_count = GREATEST(share_count - 1, 0)
      WHERE id = OLD.share_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_progress_share_interaction_count
  AFTER INSERT OR DELETE ON progress_share_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_progress_share_interaction_count();




-- END MIGRATION: 20251207000011_progress_sharing_challenges.sql

-- BEGIN MIGRATION: 20251207000012_video_library.sql

-- Video Library System
-- Educational videos, tutorials, expert content, playlists, and progress tracking

-- Video library
CREATE TABLE IF NOT EXISTS video_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('education', 'exercise', 'technique', 'expert_interview', 'webinar', 'tutorial', 'nsfw_instructional')),
  
  -- Video metadata
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  
  -- Content details
  instructor_name TEXT,
  instructor_credentials TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[],
  
  -- Organization
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_nsfw BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video playlists
CREATE TABLE IF NOT EXISTS video_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  video_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist videos (many-to-many)
CREATE TABLE IF NOT EXISTS playlist_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES video_playlists(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES video_library(id) ON DELETE CASCADE,
  
  order_index INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(playlist_id, video_id)
);

-- User video progress
CREATE TABLE IF NOT EXISTS video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES video_library(id) ON DELETE CASCADE,
  
  progress_seconds INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  watch_count INTEGER DEFAULT 1,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, video_id)
);

-- Video bookmarks
CREATE TABLE IF NOT EXISTS video_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES video_library(id) ON DELETE CASCADE,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, video_id)
);

-- Video downloads (for offline viewing)
CREATE TABLE IF NOT EXISTS video_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES video_library(id) ON DELETE CASCADE,
  
  download_status TEXT DEFAULT 'pending' CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed')),
  download_progress DECIMAL(5,2) DEFAULT 0,
  local_file_path TEXT,
  file_size_bytes BIGINT,
  
  downloaded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- For temporary downloads
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, video_id)
);

-- Video ratings
CREATE TABLE IF NOT EXISTS video_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES video_library(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, video_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_library_category ON video_library(category, is_featured);
CREATE INDEX IF NOT EXISTS idx_video_library_premium ON video_library(is_premium);
CREATE INDEX IF NOT EXISTS idx_video_library_nsfw ON video_library(is_nsfw);
CREATE INDEX IF NOT EXISTS idx_video_playlists_user ON video_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist ON playlist_videos(playlist_id, order_index);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_video ON playlist_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_user ON video_progress(user_id, last_watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_progress_video ON video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_video_bookmarks_user ON video_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_video_downloads_user ON video_downloads(user_id, download_status);
CREATE INDEX IF NOT EXISTS idx_video_ratings_video ON video_ratings(video_id);

-- RLS Policies
ALTER TABLE video_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_ratings ENABLE ROW LEVEL SECURITY;

-- Video library policies (public read, admin write)
CREATE POLICY "Anyone can view videos"
  ON video_library FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage videos"
  ON video_library FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Video playlists policies
CREATE POLICY "Users can view public playlists or their own"
  ON video_playlists FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can create their own playlists"
  ON video_playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
  ON video_playlists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
  ON video_playlists FOR DELETE
  USING (auth.uid() = user_id);

-- Playlist videos policies
CREATE POLICY "Users can view playlist videos"
  ON playlist_videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_playlists
      WHERE id = playlist_videos.playlist_id
        AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage videos in their own playlists"
  ON playlist_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM video_playlists
      WHERE id = playlist_videos.playlist_id AND user_id = auth.uid()
    )
  );

-- Video progress policies
CREATE POLICY "Users can manage their own video progress"
  ON video_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Video bookmarks policies
CREATE POLICY "Users can manage their own bookmarks"
  ON video_bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Video downloads policies
CREATE POLICY "Users can manage their own downloads"
  ON video_downloads FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Video ratings policies
CREATE POLICY "Users can manage their own ratings"
  ON video_ratings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_video_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE video_library
  SET view_count = view_count + 1
  WHERE id = NEW.video_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_view_count
  AFTER INSERT ON video_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_video_view_count();

CREATE OR REPLACE FUNCTION update_playlist_video_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE video_playlists
    SET video_count = video_count + 1
    WHERE id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE video_playlists
    SET video_count = GREATEST(video_count - 1, 0)
    WHERE id = OLD.playlist_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_playlist_video_count
  AFTER INSERT OR DELETE ON playlist_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_video_count();

CREATE OR REPLACE FUNCTION update_video_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  total_ratings INTEGER;
BEGIN
  SELECT AVG(rating)::DECIMAL(3,2), COUNT(*)::INTEGER
  INTO avg_rating, total_ratings
  FROM video_ratings
  WHERE video_id = NEW.video_id;
  
  UPDATE video_library
  SET 
    rating_average = COALESCE(avg_rating, 0),
    rating_count = total_ratings
  WHERE id = NEW.video_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_rating
  AFTER INSERT OR UPDATE OR DELETE ON video_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_video_rating();




-- END MIGRATION: 20251207000012_video_library.sql

-- BEGIN MIGRATION: 20251207000013_interactive_learning.sql

-- Interactive Learning Modules System
-- Step-by-step courses, quizzes, assessments, progress tracking, and certificates

-- Learning courses
CREATE TABLE IF NOT EXISTS learning_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('health_education', 'technique', 'wellness', 'anatomy', 'treatment', 'prevention')),
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Course structure
  estimated_duration_minutes INTEGER,
  module_count INTEGER DEFAULT 0,
  lesson_count INTEGER DEFAULT 0,
  
  -- Content
  thumbnail_url TEXT,
  intro_video_url TEXT,
  
  -- Organization
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  -- Engagement
  enrollment_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course modules (sections within a course)
CREATE TABLE IF NOT EXISTS learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  estimated_duration_minutes INTEGER,
  
  lesson_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course lessons (individual learning units)
CREATE TABLE IF NOT EXISTS learning_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'video', 'interactive', 'quiz', 'assessment')),
  content_data JSONB, -- Flexible content storage
  
  order_index INTEGER DEFAULT 0,
  estimated_duration_minutes INTEGER,
  
  -- Prerequisites
  requires_completion_of UUID[], -- Lesson IDs that must be completed first
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User course enrollments
CREATE TABLE IF NOT EXISTS learning_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  current_module_id UUID REFERENCES learning_modules(id),
  current_lesson_id UUID REFERENCES learning_lessons(id),
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, course_id)
);

-- User lesson progress
CREATE TABLE IF NOT EXISTS learning_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES learning_lessons(id) ON DELETE CASCADE,
  
  is_completed BOOLEAN DEFAULT false,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, lesson_id)
);

-- Quizzes and assessments
CREATE TABLE IF NOT EXISTS learning_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES learning_lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES learning_courses(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT CHECK (quiz_type IN ('quiz', 'assessment', 'exam', 'practice')),
  
  questions JSONB NOT NULL, -- Array of question objects
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  
  attempt_limit INTEGER, -- NULL = unlimited
  show_results_immediately BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz attempts and results
CREATE TABLE IF NOT EXISTS learning_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES learning_quizzes(id) ON DELETE CASCADE,
  
  answers JSONB NOT NULL, -- User's answers
  score DECIMAL(5,2),
  percentage_score DECIMAL(5,2),
  passed BOOLEAN DEFAULT false,
  
  time_taken_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates of completion
CREATE TABLE IF NOT EXISTS learning_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course recommendations (AI-powered)
CREATE TABLE IF NOT EXISTS learning_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  
  recommendation_reason TEXT,
  confidence_score DECIMAL(5,2),
  priority INTEGER DEFAULT 0,
  
  is_viewed BOOLEAN DEFAULT false,
  is_enrolled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adaptive learning paths
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  path_type TEXT CHECK (path_type IN ('custom', 'recommended', 'adaptive')),
  
  course_ids UUID[] NOT NULL,
  current_course_index INTEGER DEFAULT 0,
  
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_courses_category ON learning_courses(category, is_featured);
CREATE INDEX IF NOT EXISTS idx_learning_modules_course ON learning_modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_learning_lessons_module ON learning_lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_learning_enrollments_user ON learning_enrollments(user_id, last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_enrollments_course ON learning_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_lesson_progress_user ON learning_lesson_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_learning_quiz_attempts_user ON learning_quiz_attempts(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_certificates_user ON learning_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_recommendations_user ON learning_recommendations(user_id, priority DESC);
CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON learning_paths(user_id);

-- RLS Policies
ALTER TABLE learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

-- Learning courses policies (public read, admin write)
CREATE POLICY "Anyone can view courses"
  ON learning_courses FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage courses"
  ON learning_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Learning modules and lessons policies (public read)
CREATE POLICY "Anyone can view modules"
  ON learning_modules FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view lessons"
  ON learning_lessons FOR SELECT
  USING (true);

-- Enrollments policies
CREATE POLICY "Users can view their own enrollments"
  ON learning_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses"
  ON learning_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON learning_enrollments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Lesson progress policies
CREATE POLICY "Users can manage their own lesson progress"
  ON learning_lesson_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quiz attempts policies
CREATE POLICY "Users can manage their own quiz attempts"
  ON learning_quiz_attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Certificates policies
CREATE POLICY "Users can view their own certificates"
  ON learning_certificates FOR SELECT
  USING (auth.uid() = user_id);

-- Recommendations policies
CREATE POLICY "Users can view their own recommendations"
  ON learning_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON learning_recommendations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Learning paths policies
CREATE POLICY "Users can manage their own learning paths"
  ON learning_paths FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE learning_courses
    SET enrollment_count = enrollment_count + 1
    WHERE id = NEW.course_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE learning_courses
    SET enrollment_count = GREATEST(enrollment_count - 1, 0)
    WHERE id = OLD.course_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_enrollment_count
  AFTER INSERT OR DELETE ON learning_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_enrollment_count();

CREATE OR REPLACE FUNCTION update_course_completion_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at IS DISTINCT FROM NEW.completed_at) THEN
    UPDATE learning_courses
    SET completion_count = completion_count + 1
    WHERE id = NEW.course_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_completion_count
  AFTER UPDATE ON learning_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_completion_count();




-- END MIGRATION: 20251207000013_interactive_learning.sql

-- BEGIN MIGRATION: 20251207000014_habit_tracker.sql

-- Habit Tracker System
-- Daily habit tracking, streaks, reminders, analytics, and integration with PE routines

-- Habit definitions
CREATE TABLE IF NOT EXISTS habit_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system/template habits
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('pe_routine', 'health', 'wellness', 'lifestyle', 'custom')),
  
  -- Tracking details
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),
  target_value INTEGER DEFAULT 1, -- e.g., 1 time per day, 3 times per week
  unit TEXT, -- e.g., 'times', 'minutes', 'sets', 'reps'
  
  -- Reminders
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_times TIME[], -- Array of reminder times
  reminder_days INTEGER[], -- Days of week (0=Sunday, 6=Saturday)
  
  -- Integration
  linked_routine_id UUID, -- Link to PE routine if applicable
  linked_feature TEXT, -- Link to app feature (e.g., 'scanner', 'diary')
  
  -- Organization
  color TEXT,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false, -- System templates vs user-created
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User habits (instances of habit definitions)
CREATE TABLE IF NOT EXISTS user_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_definition_id UUID NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
  
  -- Personalization
  custom_name TEXT, -- Override definition name
  custom_target_value INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  
  -- Statistics
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, habit_definition_id)
);

-- Habit entries (daily/weekly completions)
CREATE TABLE IF NOT EXISTS habit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_habit_id UUID NOT NULL REFERENCES user_habits(id) ON DELETE CASCADE,
  
  entry_date DATE NOT NULL,
  completed_value INTEGER DEFAULT 1, -- Actual value completed
  target_value INTEGER, -- Target for this entry
  
  -- Metadata
  notes TEXT,
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'difficult', 'skipped')),
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
  
  -- Time tracking
  duration_minutes INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_habit_id, entry_date)
);

-- Habit streaks
CREATE TABLE IF NOT EXISTS habit_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_habit_id UUID NOT NULL REFERENCES user_habits(id) ON DELETE CASCADE,
  
  streak_start_date DATE NOT NULL,
  streak_end_date DATE,
  streak_length INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit templates (system-provided)
CREATE TABLE IF NOT EXISTS habit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  frequency TEXT,
  target_value INTEGER DEFAULT 1,
  unit TEXT,
  
  icon TEXT,
  color TEXT,
  
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit analytics (aggregated data)
CREATE TABLE IF NOT EXISTS habit_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_habit_id UUID NOT NULL REFERENCES user_habits(id) ON DELETE CASCADE,
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT CHECK (period_type IN ('week', 'month', 'year')),
  
  total_entries INTEGER DEFAULT 0,
  completed_entries INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  average_value DECIMAL(10,2) DEFAULT 0,
  
  longest_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_habit_definitions_user ON habit_definitions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habit_definitions_template ON habit_definitions(is_template, is_active);
CREATE INDEX IF NOT EXISTS idx_user_habits_user ON user_habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user_habit ON habit_entries(user_habit_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_entries_date ON habit_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_habit_streaks_user_habit ON habit_streaks(user_habit_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habit_analytics_user_habit ON habit_analytics(user_habit_id, period_start DESC);

-- RLS Policies
ALTER TABLE habit_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_analytics ENABLE ROW LEVEL SECURITY;

-- Habit definitions policies
CREATE POLICY "Users can view their own habits and templates"
  ON habit_definitions FOR SELECT
  USING (user_id = auth.uid() OR is_template = true OR user_id IS NULL);

CREATE POLICY "Users can create their own habits"
  ON habit_definitions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own habits"
  ON habit_definitions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON habit_definitions FOR DELETE
  USING (auth.uid() = user_id);

-- User habits policies
CREATE POLICY "Users can manage their own user habits"
  ON user_habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Habit entries policies
CREATE POLICY "Users can manage their own habit entries"
  ON habit_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_habits
      WHERE id = habit_entries.user_habit_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_habits
      WHERE id = habit_entries.user_habit_id AND user_id = auth.uid()
    )
  );

-- Habit streaks policies
CREATE POLICY "Users can view their own streaks"
  ON habit_streaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_habits
      WHERE id = habit_streaks.user_habit_id AND user_id = auth.uid()
    )
  );

-- Habit templates policies (public read)
CREATE POLICY "Anyone can view habit templates"
  ON habit_templates FOR SELECT
  USING (true);

-- Habit analytics policies
CREATE POLICY "Users can view their own analytics"
  ON habit_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_habits
      WHERE id = habit_analytics.user_habit_id AND user_id = auth.uid()
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_habit_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_user_habit_id UUID;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  v_user_habit_id := NEW.user_habit_id;
  
  -- Calculate current streak
  SELECT COUNT(*)::INTEGER INTO v_current_streak
  FROM habit_entries
  WHERE user_habit_id = v_user_habit_id
    AND entry_date >= CURRENT_DATE - INTERVAL '30 days'
    AND entry_date <= CURRENT_DATE
  ORDER BY entry_date DESC;
  
  -- Get longest streak
  SELECT MAX(streak_length) INTO v_longest_streak
  FROM habit_streaks
  WHERE user_habit_id = v_user_habit_id;
  
  -- Update user habit stats
  UPDATE user_habits
  SET 
    current_streak = v_current_streak,
    longest_streak = GREATEST(COALESCE(longest_streak, 0), COALESCE(v_longest_streak, 0)),
    total_completions = total_completions + 1,
    updated_at = NOW()
  WHERE id = v_user_habit_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_habit_streak
  AFTER INSERT ON habit_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_streak();

CREATE OR REPLACE FUNCTION calculate_habit_completion_rate(user_habit_id UUID, days_back INTEGER DEFAULT 30)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_days INTEGER;
  completed_days INTEGER;
BEGIN
  total_days := days_back;
  
  SELECT COUNT(*)::INTEGER INTO completed_days
  FROM habit_entries
  WHERE habit_entries.user_habit_id = calculate_habit_completion_rate.user_habit_id
    AND entry_date >= CURRENT_DATE - (days_back || ' days')::INTERVAL;
  
  IF total_days = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (completed_days::DECIMAL / total_days::DECIMAL) * 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




-- END MIGRATION: 20251207000014_habit_tracker.sql

-- BEGIN MIGRATION: 20251207000015_in_app_messaging.sql

-- Migration: In-App Messaging System
-- Creates tables for direct messaging, support tickets, expert consultations, and group chats

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'feature_request', 'bug_report', 'account', 'general', 'premium_support')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  
  assigned_to UUID REFERENCES auth.users(id), -- Support staff
  assigned_at TIMESTAMPTZ,
  
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  -- User feedback
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback_text TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Ticket Messages (conversation thread)
CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for system messages
  is_staff BOOLEAN DEFAULT false,
  
  content TEXT NOT NULL,
  attachments JSONB, -- Array of file URLs/metadata
  
  is_internal BOOLEAN DEFAULT false, -- Internal notes visible only to staff
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Consultation Bookings
CREATE TABLE IF NOT EXISTS expert_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('video_call', 'voice_call', 'text_chat', 'email')),
  topic TEXT NOT NULL,
  description TEXT,
  
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Payment
  price DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_intent_id TEXT,
  
  -- Session details
  meeting_link TEXT, -- Video call URL
  meeting_id TEXT, -- Meeting room ID
  notes TEXT, -- Post-consultation notes
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Chats (Support Groups)
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('support', 'health_condition', 'treatment', 'recovery', 'general', 'premium')),
  
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  member_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  
  avatar_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Chat Members
CREATE TABLE IF NOT EXISTS group_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
  is_muted BOOLEAN DEFAULT false,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  UNIQUE(group_id, user_id)
);

-- Group Chat Messages
CREATE TABLE IF NOT EXISTS group_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  attachments JSONB, -- Array of file URLs/metadata
  
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  reply_to_message_id UUID REFERENCES group_chat_messages(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Reactions (for group chats)
CREATE TABLE IF NOT EXISTS group_chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES group_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- File Attachments (for messages)
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_type TEXT NOT NULL CHECK (message_type IN ('direct', 'group', 'ticket', 'consultation')),
  message_id UUID NOT NULL,
  
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER, -- bytes
  thumbnail_url TEXT,
  
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_user_id ON expert_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_expert_id ON expert_consultations(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_status ON expert_consultations(status);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_group_id ON group_chat_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_user_id ON group_chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_group_id ON group_chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_created_at ON group_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_recipient ON direct_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at);

-- RLS Policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Support Tickets: Users can view their own tickets, staff can view all
CREATE POLICY "Users can view own support tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'support_staff')
  ));

CREATE POLICY "Users can create own support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets, staff can update all"
  ON support_tickets FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'support_staff')
  ));

-- Support Ticket Messages: Users can view messages in their tickets, staff can view all
CREATE POLICY "Users can view messages in own tickets"
  ON support_ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets st 
      WHERE st.id = support_ticket_messages.ticket_id 
      AND (st.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'support_staff')
      ))
    )
  );

CREATE POLICY "Users can create messages in own tickets"
  ON support_ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets st 
      WHERE st.id = support_ticket_messages.ticket_id 
      AND (st.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'support_staff')
      ))
    )
  );

-- Expert Consultations: Users can view their own consultations
CREATE POLICY "Users can view own consultations"
  ON expert_consultations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = expert_id);

CREATE POLICY "Users can create consultations"
  ON expert_consultations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consultations"
  ON expert_consultations FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = expert_id);

-- Group Chats: Members can view their groups
CREATE POLICY "Members can view their groups"
  ON group_chats FOR SELECT
  USING (
    is_private = false OR EXISTS (
      SELECT 1 FROM group_chat_members gcm 
      WHERE gcm.group_id = group_chats.id 
      AND gcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON group_chats FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their groups"
  ON group_chats FOR UPDATE
  USING (
    auth.uid() = created_by OR EXISTS (
      SELECT 1 FROM group_chat_members gcm 
      WHERE gcm.group_id = group_chats.id 
      AND gcm.user_id = auth.uid() 
      AND gcm.role IN ('admin', 'moderator')
    )
  );

-- Group Chat Members: Members can view members of their groups
CREATE POLICY "Members can view group members"
  ON group_chat_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_chat_members gcm 
      WHERE gcm.group_id = group_chat_members.group_id 
      AND gcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join public groups or be added to private groups"
  ON group_chat_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM group_chats gc 
        WHERE gc.id = group_chat_members.group_id 
        AND gc.is_private = false
      )
    )
  );

-- Group Chat Messages: Members can view and send messages
CREATE POLICY "Members can view group messages"
  ON group_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_chat_members gcm 
      WHERE gcm.group_id = group_chat_messages.group_id 
      AND gcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send group messages"
  ON group_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM group_chat_members gcm 
      WHERE gcm.group_id = group_chat_messages.group_id 
      AND gcm.user_id = auth.uid()
      AND gcm.is_muted = false
    )
  );

CREATE POLICY "Users can update own messages"
  ON group_chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Message Reactions: Members can react
CREATE POLICY "Members can view reactions"
  ON group_chat_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_chat_messages gcm 
      JOIN group_chat_members gcm2 ON gcm2.group_id = gcm.group_id
      WHERE gcm.id = group_chat_message_reactions.message_id 
      AND gcm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add reactions"
  ON group_chat_message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM group_chat_messages gcm 
      JOIN group_chat_members gcm2 ON gcm2.group_id = gcm.group_id
      WHERE gcm.id = group_chat_message_reactions.message_id 
      AND gcm2.user_id = auth.uid()
    )
  );

-- Message Attachments: Users can view attachments in their messages
CREATE POLICY "Users can view message attachments"
  ON message_attachments FOR SELECT
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can upload attachments"
  ON message_attachments FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);



-- END MIGRATION: 20251207000015_in_app_messaging.sql

-- BEGIN MIGRATION: 20251207000016_live_support_chat.sql

-- Migration: Live Support Chat System
-- Creates tables for real-time support chat with AI-powered responses

-- Support Chat Sessions
CREATE TABLE IF NOT EXISTS support_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'waiting', 'assigned', 'resolved', 'closed')),
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id), -- Support staff
  assigned_at TIMESTAMPTZ,
  
  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_premium_user BOOLEAN DEFAULT false, -- Premium users get priority
  
  -- AI handling
  ai_handled BOOLEAN DEFAULT true, -- Initially handled by AI
  escalated_to_human BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolution_summary TEXT,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback_text TEXT,
  
  -- Metadata
  user_agent TEXT,
  ip_address TEXT,
  language TEXT DEFAULT 'en',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

-- Support Chat Messages
CREATE TABLE IF NOT EXISTS support_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES support_chat_sessions(id) ON DELETE CASCADE,
  
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai', 'staff')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for AI messages
  
  content TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  ai_model TEXT, -- Which AI model generated this (e.g., 'gemini-2.5-flash')
  ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00
  
  -- Quick actions/buttons
  quick_actions JSONB, -- Array of action buttons
  
  -- Attachments
  attachments JSONB, -- Array of file URLs/metadata
  
  -- Message metadata
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- For AI messages
  suggested_escalation BOOLEAN DEFAULT false, -- AI suggests escalating to human
  suggested_escalation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Chat Quick Responses (Templates)
CREATE TABLE IF NOT EXISTS support_chat_quick_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('greeting', 'technical', 'billing', 'account', 'feature', 'general')),
  
  is_ai_enabled BOOLEAN DEFAULT true, -- Can AI use this response?
  is_staff_only BOOLEAN DEFAULT false, -- Only staff can use this
  
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3, 2), -- Resolution rate when this response is used
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Chat AI Training Data (for improving responses)
CREATE TABLE IF NOT EXISTS support_chat_ai_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES support_chat_sessions(id) ON DELETE CASCADE,
  
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  was_helpful BOOLEAN, -- User feedback
  was_escalated BOOLEAN DEFAULT false, -- Was escalated after this response
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Staff Availability
CREATE TABLE IF NOT EXISTS support_staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  is_available BOOLEAN DEFAULT true,
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chat_count INTEGER DEFAULT 0,
  
  -- Working hours
  timezone TEXT DEFAULT 'UTC',
  working_hours JSONB, -- { "monday": { "start": "09:00", "end": "17:00" }, ... }
  
  -- Status
  status_message TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_user_id ON support_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_status ON support_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_assigned_to ON support_chat_sessions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_priority ON support_chat_sessions(priority);
CREATE INDEX IF NOT EXISTS idx_support_chat_messages_session_id ON support_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_messages_created_at ON support_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_support_staff_availability_staff_id ON support_staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_support_staff_availability_is_available ON support_staff_availability(is_available);

-- RLS Policies
ALTER TABLE support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_quick_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_ai_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_staff_availability ENABLE ROW LEVEL SECURITY;

-- Support Chat Sessions: Users can view their own sessions, staff can view all
CREATE POLICY "Users can view own chat sessions"
  ON support_chat_sessions FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'support_staff')
    )
  );

CREATE POLICY "Users can create chat sessions"
  ON support_chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and staff can update sessions"
  ON support_chat_sessions FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'support_staff')
    )
  );

-- Support Chat Messages: Users can view messages in their sessions
CREATE POLICY "Users can view messages in own sessions"
  ON support_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_chat_sessions scs 
      WHERE scs.id = support_chat_messages.session_id 
      AND (
        scs.user_id = auth.uid() OR 
        scs.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role IN ('admin', 'support_staff')
        )
      )
    )
  );

CREATE POLICY "Users can send messages in own sessions"
  ON support_chat_messages FOR INSERT
  WITH CHECK (
    sender_type = 'user' AND
    EXISTS (
      SELECT 1 FROM support_chat_sessions scs 
      WHERE scs.id = support_chat_messages.session_id 
      AND scs.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can send messages in assigned sessions"
  ON support_chat_messages FOR INSERT
  WITH CHECK (
    sender_type = 'staff' AND
    EXISTS (
      SELECT 1 FROM support_chat_sessions scs 
      WHERE scs.id = support_chat_messages.session_id 
      AND (
        scs.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role IN ('admin', 'support_staff')
        )
      )
    )
  );

-- Quick Responses: Staff can view and manage
CREATE POLICY "Staff can view quick responses"
  ON support_chat_quick_responses FOR SELECT
  USING (
    is_staff_only = false OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'support_staff')
    )
  );

CREATE POLICY "Staff can manage quick responses"
  ON support_chat_quick_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'support_staff')
    )
  );

-- AI Training Data: Staff can view
CREATE POLICY "Staff can view AI training data"
  ON support_chat_ai_training FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'support_staff')
    )
  );

-- Staff Availability: Staff can manage their own
CREATE POLICY "Staff can manage own availability"
  ON support_staff_availability FOR ALL
  USING (auth.uid() = staff_id);

CREATE POLICY "Admins can view all availability"
  ON support_staff_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );



-- END MIGRATION: 20251207000016_live_support_chat.sql

-- BEGIN MIGRATION: 20251207000017_advanced_scanner_features.sql

-- Migration: Advanced Scanner Features
-- Creates tables for multi-angle 3D reconstruction, time-lapse comparison, measurement templates, and batch scanning

-- Multi-Angle Scan Sessions (for 3D reconstruction)
CREATE TABLE IF NOT EXISTS multi_angle_scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  session_name TEXT,
  scan_type TEXT DEFAULT '3d_reconstruction' CHECK (scan_type IN ('3d_reconstruction', 'time_lapse', 'batch_scan')),
  
  -- 3D Reconstruction settings
  target_angles INTEGER DEFAULT 8, -- Number of angles to capture
  angles_captured INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT false,
  
  -- Processing
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  
  -- Results
  reconstructed_3d_model_url TEXT, -- URL to 3D model file
  model_format TEXT CHECK (model_format IN ('obj', 'stl', 'ply', 'gltf')),
  point_cloud_url TEXT,
  texture_map_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-Angle Scan Images (individual angle captures)
CREATE TABLE IF NOT EXISTS multi_angle_scan_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES multi_angle_scan_sessions(id) ON DELETE CASCADE,
  
  angle_index INTEGER NOT NULL, -- 0-7 for 8 angles, etc.
  angle_degrees INTEGER, -- Actual angle in degrees (0, 45, 90, 135, etc.)
  
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  
  -- Camera metadata
  camera_position JSONB, -- {x, y, z} relative position
  camera_rotation JSONB, -- {pitch, yaw, roll}
  focal_length DECIMAL(10, 2),
  
  -- Quality metrics
  lighting_quality DECIMAL(3, 2), -- 0.00 to 1.00
  sharpness_score DECIMAL(3, 2),
  contrast_score DECIMAL(3, 2),
  
  -- Measurements from this angle
  measurements JSONB, -- {length, circumference, etc.}
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time-Lapse Comparisons
CREATE TABLE IF NOT EXISTS time_lapse_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  comparison_name TEXT,
  start_scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  end_scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  
  -- Comparison metrics
  length_change DECIMAL(10, 2), -- cm
  circumference_change DECIMAL(10, 2), -- cm
  curvature_change DECIMAL(10, 2), -- degrees
  time_period_days INTEGER,
  
  -- Visualization
  comparison_image_url TEXT, -- Side-by-side or overlay image
  overlay_image_url TEXT, -- Transparent overlay comparison
  slider_image_url TEXT, -- Before/after slider image
  animated_gif_url TEXT, -- Animated transition
  
  -- Growth metrics
  growth_rate_per_month DECIMAL(10, 2),
  growth_percentage DECIMAL(5, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Measurement Templates (saved measurement configurations)
CREATE TABLE IF NOT EXISTS measurement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  template_name TEXT NOT NULL,
  description TEXT,
  
  -- Template configuration
  measurement_points JSONB NOT NULL, -- Array of measurement point definitions
  reference_object_size DECIMAL(10, 2), -- Size of reference object in cm
  calibration_data JSONB,
  
  -- Settings
  auto_capture_enabled BOOLEAN DEFAULT false,
  quality_threshold DECIMAL(3, 2) DEFAULT 0.7,
  angle_requirements JSONB, -- Required angles for this template
  
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false, -- Can be shared with other users
  
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch Scan Sessions (multiple scans in one session)
CREATE TABLE IF NOT EXISTS batch_scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  session_name TEXT,
  batch_type TEXT CHECK (batch_type IN ('daily', 'weekly', 'custom', 'routine')),
  
  target_count INTEGER, -- Number of scans to capture
  scans_captured INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT false,
  
  -- Scheduling
  scheduled_start_time TIMESTAMPTZ,
  scheduled_end_time TIMESTAMPTZ,
  interval_minutes INTEGER, -- Time between scans
  
  -- Results
  average_measurements JSONB, -- Average across all scans
  measurement_variance JSONB, -- Variance in measurements
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batch Scan Entries (individual scans in a batch)
CREATE TABLE IF NOT EXISTS batch_scan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_session_id UUID NOT NULL REFERENCES batch_scan_sessions(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  
  entry_index INTEGER NOT NULL, -- Order in batch
  captured_at TIMESTAMPTZ NOT NULL,
  
  -- Quick measurements (may differ from full scan)
  quick_length DECIMAL(10, 2),
  quick_circumference DECIMAL(10, 2),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cloud Processing Jobs (for heavy processing tasks)
CREATE TABLE IF NOT EXISTS cloud_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  job_type TEXT NOT NULL CHECK (job_type IN ('3d_reconstruction', 'ml_analysis', 'batch_processing', 'export_3d_model')),
  related_session_id UUID, -- References multi_angle_scan_sessions or batch_scan_sessions
  
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5, -- 1-10, higher = more priority
  
  -- Input data
  input_data JSONB NOT NULL, -- Job-specific input parameters
  
  -- Results
  result_data JSONB,
  result_urls JSONB, -- Array of result file URLs
  error_message TEXT,
  
  -- Processing metadata
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_duration_seconds INTEGER,
  processing_cost DECIMAL(10, 4), -- Cost in credits or currency
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3D Model Exports
CREATE TABLE IF NOT EXISTS exported_3d_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES multi_angle_scan_sessions(id) ON DELETE SET NULL,
  
  export_format TEXT NOT NULL CHECK (export_format IN ('obj', 'stl', 'ply', 'gltf', 'fbx')),
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  
  -- Export settings
  include_texture BOOLEAN DEFAULT true,
  include_measurements BOOLEAN DEFAULT true,
  quality_level TEXT DEFAULT 'high' CHECK (quality_level IN ('low', 'medium', 'high', 'ultra')),
  
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_multi_angle_sessions_user_id ON multi_angle_scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_angle_sessions_status ON multi_angle_scan_sessions(processing_status);
CREATE INDEX IF NOT EXISTS idx_multi_angle_images_session_id ON multi_angle_scan_images(session_id);
CREATE INDEX IF NOT EXISTS idx_time_lapse_user_id ON time_lapse_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_measurement_templates_user_id ON measurement_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_scan_sessions_user_id ON batch_scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_processing_jobs_user_id ON cloud_processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_processing_jobs_status ON cloud_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_exported_3d_models_user_id ON exported_3d_models(user_id);

-- RLS Policies
ALTER TABLE multi_angle_scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_angle_scan_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_lapse_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_scan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exported_3d_models ENABLE ROW LEVEL SECURITY;

-- Multi-Angle Sessions: Users can view their own
CREATE POLICY "Users can view own multi-angle sessions"
  ON multi_angle_scan_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own multi-angle sessions"
  ON multi_angle_scan_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own multi-angle sessions"
  ON multi_angle_scan_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Multi-Angle Images: Users can view images in their sessions
CREATE POLICY "Users can view images in own sessions"
  ON multi_angle_scan_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multi_angle_scan_sessions mas 
      WHERE mas.id = multi_angle_scan_images.session_id 
      AND mas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create images in own sessions"
  ON multi_angle_scan_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM multi_angle_scan_sessions mas 
      WHERE mas.id = multi_angle_scan_images.session_id 
      AND mas.user_id = auth.uid()
    )
  );

-- Time-Lapse Comparisons: Users can view their own
CREATE POLICY "Users can manage own time-lapse comparisons"
  ON time_lapse_comparisons FOR ALL
  USING (auth.uid() = user_id);

-- Measurement Templates: Users can view their own and shared templates
CREATE POLICY "Users can view own and shared templates"
  ON measurement_templates FOR SELECT
  USING (auth.uid() = user_id OR is_shared = true);

CREATE POLICY "Users can manage own templates"
  ON measurement_templates FOR ALL
  USING (auth.uid() = user_id);

-- Batch Scan Sessions: Users can manage their own
CREATE POLICY "Users can manage own batch sessions"
  ON batch_scan_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Batch Scan Entries: Users can view entries in their sessions
CREATE POLICY "Users can view entries in own batch sessions"
  ON batch_scan_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM batch_scan_sessions bss 
      WHERE bss.id = batch_scan_entries.batch_session_id 
      AND bss.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create entries in own batch sessions"
  ON batch_scan_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM batch_scan_sessions bss 
      WHERE bss.id = batch_scan_entries.batch_session_id 
      AND bss.user_id = auth.uid()
    )
  );

-- Cloud Processing Jobs: Users can view their own
CREATE POLICY "Users can manage own processing jobs"
  ON cloud_processing_jobs FOR ALL
  USING (auth.uid() = user_id);

-- Exported 3D Models: Users can view their own
CREATE POLICY "Users can manage own 3D model exports"
  ON exported_3d_models FOR ALL
  USING (auth.uid() = user_id);



-- END MIGRATION: 20251207000017_advanced_scanner_features.sql

-- BEGIN MIGRATION: 20251207000018_ai_enhanced_scanning.sql

-- Migration: AI-Enhanced Scanning
-- Creates tables for real-time health condition detection, automatic measurement suggestions, quality assessment, and anomaly detection

-- AI Scan Analysis Results
CREATE TABLE IF NOT EXISTS ai_scan_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Analysis type
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('health_detection', 'measurement_suggestion', 'quality_assessment', 'anomaly_detection', 'comparison', 'trend_visualization')),
  
  -- Health condition detection
  detected_conditions JSONB, -- Array of {condition: string, confidence: decimal, severity: string, recommendation: string}
  risk_factors JSONB, -- Array of identified risk factors
  health_alerts JSONB, -- Array of alerts/warnings
  
  -- Measurement suggestions
  suggested_measurements JSONB, -- {length: decimal, circumference: decimal, etc.}
  measurement_confidence DECIMAL(3, 2), -- 0.00 to 1.00
  measurement_reasoning TEXT,
  
  -- Quality assessment
  overall_quality_score DECIMAL(3, 2), -- 0.00 to 1.00
  quality_breakdown JSONB, -- {lighting: decimal, focus: decimal, angle: decimal, etc.}
  quality_recommendations TEXT[],
  
  -- Anomaly detection
  anomalies_detected JSONB, -- Array of {type: string, location: string, severity: string, description: string}
  anomaly_confidence DECIMAL(3, 2),
  
  -- Comparison to previous scans
  previous_scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  comparison_results JSONB, -- {length_change: decimal, circumference_change: decimal, etc.}
  trend_direction TEXT CHECK (trend_direction IN ('improving', 'stable', 'declining', 'fluctuating')),
  
  -- Health trend visualization data
  trend_data JSONB, -- Data for visualization
  visualization_url TEXT, -- URL to generated visualization image
  
  -- AI model metadata
  ai_model_version TEXT,
  ai_model_confidence DECIMAL(3, 2),
  processing_time_ms INTEGER,
  
  -- Analysis metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-Time Scan Feedback (during active scanning)
CREATE TABLE IF NOT EXISTS real_time_scan_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  session_id TEXT, -- Temporary session identifier
  frame_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Real-time analysis
  frame_analysis JSONB, -- Quick analysis of current frame
  quality_score DECIMAL(3, 2),
  suggestions JSONB, -- Array of real-time suggestions
  warnings JSONB, -- Array of warnings (poor lighting, wrong angle, etc.)
  
  -- Detection results
  detected_objects JSONB, -- Detected objects in frame
  detected_conditions JSONB, -- Quick health condition checks
  
  -- Measurement preview
  preview_measurements JSONB, -- Estimated measurements from frame
  measurement_confidence DECIMAL(3, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automatic Measurement Suggestions (ML-based)
CREATE TABLE IF NOT EXISTS measurement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('angle_adjustment', 'distance_adjustment', 'lighting_improvement', 'focus_improvement', 'position_correction')),
  
  current_value DECIMAL(10, 2),
  suggested_value DECIMAL(10, 2),
  improvement_expected DECIMAL(3, 2), -- Expected improvement in accuracy (0.00 to 1.00)
  
  reasoning TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  is_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Assessment History
CREATE TABLE IF NOT EXISTS quality_assessment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  overall_score DECIMAL(3, 2) NOT NULL,
  
  -- Detailed scores
  lighting_score DECIMAL(3, 2),
  focus_score DECIMAL(3, 2),
  angle_score DECIMAL(3, 2),
  distance_score DECIMAL(3, 2),
  stability_score DECIMAL(3, 2),
  contrast_score DECIMAL(3, 2),
  
  -- Recommendations
  recommendations TEXT[],
  critical_issues TEXT[], -- Issues that must be addressed
  
  -- Comparison
  compared_to_average BOOLEAN DEFAULT false,
  average_score DECIMAL(3, 2), -- Average score for user's scans
  percentile_rank INTEGER, -- Percentile rank (0-100)
  
  assessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anomaly Detection Log
CREATE TABLE IF NOT EXISTS anomaly_detection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('measurement_outlier', 'shape_anomaly', 'color_anomaly', 'texture_anomaly', 'size_anomaly', 'position_anomaly')),
  
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  confidence DECIMAL(3, 2) NOT NULL,
  
  description TEXT NOT NULL,
  location JSONB, -- {x: decimal, y: decimal, region: string}
  affected_measurements TEXT[], -- Which measurements are affected
  
  -- Comparison context
  compared_to_previous BOOLEAN DEFAULT false,
  previous_scan_id UUID REFERENCES scans(id) ON DELETE SET NULL,
  deviation_amount DECIMAL(10, 2), -- How much it deviates
  
  -- Recommendations
  recommendation TEXT,
  requires_attention BOOLEAN DEFAULT false,
  
  -- Resolution
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Trend Visualizations (generated during scan)
CREATE TABLE IF NOT EXISTS health_trend_visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  visualization_type TEXT NOT NULL CHECK (visualization_type IN ('growth_trend', 'measurement_trend', 'health_score_trend', 'comparison_trend')),
  
  -- Data
  trend_data JSONB NOT NULL, -- Chart data
  time_period_days INTEGER,
  data_points JSONB, -- Array of data points
  
  -- Visualization
  chart_image_url TEXT, -- Generated chart image
  chart_config JSONB, -- Chart configuration (colors, labels, etc.)
  
  -- Insights
  insights TEXT[],
  predictions JSONB, -- Future trend predictions
  
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Model Performance Tracking
CREATE TABLE IF NOT EXISTS ai_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('health_detection', 'measurement', 'quality', 'anomaly')),
  
  -- Performance metrics
  accuracy DECIMAL(5, 4), -- 0.0000 to 1.0000
  precision DECIMAL(5, 4),
  recall DECIMAL(5, 4),
  f1_score DECIMAL(5, 4),
  
  -- Usage
  total_predictions INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  failed_predictions INTEGER DEFAULT 0,
  
  -- Feedback
  user_feedback_positive INTEGER DEFAULT 0,
  user_feedback_negative INTEGER DEFAULT 0,
  
  -- Timing
  average_processing_time_ms INTEGER,
  
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_scan_analysis_scan_id ON ai_scan_analysis(scan_id);
CREATE INDEX IF NOT EXISTS idx_ai_scan_analysis_user_id ON ai_scan_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_scan_analysis_type ON ai_scan_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_real_time_feedback_user_id ON real_time_scan_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_measurement_suggestions_scan_id ON measurement_suggestions(scan_id);
CREATE INDEX IF NOT EXISTS idx_quality_assessment_scan_id ON quality_assessment_history(scan_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_scan_id ON anomaly_detection_log(scan_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_severity ON anomaly_detection_log(severity);
CREATE INDEX IF NOT EXISTS idx_health_trend_viz_user_id ON health_trend_visualizations(user_id);

-- RLS Policies
ALTER TABLE ai_scan_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_scan_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_assessment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_detection_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_trend_visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;

-- AI Scan Analysis: Users can view their own
CREATE POLICY "Users can view own AI analysis"
  ON ai_scan_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI analysis"
  ON ai_scan_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Real-Time Feedback: Users can view their own
CREATE POLICY "Users can manage own real-time feedback"
  ON real_time_scan_feedback FOR ALL
  USING (auth.uid() = user_id);

-- Measurement Suggestions: Users can view their own
CREATE POLICY "Users can manage own measurement suggestions"
  ON measurement_suggestions FOR ALL
  USING (auth.uid() = user_id);

-- Quality Assessment: Users can view their own
CREATE POLICY "Users can view own quality assessments"
  ON quality_assessment_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create quality assessments"
  ON quality_assessment_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Anomaly Detection: Users can view their own
CREATE POLICY "Users can view own anomaly detections"
  ON anomaly_detection_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own anomaly detections"
  ON anomaly_detection_log FOR UPDATE
  USING (auth.uid() = user_id);

-- Health Trend Visualizations: Users can view their own
CREATE POLICY "Users can view own trend visualizations"
  ON health_trend_visualizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create trend visualizations"
  ON health_trend_visualizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- AI Model Performance: Read-only for all authenticated users
CREATE POLICY "Authenticated users can view model performance"
  ON ai_model_performance FOR SELECT
  USING (auth.role() = 'authenticated');



-- END MIGRATION: 20251207000018_ai_enhanced_scanning.sql

-- BEGIN MIGRATION: 20251207000019_advanced_reporting.sql

-- Migration: Advanced Reporting System
-- Creates tables for custom report builder, scheduled reports, report sharing, and advanced export formats

-- Custom Reports
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  report_name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('health_summary', 'detailed_analysis', 'comparison', 'trend', 'risk_assessment', 'custom')),
  
  -- Report configuration (drag-and-drop builder data)
  report_config JSONB NOT NULL, -- Layout, sections, widgets configuration
  selected_metrics TEXT[] NOT NULL, -- Which metrics to include
  date_range JSONB, -- {start_date, end_date, period_type}
  
  -- Visual customization
  theme TEXT DEFAULT 'default' CHECK (theme IN ('default', 'dark', 'light', 'medical', 'minimal')),
  color_scheme JSONB, -- Custom colors
  chart_types JSONB, -- Which chart types to use for each metric
  
  -- Sharing
  is_shared BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE, -- Token for sharing
  shared_with_users UUID[], -- Array of user IDs
  shared_with_doctors UUID[], -- Array of doctor/provider IDs
  
  -- Scheduling
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  schedule_day INTEGER, -- Day of week/month
  schedule_time TIME, -- Time of day
  next_scheduled_at TIMESTAMPTZ,
  last_generated_at TIMESTAMPTZ,
  
  -- Usage
  generation_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  is_favorite BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false, -- Can be used as template
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Reports (instances of custom reports)
CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_report_id UUID REFERENCES custom_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Generation metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generation_method TEXT DEFAULT 'manual' CHECK (generation_method IN ('manual', 'scheduled', 'triggered')),
  generation_trigger TEXT, -- What triggered this generation
  
  -- Report data
  report_data JSONB NOT NULL, -- Actual report data
  report_summary JSONB, -- Summary/executive summary
  
  -- Export formats
  pdf_url TEXT,
  excel_url TEXT,
  csv_url TEXT,
  json_url TEXT,
  hl7_fhir_url TEXT, -- HL7 FHIR format
  xml_url TEXT, -- CDA XML format
  
  -- File metadata
  file_sizes JSONB, -- {pdf: bytes, excel: bytes, etc.}
  
  -- Sharing
  is_shared BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  shared_with_users UUID[],
  shared_with_doctors UUID[],
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('generating', 'completed', 'failed', 'expired')),
  error_message TEXT,
  
  expires_at TIMESTAMPTZ, -- When report data expires (for privacy)
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Templates (pre-built report configurations)
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('health_summary', 'detailed', 'comparison', 'trend', 'risk', 'medical', 'fitness')),
  
  -- Template configuration
  template_config JSONB NOT NULL, -- Same structure as custom_reports.report_config
  default_metrics TEXT[],
  default_date_range JSONB,
  
  -- Preview
  preview_image_url TEXT,
  preview_description TEXT,
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Sharing Access Log
CREATE TABLE IF NOT EXISTS report_sharing_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES generated_reports(id) ON DELETE CASCADE,
  
  accessed_by_type TEXT NOT NULL CHECK (accessed_by_type IN ('user', 'doctor', 'anonymous')),
  accessed_by_id UUID, -- User ID or doctor ID
  access_token TEXT, -- Token used for access
  
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  duration_seconds INTEGER, -- How long they viewed the report
  pages_viewed INTEGER,
  exported BOOLEAN DEFAULT false,
  export_format TEXT
);

-- Comparative Analytics (comparison reports)
CREATE TABLE IF NOT EXISTS comparative_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  comparison_type TEXT NOT NULL CHECK (comparison_type IN ('time_period', 'user_group', 'population', 'goal', 'baseline')),
  
  -- Comparison data
  baseline_data JSONB NOT NULL,
  comparison_data JSONB NOT NULL,
  differences JSONB, -- Calculated differences
  percentage_changes JSONB,
  
  -- Context
  comparison_period JSONB, -- {baseline_start, baseline_end, comparison_start, comparison_end}
  comparison_group TEXT, -- If comparing to group
  
  -- Insights
  insights TEXT[],
  significant_changes JSONB, -- Statistically significant changes
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Predictive Modeling Results
CREATE TABLE IF NOT EXISTS predictive_modeling_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  model_type TEXT NOT NULL CHECK (model_type IN ('growth_prediction', 'health_risk', 'outcome_simulation', 'trend_forecast')),
  
  -- Input data
  input_data JSONB NOT NULL,
  prediction_horizon_days INTEGER, -- How far into future
  
  -- Predictions
  predictions JSONB NOT NULL, -- {date: prediction_value}
  confidence_intervals JSONB, -- Upper and lower bounds
  confidence_level DECIMAL(3, 2), -- 0.00 to 1.00
  
  -- Model metadata
  model_version TEXT,
  model_accuracy DECIMAL(5, 4),
  
  -- Scenarios
  scenarios JSONB, -- What-if scenarios
  recommendations TEXT[],
  
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Risk Scoring
CREATE TABLE IF NOT EXISTS health_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  risk_category TEXT NOT NULL CHECK (risk_category IN ('erectile_dysfunction', 'peyronies', 'prostate', 'testicular', 'general_sexual_health', 'overall')),
  
  overall_risk_score DECIMAL(5, 2), -- 0.00 to 100.00
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  
  -- Detailed breakdown
  risk_factors JSONB NOT NULL, -- Array of {factor: string, contribution: decimal, severity: string}
  contributing_metrics JSONB, -- Which metrics contribute to risk
  
  -- Comparison
  compared_to_population BOOLEAN DEFAULT false,
  population_percentile INTEGER, -- Percentile compared to population (0-100)
  
  -- Recommendations
  recommendations TEXT[],
  urgency_level TEXT CHECK (urgency_level IN ('routine', 'soon', 'urgent', 'immediate')),
  
  -- Timeline
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- When this risk assessment expires
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_reports_user_id ON custom_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_scheduled ON custom_reports(is_scheduled, next_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_generated_reports_user_id ON generated_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_custom_id ON generated_reports(custom_report_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_shared ON generated_reports(is_shared, share_token);
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);
CREATE INDEX IF NOT EXISTS idx_comparative_analytics_user_id ON comparative_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_predictive_modeling_user_id ON predictive_modeling_results(user_id);
CREATE INDEX IF NOT EXISTS idx_health_risk_scores_user_id ON health_risk_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_health_risk_scores_category ON health_risk_scores(risk_category);

-- RLS Policies
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sharing_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparative_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_modeling_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_risk_scores ENABLE ROW LEVEL SECURITY;

-- Custom Reports: Users can view their own
CREATE POLICY "Users can manage own custom reports"
  ON custom_reports FOR ALL
  USING (auth.uid() = user_id);

-- Generated Reports: Users can view their own and shared reports
CREATE POLICY "Users can view own and shared reports"
  ON generated_reports FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = ANY(shared_with_users) OR
    EXISTS (
      SELECT 1 FROM custom_reports cr 
      WHERE cr.id = generated_reports.custom_report_id 
      AND cr.is_shared = true
      AND (auth.uid() = ANY(cr.shared_with_users) OR auth.uid() = ANY(cr.shared_with_doctors))
    )
  );

CREATE POLICY "Users can create own generated reports"
  ON generated_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Report Templates: All authenticated users can view
CREATE POLICY "Authenticated users can view report templates"
  ON report_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- Report Sharing Access Log: Users can view logs for their reports
CREATE POLICY "Users can view access logs for own reports"
  ON report_sharing_access_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM generated_reports gr 
      WHERE gr.id = report_sharing_access_log.report_id 
      AND gr.user_id = auth.uid()
    )
  );

-- Comparative Analytics: Users can view their own
CREATE POLICY "Users can manage own comparative analytics"
  ON comparative_analytics FOR ALL
  USING (auth.uid() = user_id);

-- Predictive Modeling: Users can view their own
CREATE POLICY "Users can manage own predictive modeling"
  ON predictive_modeling_results FOR ALL
  USING (auth.uid() = user_id);

-- Health Risk Scores: Users can view their own
CREATE POLICY "Users can view own health risk scores"
  ON health_risk_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create health risk scores"
  ON health_risk_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);



-- END MIGRATION: 20251207000019_advanced_reporting.sql

-- BEGIN MIGRATION: 20251207000020_enhanced_diary_features.sql

-- Migration: Enhanced Diary Features
-- Creates tables for symptom tracking, medication tracking, mood tracking, energy levels, sleep, diet, exercise, photo diary, voice notes, and diary templates

-- Enhanced Diary Entries (extends basic diary)
CREATE TABLE IF NOT EXISTS enhanced_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_entry_id UUID REFERENCES diary_entries(id) ON DELETE CASCADE, -- Link to base diary entry if exists
  
  entry_date DATE NOT NULL,
  entry_time TIME,
  
  -- Symptom Tracking
  symptoms JSONB, -- Array of {symptom: string, severity: integer 1-10, location: string, duration: string, notes: string}
  symptom_count INTEGER DEFAULT 0,
  
  -- Medication Tracking
  medications JSONB, -- Array of {medication: string, dosage: string, time_taken: TIME, notes: string}
  medication_count INTEGER DEFAULT 0,
  
  -- Mood Tracking
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  mood_label TEXT CHECK (mood_label IN ('excellent', 'good', 'okay', 'poor', 'terrible')),
  mood_notes TEXT,
  mood_tags TEXT[], -- ['energetic', 'calm', 'anxious', etc.]
  
  -- Energy Level
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  energy_notes TEXT,
  
  -- Sleep Tracking
  sleep_hours DECIMAL(4, 2), -- Hours of sleep
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  sleep_start_time TIME,
  sleep_end_time TIME,
  sleep_notes TEXT,
  sleep_interruptions INTEGER DEFAULT 0,
  
  -- Diet Tracking
  meals JSONB, -- Array of {meal_type: string, foods: string[], calories: integer, notes: string}
  total_calories INTEGER,
  water_intake_ml INTEGER,
  diet_notes TEXT,
  
  -- Exercise Logging (beyond PE)
  exercises JSONB, -- Array of {exercise: string, duration_minutes: integer, intensity: string, calories_burned: integer, notes: string}
  total_exercise_minutes INTEGER,
  exercise_notes TEXT,
  
  -- Photo Diary
  photos JSONB, -- Array of {url: string, caption: string, taken_at: TIMESTAMPTZ}
  photo_count INTEGER DEFAULT 0,
  
  -- Voice Notes
  voice_notes JSONB, -- Array of {url: string, duration_seconds: integer, transcript: TEXT, created_at: TIMESTAMPTZ}
  voice_note_count INTEGER DEFAULT 0,
  
  -- General Notes
  notes TEXT,
  tags TEXT[],
  
  -- Weather/Environment (optional context)
  weather TEXT,
  temperature_celsius DECIMAL(5, 2),
  location TEXT,
  
  -- Privacy
  is_private BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, entry_date)
);

-- Diary Templates
CREATE TABLE IF NOT EXISTS diary_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system templates
  
  template_name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('daily', 'weekly', 'health_focus', 'symptom_tracking', 'medication', 'exercise', 'custom')),
  
  -- Template configuration
  template_config JSONB NOT NULL, -- Which fields to include, default values, etc.
  required_fields TEXT[],
  optional_fields TEXT[],
  
  -- Default values
  default_values JSONB, -- Default values for fields
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diary Search Index (for full-text search)
CREATE TABLE IF NOT EXISTS diary_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES enhanced_diary_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Searchable content
  searchable_text TEXT NOT NULL, -- Combined text from all fields for search
  keywords TEXT[], -- Extracted keywords
  
  -- Metadata for search
  entry_date DATE NOT NULL,
  tags TEXT[],
  categories TEXT[], -- Auto-categorized
  
  -- Full-text search vector (for PostgreSQL full-text search)
  search_vector tsvector,
  
  indexed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diary Analytics (aggregated insights)
CREATE TABLE IF NOT EXISTS diary_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  
  -- Aggregated metrics
  total_entries INTEGER DEFAULT 0,
  entries_with_symptoms INTEGER DEFAULT 0,
  entries_with_medications INTEGER DEFAULT 0,
  entries_with_photos INTEGER DEFAULT 0,
  entries_with_voice_notes INTEGER DEFAULT 0,
  
  -- Averages
  average_mood_score DECIMAL(4, 2),
  average_energy_level DECIMAL(4, 2),
  average_sleep_hours DECIMAL(4, 2),
  average_sleep_quality DECIMAL(4, 2),
  
  -- Totals
  total_calories INTEGER,
  total_water_intake_ml INTEGER,
  total_exercise_minutes INTEGER,
  
  -- Patterns
  most_common_symptoms JSONB, -- Array of {symptom: string, frequency: integer}
  most_common_moods TEXT[],
  activity_patterns JSONB,
  
  -- Trends
  mood_trend TEXT CHECK (mood_trend IN ('improving', 'stable', 'declining', 'fluctuating')),
  energy_trend TEXT,
  sleep_trend TEXT,
  
  -- Insights
  insights TEXT[],
  recommendations TEXT[],
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Symptom Patterns (identified patterns in symptoms)
CREATE TABLE IF NOT EXISTS symptom_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  pattern_name TEXT NOT NULL,
  pattern_type TEXT CHECK (pattern_type IN ('temporal', 'correlation', 'trigger', 'severity')),
  
  -- Pattern data
  symptoms_involved TEXT[] NOT NULL,
  pattern_description TEXT,
  frequency TEXT, -- How often this pattern occurs
  confidence DECIMAL(3, 2), -- 0.00 to 1.00
  
  -- Correlations
  correlated_factors JSONB, -- {factor: string, correlation_strength: decimal}
  
  -- Recommendations
  recommendations TEXT[],
  
  identified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medication Schedule
CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'daily', 'twice_daily', 'as_needed', etc.
  
  -- Schedule
  times_per_day INTEGER,
  specific_times TIME[], -- Array of specific times
  days_of_week INTEGER[], -- 0-6 (Sunday-Saturday)
  
  -- Duration
  start_date DATE,
  end_date DATE, -- NULL for ongoing
  is_active BOOLEAN DEFAULT true,
  
  -- Reminders
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_minutes_before INTEGER DEFAULT 15,
  
  -- Tracking
  total_doses INTEGER DEFAULT 0,
  missed_doses INTEGER DEFAULT 0,
  adherence_percentage DECIMAL(5, 2),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medication Log (actual medication taken)
CREATE TABLE IF NOT EXISTS medication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES medication_schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL,
  scheduled_time TIME,
  
  was_on_time BOOLEAN, -- Taken at scheduled time
  was_missed BOOLEAN DEFAULT false,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_diary_user_date ON enhanced_diary_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_enhanced_diary_user_id ON enhanced_diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_templates_user_id ON diary_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_search_index_user_id ON diary_search_index(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_search_index_entry_id ON diary_search_index(entry_id);
CREATE INDEX IF NOT EXISTS idx_diary_search_index_vector ON diary_search_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_diary_analytics_user_id ON diary_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_patterns_user_id ON symptom_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_user_id ON medication_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_active ON medication_schedules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_medication_log_user_id ON medication_log(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_log_taken_at ON medication_log(taken_at);

-- RLS Policies
ALTER TABLE enhanced_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_log ENABLE ROW LEVEL SECURITY;

-- Enhanced Diary Entries: Users can view their own
CREATE POLICY "Users can manage own enhanced diary entries"
  ON enhanced_diary_entries FOR ALL
  USING (auth.uid() = user_id);

-- Diary Templates: Users can view their own and shared/system templates
CREATE POLICY "Users can view own and shared templates"
  ON diary_templates FOR SELECT
  USING (auth.uid() = user_id OR is_shared = true OR user_id IS NULL);

CREATE POLICY "Users can manage own templates"
  ON diary_templates FOR ALL
  USING (auth.uid() = user_id);

-- Diary Search Index: Users can view their own
CREATE POLICY "Users can view own search index"
  ON diary_search_index FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage search index"
  ON diary_search_index FOR ALL
  USING (auth.uid() = user_id);

-- Diary Analytics: Users can view their own
CREATE POLICY "Users can view own diary analytics"
  ON diary_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create diary analytics"
  ON diary_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Symptom Patterns: Users can view their own
CREATE POLICY "Users can view own symptom patterns"
  ON symptom_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create symptom patterns"
  ON symptom_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Medication Schedules: Users can manage their own
CREATE POLICY "Users can manage own medication schedules"
  ON medication_schedules FOR ALL
  USING (auth.uid() = user_id);

-- Medication Log: Users can view their own
CREATE POLICY "Users can manage own medication log"
  ON medication_log FOR ALL
  USING (auth.uid() = user_id);



-- END MIGRATION: 20251207000020_enhanced_diary_features.sql

-- BEGIN MIGRATION: 20251207000021_advanced_routine_features.sql

-- Migration: Advanced Routine Features
-- Creates tables for routine templates library, adaptive routines, routine sharing, marketplace, video-guided routines, analytics, and multi-week programs

-- Routine Templates Library
CREATE TABLE IF NOT EXISTS routine_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('beginner', 'intermediate', 'advanced', 'recovery', 'maintenance', 'intensive', 'custom')),
  
  -- Template configuration
  exercises JSONB NOT NULL, -- Array of exercise definitions
  duration_weeks INTEGER,
  sessions_per_week INTEGER,
  estimated_time_per_session_minutes INTEGER,
  
  -- Difficulty
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
  intensity_level TEXT CHECK (intensity_level IN ('low', 'moderate', 'high', 'very_high')),
  
  -- Goals
  target_goals TEXT[], -- ['length', 'girth', 'curvature', 'endurance', etc.]
  expected_outcomes TEXT,
  
  -- Video guidance
  has_video_guidance BOOLEAN DEFAULT false,
  video_urls JSONB, -- Array of video URLs for exercises
  
  -- Requirements
  equipment_required TEXT[],
  experience_required TEXT,
  time_commitment TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id), -- NULL for system templates
  is_system_template BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false, -- Verified by experts
  
  -- Usage statistics
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 4), -- 0.0000 to 1.0000
  average_rating DECIMAL(3, 2), -- 1.00 to 5.00
  rating_count INTEGER DEFAULT 0,
  
  -- Reviews
  review_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Template Reviews
CREATE TABLE IF NOT EXISTS routine_template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES routine_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  pros TEXT[],
  cons TEXT[],
  
  -- Experience
  completed_routine BOOLEAN DEFAULT false,
  weeks_completed INTEGER,
  results_achieved TEXT,
  
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(template_id, user_id)
);

-- Adaptive Routines (AI-powered personalized routines)
CREATE TABLE IF NOT EXISTS adaptive_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_template_id UUID REFERENCES routine_templates(id),
  
  routine_name TEXT NOT NULL,
  
  -- Adaptation data
  adaptation_reason TEXT, -- Why this routine was adapted
  user_profile JSONB NOT NULL, -- User's current state, goals, history
  adaptation_history JSONB, -- History of adaptations made
  
  -- Current routine
  current_exercises JSONB NOT NULL,
  current_schedule JSONB NOT NULL,
  difficulty_adjustment DECIMAL(3, 2), -- Multiplier for difficulty (0.5 to 2.0)
  
  -- AI metadata
  ai_model_version TEXT,
  adaptation_confidence DECIMAL(3, 2),
  last_adapted_at TIMESTAMPTZ,
  adaptation_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  start_date DATE,
  target_end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Sharing
CREATE TABLE IF NOT EXISTS shared_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID, -- References user's routine (could be from routines table)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  share_name TEXT NOT NULL,
  description TEXT,
  
  -- Sharing settings
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  shared_with_users UUID[],
  
  -- Routine data (snapshot)
  routine_data JSONB NOT NULL, -- Full routine configuration
  
  -- Statistics
  view_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Marketplace (premium routines for sale)
CREATE TABLE IF NOT EXISTS routine_marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES routine_templates(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_subscription BOOLEAN DEFAULT false, -- Recurring payment
  subscription_duration_days INTEGER, -- If subscription
  
  -- Marketplace metadata
  marketplace_category TEXT,
  tags TEXT[],
  featured_image_url TEXT,
  preview_video_url TEXT,
  
  -- Sales
  sales_count INTEGER DEFAULT 0,
  revenue_total DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Purchases
CREATE TABLE IF NOT EXISTS routine_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID NOT NULL REFERENCES routine_marketplace(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  purchase_type TEXT DEFAULT 'one_time' CHECK (purchase_type IN ('one_time', 'subscription')),
  price_paid DECIMAL(10, 2) NOT NULL,
  payment_intent_id TEXT,
  
  -- Access
  access_granted_at TIMESTAMPTZ DEFAULT NOW(),
  access_expires_at TIMESTAMPTZ, -- NULL for lifetime access
  is_active BOOLEAN DEFAULT true,
  
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video-Guided Routine Sessions
CREATE TABLE IF NOT EXISTS video_guided_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID, -- References adaptive_routines or user routines
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  session_date DATE NOT NULL,
  session_type TEXT, -- 'warmup', 'exercise', 'cooldown', 'full'
  
  -- Video
  video_url TEXT NOT NULL,
  video_duration_seconds INTEGER,
  video_thumbnail_url TEXT,
  
  -- Progress tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  watched_duration_seconds INTEGER,
  completion_percentage DECIMAL(5, 2),
  
  -- Interaction
  paused_count INTEGER DEFAULT 0,
  rewind_count INTEGER DEFAULT 0,
  skipped BOOLEAN DEFAULT false,
  
  -- Feedback
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Analytics
CREATE TABLE IF NOT EXISTS routine_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID, -- References adaptive_routines or user routines
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  
  -- Completion metrics
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  skipped_sessions INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2), -- Percentage
  
  -- Performance metrics
  average_session_duration_minutes DECIMAL(6, 2),
  total_time_spent_minutes INTEGER,
  consistency_score DECIMAL(5, 2), -- How consistent user is
  
  -- Progress metrics
  starting_measurements JSONB,
  current_measurements JSONB,
  progress_made JSONB, -- Changes in measurements
  
  -- Engagement
  engagement_score DECIMAL(5, 2),
  difficulty_adjustments_made INTEGER,
  
  -- Outcomes
  goals_achieved TEXT[],
  goals_in_progress TEXT[],
  goals_not_met TEXT[],
  
  -- Insights
  insights TEXT[],
  recommendations TEXT[],
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rest Day Recommendations (AI-powered)
CREATE TABLE IF NOT EXISTS rest_day_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID, -- References adaptive_routines
  
  recommended_date DATE NOT NULL,
  recommendation_type TEXT CHECK (recommendation_type IN ('scheduled', 'recovery', 'injury_prevention', 'overtraining', 'fatigue')),
  
  -- Reasoning
  reason TEXT NOT NULL,
  factors_considered JSONB, -- {recent_activity: ..., fatigue_level: ..., etc.}
  confidence DECIMAL(3, 2),
  
  -- User response
  was_followed BOOLEAN,
  user_feedback TEXT,
  
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Injury Prevention Alerts
CREATE TABLE IF NOT EXISTS injury_prevention_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID,
  
  alert_type TEXT NOT NULL CHECK (alert_type IN ('overtraining', 'form_correction', 'rest_needed', 'intensity_reduction', 'exercise_substitution')),
  
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Alert details
  message TEXT NOT NULL,
  affected_exercises TEXT[],
  recommendations TEXT[],
  
  -- Risk factors
  risk_factors JSONB, -- Identified risk factors
  risk_score DECIMAL(5, 2), -- 0.00 to 100.00
  
  -- User response
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  action_taken TEXT,
  
  alerted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-Week Programs
CREATE TABLE IF NOT EXISTS multi_week_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_template_id UUID REFERENCES routine_templates(id),
  
  program_name TEXT NOT NULL,
  description TEXT,
  
  -- Program structure
  total_weeks INTEGER NOT NULL,
  current_week INTEGER DEFAULT 1,
  phases JSONB NOT NULL, -- Array of program phases
  
  -- Schedule
  start_date DATE NOT NULL,
  target_end_date DATE,
  actual_end_date DATE,
  
  -- Progress
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  weeks_completed INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  
  -- Goals
  program_goals TEXT[],
  milestones JSONB, -- Array of milestones
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program Phases (individual phases within multi-week programs)
CREATE TABLE IF NOT EXISTS program_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES multi_week_programs(id) ON DELETE CASCADE,
  
  phase_number INTEGER NOT NULL,
  phase_name TEXT NOT NULL,
  description TEXT,
  
  -- Phase details
  duration_weeks INTEGER NOT NULL,
  start_week INTEGER NOT NULL,
  end_week INTEGER NOT NULL,
  
  -- Phase routine
  phase_routine JSONB NOT NULL,
  phase_goals TEXT[],
  
  -- Progress
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_routine_templates_category ON routine_templates(category);
CREATE INDEX IF NOT EXISTS idx_routine_templates_difficulty ON routine_templates(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_routine_template_reviews_template_id ON routine_template_reviews(template_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_routines_user_id ON adaptive_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_routines_user_id ON shared_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_routines_public ON shared_routines(is_public);
CREATE INDEX IF NOT EXISTS idx_routine_marketplace_creator_id ON routine_marketplace(creator_id);
CREATE INDEX IF NOT EXISTS idx_routine_purchases_user_id ON routine_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_video_guided_sessions_user_id ON video_guided_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_analytics_user_id ON routine_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_rest_day_recommendations_user_id ON rest_day_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_injury_prevention_alerts_user_id ON injury_prevention_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_week_programs_user_id ON multi_week_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_program_phases_program_id ON program_phases(program_id);

-- RLS Policies
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_template_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_guided_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rest_day_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_prevention_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_week_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_phases ENABLE ROW LEVEL SECURITY;

-- Routine Templates: All authenticated users can view
CREATE POLICY "Authenticated users can view routine templates"
  ON routine_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create routine templates"
  ON routine_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Routine Template Reviews: Users can view all, create own
CREATE POLICY "Users can view all reviews"
  ON routine_template_reviews FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create own reviews"
  ON routine_template_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON routine_template_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Adaptive Routines: Users can view their own
CREATE POLICY "Users can manage own adaptive routines"
  ON adaptive_routines FOR ALL
  USING (auth.uid() = user_id);

-- Shared Routines: Users can view public and shared with them
CREATE POLICY "Users can view public and shared routines"
  ON shared_routines FOR SELECT
  USING (
    is_public = true OR 
    auth.uid() = user_id OR 
    auth.uid() = ANY(shared_with_users)
  );

CREATE POLICY "Users can create shared routines"
  ON shared_routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Routine Marketplace: All authenticated users can view
CREATE POLICY "Authenticated users can view marketplace"
  ON routine_marketplace FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Creators can manage own marketplace items"
  ON routine_marketplace FOR ALL
  USING (auth.uid() = creator_id);

-- Routine Purchases: Users can view their own
CREATE POLICY "Users can view own purchases"
  ON routine_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
  ON routine_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Video-Guided Sessions: Users can view their own
CREATE POLICY "Users can manage own video sessions"
  ON video_guided_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Routine Analytics: Users can view their own
CREATE POLICY "Users can view own routine analytics"
  ON routine_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create routine analytics"
  ON routine_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Rest Day Recommendations: Users can view their own
CREATE POLICY "Users can view own rest day recommendations"
  ON rest_day_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rest day recommendations"
  ON rest_day_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create rest day recommendations"
  ON rest_day_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Injury Prevention Alerts: Users can view their own
CREATE POLICY "Users can view own injury alerts"
  ON injury_prevention_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own injury alerts"
  ON injury_prevention_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create injury alerts"
  ON injury_prevention_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Multi-Week Programs: Users can view their own
CREATE POLICY "Users can manage own multi-week programs"
  ON multi_week_programs FOR ALL
  USING (auth.uid() = user_id);

-- Program Phases: Users can view phases of their programs
CREATE POLICY "Users can view phases of own programs"
  ON program_phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multi_week_programs mwp 
      WHERE mwp.id = program_phases.program_id 
      AND mwp.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage program phases"
  ON program_phases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM multi_week_programs mwp 
      WHERE mwp.id = program_phases.program_id 
      AND mwp.user_id = auth.uid()
    )
  );



-- END MIGRATION: 20251207000021_advanced_routine_features.sql

-- BEGIN MIGRATION: 20251207000022_enhanced_positions_gallery.sql

-- Migration: Enhanced Positions Gallery
-- Creates tables for position difficulty ratings, effectiveness tracking, reviews, playlists, recommendations, and analytics

-- Position Difficulty Ratings (user-submitted)
CREATE TABLE IF NOT EXISTS position_difficulty_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id TEXT NOT NULL, -- References position ID from positions data
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  difficulty_rating INTEGER NOT NULL CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
  physical_difficulty INTEGER CHECK (physical_difficulty >= 1 AND physical_difficulty <= 10),
  coordination_difficulty INTEGER CHECK (coordination_difficulty >= 1 AND coordination_difficulty <= 10),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(position_id, user_id)
);

-- Position Effectiveness Tracking
CREATE TABLE IF NOT EXISTS position_effectiveness_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  effectiveness_rating INTEGER NOT NULL CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
  pleasure_rating INTEGER CHECK (pleasure_rating >= 1 AND pleasure_rating <= 10),
  intensity_rating INTEGER CHECK (intensity_rating >= 1 AND intensity_rating <= 10),
  comfort_rating INTEGER CHECK (comfort_rating >= 1 AND comfort_rating <= 10),
  
  -- Context
  session_date DATE,
  partner_feedback TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position Reviews and Tips
CREATE TABLE IF NOT EXISTS position_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  tips TEXT[],
  pros TEXT[],
  cons TEXT[],
  
  -- Experience
  times_tried INTEGER DEFAULT 1,
  would_recommend BOOLEAN,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position Playlists (user-created)
CREATE TABLE IF NOT EXISTS position_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  playlist_name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  position_ids TEXT[] NOT NULL, -- Array of position IDs
  position_count INTEGER DEFAULT 0,
  
  view_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position Recommendations (AI-powered)
CREATE TABLE IF NOT EXISTS position_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  position_id TEXT NOT NULL,
  recommendation_type TEXT CHECK (recommendation_type IN ('similar', 'next_level', 'complementary', 'trending', 'personalized')),
  
  -- AI metadata
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  reasoning TEXT,
  ai_model_version TEXT,
  
  -- User interaction
  was_viewed BOOLEAN DEFAULT false,
  was_tried BOOLEAN DEFAULT false,
  user_feedback TEXT,
  
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position Viewing Analytics
CREATE TABLE IF NOT EXISTS position_viewing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  view_type TEXT CHECK (view_type IN ('gallery', 'detail', 'fullscreen', '3d', 'video')),
  view_duration_seconds INTEGER,
  interaction_count INTEGER DEFAULT 0, -- Clicks, zooms, etc.
  
  -- Viewing preferences
  viewing_angle TEXT, -- 'front', 'side', 'back', 'top', '360'
  zoom_level DECIMAL(3, 2),
  playback_speed DECIMAL(3, 2), -- For videos
  
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position Comparisons
CREATE TABLE IF NOT EXISTS position_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  position_ids TEXT[] NOT NULL, -- Array of 2+ position IDs to compare
  comparison_name TEXT,
  
  -- Comparison data
  comparison_results JSONB, -- {difficulty: {...}, effectiveness: {...}, etc.}
  insights TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position Variations
CREATE TABLE IF NOT EXISTS position_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_position_id TEXT NOT NULL,
  
  variation_name TEXT NOT NULL,
  description TEXT,
  difficulty_modifier INTEGER, -- -3 to +3 (easier to harder)
  
  -- Variation details
  modifications TEXT[], -- What's different
  benefits TEXT[],
  tips TEXT[],
  
  -- Media
  images TEXT[],
  videos TEXT[],
  
  created_by UUID REFERENCES auth.users(id),
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_position_difficulty_ratings_position_id ON position_difficulty_ratings(position_id);
CREATE INDEX IF NOT EXISTS idx_position_difficulty_ratings_user_id ON position_difficulty_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_position_effectiveness_position_id ON position_effectiveness_tracking(position_id);
CREATE INDEX IF NOT EXISTS idx_position_effectiveness_user_id ON position_effectiveness_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_position_reviews_position_id ON position_reviews(position_id);
CREATE INDEX IF NOT EXISTS idx_position_reviews_user_id ON position_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_position_playlists_user_id ON position_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_position_playlists_public ON position_playlists(is_public);
CREATE INDEX IF NOT EXISTS idx_position_recommendations_user_id ON position_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_position_viewing_analytics_position_id ON position_viewing_analytics(position_id);
CREATE INDEX IF NOT EXISTS idx_position_variations_base_id ON position_variations(base_position_id);

-- RLS Policies
ALTER TABLE position_difficulty_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_effectiveness_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_viewing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_variations ENABLE ROW LEVEL SECURITY;

-- Position Difficulty Ratings: Users can view all, manage own
CREATE POLICY "Users can view all difficulty ratings"
  ON position_difficulty_ratings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own difficulty ratings"
  ON position_difficulty_ratings FOR ALL
  USING (auth.uid() = user_id);

-- Position Effectiveness: Users can view all, manage own
CREATE POLICY "Users can view all effectiveness data"
  ON position_effectiveness_tracking FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage own effectiveness data"
  ON position_effectiveness_tracking FOR ALL
  USING (auth.uid() = user_id);

-- Position Reviews: Users can view all, manage own
CREATE POLICY "Users can view all reviews"
  ON position_reviews FOR SELECT
  USING (auth.role() = 'authenticated' AND (is_approved = true OR auth.uid() = user_id));

CREATE POLICY "Users can create own reviews"
  ON position_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON position_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Position Playlists: Users can view public and own
CREATE POLICY "Users can view public and own playlists"
  ON position_playlists FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own playlists"
  ON position_playlists FOR ALL
  USING (auth.uid() = user_id);

-- Position Recommendations: Users can view their own
CREATE POLICY "Users can manage own recommendations"
  ON position_recommendations FOR ALL
  USING (auth.uid() = user_id);

-- Position Viewing Analytics: Users can view their own
CREATE POLICY "Users can view own viewing analytics"
  ON position_viewing_analytics FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "System can create viewing analytics"
  ON position_viewing_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Position Comparisons: Users can manage their own
CREATE POLICY "Users can manage own comparisons"
  ON position_comparisons FOR ALL
  USING (auth.uid() = user_id);

-- Position Variations: All authenticated users can view
CREATE POLICY "Authenticated users can view variations"
  ON position_variations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create variations"
  ON position_variations FOR INSERT
  WITH CHECK (auth.uid() = created_by);



-- END MIGRATION: 20251207000022_enhanced_positions_gallery.sql

-- BEGIN MIGRATION: 20251207000023_nsfw_video_content.sql

-- Migration: NSFW Video Content System
-- Creates tables for NSFW educational videos, technique demonstrations, expert interviews, tutorials, and video management

-- NSFW Video Library
CREATE TABLE IF NOT EXISTS nsfw_video_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technique', 'tutorial', 'expert_interview', 'educational', 'demonstration', 'advanced', 'beginner')),
  
  -- Video files (different qualities)
  video_url_sd TEXT,
  video_url_hd TEXT,
  video_url_4k TEXT,
  video_duration_seconds INTEGER,
  
  -- Thumbnails
  thumbnail_url TEXT,
  preview_gif_url TEXT,
  
  -- Metadata
  tags TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  content_rating TEXT CHECK (content_rating IN ('educational', 'demonstrative', 'explicit')),
  
  -- Expert/creator
  expert_id UUID REFERENCES auth.users(id),
  expert_name TEXT,
  expert_credentials TEXT,
  
  -- Content details
  step_by_step_guide JSONB, -- Array of steps with timestamps
  key_points TEXT[],
  warnings TEXT[],
  prerequisites TEXT[],
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  
  -- Access
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  requires_dlc BOOLEAN DEFAULT false,
  dlc_pack_id UUID, -- References DLC pack if required
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Playlists
CREATE TABLE IF NOT EXISTS nsfw_video_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for curated/system playlists
  
  playlist_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  
  video_ids UUID[] NOT NULL, -- Array of video IDs
  video_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER,
  
  -- Settings
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_curated BOOLEAN DEFAULT false, -- System-curated playlist
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  
  -- Playback
  auto_play_next BOOLEAN DEFAULT true,
  shuffle_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Progress Tracking
CREATE TABLE IF NOT EXISTS nsfw_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Progress
  current_position_seconds INTEGER DEFAULT 0,
  watched_duration_seconds INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  
  -- Playback settings
  playback_speed DECIMAL(3, 2) DEFAULT 1.0,
  quality_preference TEXT DEFAULT 'auto' CHECK (quality_preference IN ('sd', 'hd', '4k', 'auto')),
  
  -- Interaction
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_position_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(video_id, user_id)
);

-- Video Downloads (for offline viewing)
CREATE TABLE IF NOT EXISTS nsfw_video_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Download details
  quality TEXT NOT NULL CHECK (quality IN ('sd', 'hd', '4k')),
  file_path TEXT NOT NULL, -- Local file path
  file_size_bytes INTEGER,
  download_status TEXT DEFAULT 'pending' CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed', 'paused')),
  
  -- Progress
  downloaded_bytes INTEGER DEFAULT 0,
  download_progress DECIMAL(5, 2) DEFAULT 0,
  
  -- Metadata
  downloaded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- When download expires (for DRM)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Recommendations
CREATE TABLE IF NOT EXISTS nsfw_video_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
  recommendation_type TEXT CHECK (recommendation_type IN ('similar', 'next_in_series', 'trending', 'personalized', 'based_on_history')),
  
  -- AI metadata
  confidence_score DECIMAL(3, 2),
  reasoning TEXT,
  ai_model_version TEXT,
  
  -- User interaction
  was_viewed BOOLEAN DEFAULT false,
  was_watched BOOLEAN DEFAULT false,
  user_feedback TEXT,
  
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Reviews and Ratings
CREATE TABLE IF NOT EXISTS nsfw_video_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(video_id, user_id)
);

-- Video Watch History
CREATE TABLE IF NOT EXISTS nsfw_video_watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  watch_duration_seconds INTEGER,
  completion_percentage DECIMAL(5, 2),
  
  -- Context
  watch_source TEXT, -- 'search', 'recommendation', 'playlist', 'direct'
  referrer_id UUID, -- Playlist ID, recommendation ID, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_category ON nsfw_video_content(category);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_premium ON nsfw_video_content(is_premium);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_featured ON nsfw_video_content(is_featured);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_playlists_user_id ON nsfw_video_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_playlists_public ON nsfw_video_playlists(is_public);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_progress_user_id ON nsfw_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_progress_video_id ON nsfw_video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_downloads_user_id ON nsfw_video_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_downloads_status ON nsfw_video_downloads(download_status);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_recommendations_user_id ON nsfw_video_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_watch_history_user_id ON nsfw_video_watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_watch_history_watched_at ON nsfw_video_watch_history(watched_at);

-- RLS Policies
ALTER TABLE nsfw_video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_video_watch_history ENABLE ROW LEVEL SECURITY;

-- NSFW Video Content: All authenticated users can view approved content
CREATE POLICY "Authenticated users can view approved videos"
  ON nsfw_video_content FOR SELECT
  USING (auth.role() = 'authenticated' AND is_approved = true AND is_active = true);

-- Video Playlists: Users can view public and own
CREATE POLICY "Users can view public and own playlists"
  ON nsfw_video_playlists FOR SELECT
  USING (is_public = true OR auth.uid() = user_id OR is_curated = true);

CREATE POLICY "Users can manage own playlists"
  ON nsfw_video_playlists FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Video Progress: Users can view their own
CREATE POLICY "Users can manage own video progress"
  ON nsfw_video_progress FOR ALL
  USING (auth.uid() = user_id);

-- Video Downloads: Users can view their own
CREATE POLICY "Users can manage own video downloads"
  ON nsfw_video_downloads FOR ALL
  USING (auth.uid() = user_id);

-- Video Recommendations: Users can view their own
CREATE POLICY "Users can manage own video recommendations"
  ON nsfw_video_recommendations FOR ALL
  USING (auth.uid() = user_id);

-- Video Reviews: Users can view all, manage own
CREATE POLICY "Users can view all reviews"
  ON nsfw_video_reviews FOR SELECT
  USING (auth.role() = 'authenticated' AND (is_approved = true OR auth.uid() = user_id));

CREATE POLICY "Users can create own reviews"
  ON nsfw_video_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON nsfw_video_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Video Watch History: Users can view their own
CREATE POLICY "Users can view own watch history"
  ON nsfw_video_watch_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create watch history"
  ON nsfw_video_watch_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);



-- END MIGRATION: 20251207000023_nsfw_video_content.sql

-- BEGIN MIGRATION: 20251207000024_enhanced_dlc_system.sql

-- Migration: Enhanced DLC System
-- Creates tables for modular DLC, bundles, previews, streaming, downloads, and content library organization

-- DLC Packs
CREATE TABLE IF NOT EXISTS dlc_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  pack_name TEXT NOT NULL,
  description TEXT NOT NULL,
  pack_type TEXT NOT NULL CHECK (pack_type IN ('positions', 'videos', 'education', 'bundle', 'premium_content')),
  
  -- Content
  content_items JSONB NOT NULL, -- Array of content items (positions, videos, etc.)
  item_count INTEGER DEFAULT 0,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_subscription BOOLEAN DEFAULT false,
  subscription_duration_days INTEGER, -- If subscription
  
  -- Preview
  preview_images TEXT[],
  preview_video_url TEXT,
  preview_description TEXT,
  
  -- Metadata
  tags TEXT[],
  category TEXT,
  difficulty_level TEXT,
  content_rating TEXT,
  
  -- Access
  requires_base_pack BOOLEAN DEFAULT false,
  base_pack_id UUID REFERENCES dlc_packs(id),
  is_standalone BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  release_date DATE,
  
  -- Sales
  sales_count INTEGER DEFAULT 0,
  revenue_total DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Bundles (packages of multiple DLC packs)
CREATE TABLE IF NOT EXISTS dlc_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  bundle_name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Bundle contents
  pack_ids UUID[] NOT NULL, -- Array of DLC pack IDs
  pack_count INTEGER DEFAULT 0,
  
  -- Pricing
  bundle_price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2), -- Sum of individual pack prices
  discount_percentage DECIMAL(5, 2), -- Calculated discount
  
  -- Preview
  preview_image_url TEXT,
  preview_description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_limited_time BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Purchases
CREATE TABLE IF NOT EXISTS dlc_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES dlc_packs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  purchase_type TEXT DEFAULT 'one_time' CHECK (purchase_type IN ('one_time', 'subscription')),
  price_paid DECIMAL(10, 2) NOT NULL,
  payment_intent_id TEXT,
  
  -- Access
  access_granted_at TIMESTAMPTZ DEFAULT NOW(),
  access_expires_at TIMESTAMPTZ, -- NULL for lifetime access
  is_active BOOLEAN DEFAULT true,
  
  -- Download/Stream
  download_enabled BOOLEAN DEFAULT true,
  stream_enabled BOOLEAN DEFAULT true,
  
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Download Queue
CREATE TABLE IF NOT EXISTS dlc_download_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES dlc_purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Download details
  content_item_id TEXT NOT NULL, -- ID of item being downloaded
  content_type TEXT NOT NULL CHECK (content_type IN ('position', 'video', 'image', '3d_model', 'other')),
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  
  -- Status
  download_status TEXT DEFAULT 'queued' CHECK (download_status IN ('queued', 'downloading', 'paused', 'completed', 'failed', 'cancelled')),
  download_priority INTEGER DEFAULT 5, -- 1-10, higher = more priority
  
  -- Progress
  downloaded_bytes INTEGER DEFAULT 0,
  download_progress DECIMAL(5, 2) DEFAULT 0,
  download_speed_bytes_per_sec INTEGER,
  estimated_time_remaining_seconds INTEGER,
  
  -- Metadata
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3
);

-- DLC Content Library (user's organized library)
CREATE TABLE IF NOT EXISTS dlc_content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES dlc_purchases(id) ON DELETE CASCADE,
  
  -- Organization
  folder_name TEXT, -- User-created folder
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  custom_notes TEXT,
  
  -- Access
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  -- Download status
  is_downloaded BOOLEAN DEFAULT false,
  download_location TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Updates and Versioning
CREATE TABLE IF NOT EXISTS dlc_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES dlc_packs(id) ON DELETE CASCADE,
  
  version_number TEXT NOT NULL,
  update_type TEXT CHECK (update_type IN ('patch', 'minor', 'major', 'content_add')),
  
  -- Update details
  changelog TEXT[],
  new_content_items JSONB,
  removed_content_items TEXT[],
  modified_content_items JSONB,
  
  -- Files
  update_file_url TEXT,
  update_file_size_bytes INTEGER,
  
  -- Status
  is_required BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  release_date TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Backup Status
CREATE TABLE IF NOT EXISTS dlc_backup_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES dlc_purchases(id) ON DELETE CASCADE,
  
  -- Backup details
  backup_location TEXT, -- 'cloud', 'local', 'both'
  cloud_backup_url TEXT,
  local_backup_path TEXT,
  
  -- Status
  backup_status TEXT DEFAULT 'pending' CHECK (backup_status IN ('pending', 'backing_up', 'completed', 'failed', 'restored')),
  last_backed_up_at TIMESTAMPTZ,
  backup_size_bytes INTEGER,
  
  -- Restore
  last_restored_at TIMESTAMPTZ,
  restore_status TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Streaming Sessions
CREATE TABLE IF NOT EXISTS dlc_streaming_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES dlc_purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Streaming details
  content_item_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  quality TEXT DEFAULT 'auto' CHECK (quality IN ('sd', 'hd', '4k', 'auto')),
  
  -- Session
  session_started_at TIMESTAMPTZ DEFAULT NOW(),
  session_ended_at TIMESTAMPTZ,
  total_watch_time_seconds INTEGER,
  
  -- Streaming metrics
  buffering_count INTEGER DEFAULT 0,
  quality_changes INTEGER DEFAULT 0,
  average_bitrate INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dlc_packs_type ON dlc_packs(pack_type);
CREATE INDEX IF NOT EXISTS idx_dlc_packs_active ON dlc_packs(is_active);
CREATE INDEX IF NOT EXISTS idx_dlc_purchases_user_id ON dlc_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_purchases_pack_id ON dlc_purchases(pack_id);
CREATE INDEX IF NOT EXISTS idx_dlc_download_queue_user_id ON dlc_download_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_download_queue_status ON dlc_download_queue(download_status);
CREATE INDEX IF NOT EXISTS idx_dlc_content_library_user_id ON dlc_content_library(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_updates_pack_id ON dlc_updates(pack_id);
CREATE INDEX IF NOT EXISTS idx_dlc_backup_status_user_id ON dlc_backup_status(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_streaming_sessions_user_id ON dlc_streaming_sessions(user_id);

-- RLS Policies
ALTER TABLE dlc_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_download_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_backup_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_streaming_sessions ENABLE ROW LEVEL SECURITY;

-- DLC Packs: All authenticated users can view active packs
CREATE POLICY "Authenticated users can view active DLC packs"
  ON dlc_packs FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- DLC Bundles: All authenticated users can view active bundles
CREATE POLICY "Authenticated users can view active bundles"
  ON dlc_bundles FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- DLC Purchases: Users can view their own
CREATE POLICY "Users can view own DLC purchases"
  ON dlc_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
  ON dlc_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DLC Download Queue: Users can view their own
CREATE POLICY "Users can manage own download queue"
  ON dlc_download_queue FOR ALL
  USING (auth.uid() = user_id);

-- DLC Content Library: Users can view their own
CREATE POLICY "Users can manage own content library"
  ON dlc_content_library FOR ALL
  USING (auth.uid() = user_id);

-- DLC Updates: All authenticated users can view
CREATE POLICY "Authenticated users can view DLC updates"
  ON dlc_updates FOR SELECT
  USING (auth.role() = 'authenticated' AND is_available = true);

-- DLC Backup Status: Users can view their own
CREATE POLICY "Users can manage own backup status"
  ON dlc_backup_status FOR ALL
  USING (auth.uid() = user_id);

-- DLC Streaming Sessions: Users can view their own
CREATE POLICY "Users can view own streaming sessions"
  ON dlc_streaming_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create streaming sessions"
  ON dlc_streaming_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);



-- END MIGRATION: 20251207000024_enhanced_dlc_system.sql

-- BEGIN MIGRATION: 20251207000025_premium_content_marketplace.sql

-- Migration: Premium Content Marketplace
-- Creates tables for premium position packs, video content, educational courses, expert-created content, ratings, and purchases

-- Premium Content Items
CREATE TABLE IF NOT EXISTS premium_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content_type TEXT NOT NULL CHECK (content_type IN ('position_pack', 'video', 'course', 'expert_content', 'bundle')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Content data
  content_data JSONB NOT NULL, -- Type-specific content structure
  preview_content JSONB, -- Preview/sample content
  
  -- Media
  preview_images TEXT[],
  preview_video_url TEXT,
  thumbnail_url TEXT,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_subscription BOOLEAN DEFAULT false,
  subscription_duration_days INTEGER,
  
  -- Metadata
  category TEXT,
  tags TEXT[],
  difficulty_level TEXT,
  content_rating TEXT,
  target_audience TEXT[],
  
  -- Expert/creator info
  expert_name TEXT,
  expert_credentials TEXT,
  expert_bio TEXT,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  revenue_total DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false, -- Verified by platform
  is_trending BOOLEAN DEFAULT false,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  moderation_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium Content Purchases
CREATE TABLE IF NOT EXISTS premium_content_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES premium_content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  purchase_type TEXT DEFAULT 'one_time' CHECK (purchase_type IN ('one_time', 'subscription')),
  price_paid DECIMAL(10, 2) NOT NULL,
  payment_intent_id TEXT,
  
  -- Access
  access_granted_at TIMESTAMPTZ DEFAULT NOW(),
  access_expires_at TIMESTAMPTZ, -- NULL for lifetime access
  is_active BOOLEAN DEFAULT true,
  
  -- Download/Stream
  download_enabled BOOLEAN DEFAULT true,
  stream_enabled BOOLEAN DEFAULT true,
  
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium Content Ratings and Reviews
CREATE TABLE IF NOT EXISTS premium_content_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES premium_content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  pros TEXT[],
  cons TEXT[],
  
  -- Experience
  has_used_content BOOLEAN DEFAULT false,
  usage_duration_days INTEGER,
  results_achieved TEXT,
  
  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  is_verified_purchase BOOLEAN DEFAULT false,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(content_id, user_id)
);

-- Premium Content Recommendations
CREATE TABLE IF NOT EXISTS premium_content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content_id UUID NOT NULL REFERENCES premium_content_items(id) ON DELETE CASCADE,
  recommendation_type TEXT CHECK (recommendation_type IN ('similar', 'trending', 'personalized', 'based_on_purchase', 'expert_pick')),
  
  -- AI metadata
  confidence_score DECIMAL(3, 2),
  reasoning TEXT,
  ai_model_version TEXT,
  
  -- User interaction
  was_viewed BOOLEAN DEFAULT false,
  was_purchased BOOLEAN DEFAULT false,
  user_feedback TEXT,
  
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium Content Categories
CREATE TABLE IF NOT EXISTS premium_content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  color TEXT,
  
  -- Organization
  parent_category_id UUID REFERENCES premium_content_categories(id),
  order_index INTEGER DEFAULT 0,
  
  -- Statistics
  content_count INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium Content Bundles
CREATE TABLE IF NOT EXISTS premium_content_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  bundle_name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Bundle contents
  content_ids UUID[] NOT NULL, -- Array of premium content item IDs
  content_count INTEGER DEFAULT 0,
  
  -- Pricing
  bundle_price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2), -- Sum of individual item prices
  discount_percentage DECIMAL(5, 2),
  
  -- Preview
  preview_image_url TEXT,
  preview_description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_limited_time BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  
  -- Sales
  sales_count INTEGER DEFAULT 0,
  revenue_total DECIMAL(10, 2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Premium Content Wishlist
CREATE TABLE IF NOT EXISTS premium_content_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES premium_content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  UNIQUE(content_id, user_id)
);

-- Premium Content Viewing Analytics
CREATE TABLE IF NOT EXISTS premium_content_viewing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES premium_content_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  view_type TEXT CHECK (view_type IN ('preview', 'detail', 'full')),
  view_duration_seconds INTEGER,
  interaction_count INTEGER DEFAULT 0,
  
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_premium_content_items_creator_id ON premium_content_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_premium_content_items_type ON premium_content_items(content_type);
CREATE INDEX IF NOT EXISTS idx_premium_content_items_active ON premium_content_items(is_active);
CREATE INDEX IF NOT EXISTS idx_premium_content_items_featured ON premium_content_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_premium_content_purchases_user_id ON premium_content_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_content_purchases_content_id ON premium_content_purchases(content_id);
CREATE INDEX IF NOT EXISTS idx_premium_content_reviews_content_id ON premium_content_reviews(content_id);
CREATE INDEX IF NOT EXISTS idx_premium_content_reviews_user_id ON premium_content_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_content_recommendations_user_id ON premium_content_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_content_wishlist_user_id ON premium_content_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_content_viewing_content_id ON premium_content_viewing(content_id);

-- RLS Policies
ALTER TABLE premium_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_content_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_content_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_content_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_content_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_content_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_content_viewing ENABLE ROW LEVEL SECURITY;

-- Premium Content Items: All authenticated users can view active items
CREATE POLICY "Authenticated users can view active premium content"
  ON premium_content_items FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true AND (is_approved = true OR auth.uid() = creator_id));

CREATE POLICY "Creators can manage own content"
  ON premium_content_items FOR ALL
  USING (auth.uid() = creator_id);

-- Premium Content Purchases: Users can view their own
CREATE POLICY "Users can view own purchases"
  ON premium_content_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
  ON premium_content_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Premium Content Reviews: Users can view all, manage own
CREATE POLICY "Users can view all reviews"
  ON premium_content_reviews FOR SELECT
  USING (auth.role() = 'authenticated' AND (is_approved = true OR auth.uid() = user_id));

CREATE POLICY "Users can create own reviews"
  ON premium_content_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON premium_content_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Premium Content Recommendations: Users can view their own
CREATE POLICY "Users can manage own recommendations"
  ON premium_content_recommendations FOR ALL
  USING (auth.uid() = user_id);

-- Premium Content Categories: All authenticated users can view
CREATE POLICY "Authenticated users can view categories"
  ON premium_content_categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- Premium Content Bundles: All authenticated users can view active bundles
CREATE POLICY "Authenticated users can view active bundles"
  ON premium_content_bundles FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Premium Content Wishlist: Users can view their own
CREATE POLICY "Users can manage own wishlist"
  ON premium_content_wishlist FOR ALL
  USING (auth.uid() = user_id);

-- Premium Content Viewing: Users can view their own
CREATE POLICY "Users can view own viewing analytics"
  ON premium_content_viewing FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create viewing analytics"
  ON premium_content_viewing FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);



-- END MIGRATION: 20251207000025_premium_content_marketplace.sql

-- BEGIN MIGRATION: 20251207000026_nsfw_community_forum.sql

-- Migration: NSFW Community Forum
-- Creates tables for NSFW discussion forums, anonymous posting, Q&A, success stories, support groups, and expert moderation

-- NSFW Forum Categories
CREATE TABLE IF NOT EXISTS nsfw_forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  
  -- Settings
  allows_anonymous BOOLEAN DEFAULT true,
  requires_moderation BOOLEAN DEFAULT true,
  is_expert_moderated BOOLEAN DEFAULT false,
  
  -- Statistics
  thread_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Forum Threads
CREATE TABLE IF NOT EXISTS nsfw_forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES nsfw_forum_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Posting options
  is_anonymous BOOLEAN DEFAULT false,
  is_qa_thread BOOLEAN DEFAULT false, -- Q&A thread
  is_success_story BOOLEAN DEFAULT false,
  is_support_group BOOLEAN DEFAULT false,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  moderation_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  -- Last activity
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Forum Posts (replies)
CREATE TABLE IF NOT EXISTS nsfw_forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES nsfw_forum_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
  
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_expert_answer BOOLEAN DEFAULT false, -- Marked as expert answer
  
  -- Engagement
  like_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  moderation_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Support Groups
CREATE TABLE IF NOT EXISTS nsfw_support_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  group_name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('health_condition', 'treatment', 'recovery', 'general_support', 'anonymous')),
  
  -- Settings
  is_private BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Statistics
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Group Members
CREATE TABLE IF NOT EXISTS nsfw_support_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES nsfw_support_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
  is_anonymous BOOLEAN DEFAULT false,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  
  UNIQUE(group_id, user_id)
);

-- NSFW Community Challenges
CREATE TABLE IF NOT EXISTS nsfw_community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  challenge_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  
  -- Challenge details
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days INTEGER,
  
  -- Participation
  participant_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  
  -- Leaderboard
  has_leaderboard BOOLEAN DEFAULT true,
  is_anonymous_leaderboard BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge Participants
CREATE TABLE IF NOT EXISTS nsfw_challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES nsfw_community_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Participation
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- Progress
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  
  -- Leaderboard
  leaderboard_position INTEGER,
  is_anonymous BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Content Sharing (moderated)
CREATE TABLE IF NOT EXISTS nsfw_content_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous
  
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video', 'text', 'link')),
  content_url TEXT,
  content_text TEXT,
  
  -- Sharing context
  shared_in_thread_id UUID REFERENCES nsfw_forum_threads(id) ON DELETE CASCADE,
  shared_in_group_id UUID REFERENCES nsfw_support_groups(id) ON DELETE CASCADE,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Moderators
CREATE TABLE IF NOT EXISTS nsfw_expert_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  expert_name TEXT NOT NULL,
  credentials TEXT,
  bio TEXT,
  specialization TEXT[],
  
  -- Moderation stats
  moderation_count INTEGER DEFAULT 0,
  approval_count INTEGER DEFAULT 0,
  rejection_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_threads_category_id ON nsfw_forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_threads_user_id ON nsfw_forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_threads_approved ON nsfw_forum_threads(is_approved);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_posts_thread_id ON nsfw_forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_support_groups_user_id ON nsfw_support_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_support_group_members_group_id ON nsfw_support_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_challenge_participants_challenge_id ON nsfw_challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_challenge_participants_user_id ON nsfw_challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_content_sharing_moderation ON nsfw_content_sharing(moderation_status);

-- RLS Policies
ALTER TABLE nsfw_forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_support_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_support_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_community_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_content_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_expert_moderators ENABLE ROW LEVEL SECURITY;

-- NSFW Forum Categories: All authenticated users can view
CREATE POLICY "Authenticated users can view forum categories"
  ON nsfw_forum_categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- NSFW Forum Threads: Users can view approved threads
CREATE POLICY "Users can view approved threads"
  ON nsfw_forum_threads FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      is_approved = true OR 
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'moderator')
      )
    )
  );

CREATE POLICY "Users can create threads"
  ON nsfw_forum_threads FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR 
      (is_anonymous = true AND user_id IS NULL)
    )
  );

CREATE POLICY "Users can update own threads"
  ON nsfw_forum_threads FOR UPDATE
  USING (auth.uid() = user_id);

-- NSFW Forum Posts: Users can view approved posts
CREATE POLICY "Users can view approved posts"
  ON nsfw_forum_posts FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      is_approved = true OR 
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'moderator')
      )
    )
  );

CREATE POLICY "Users can create posts"
  ON nsfw_forum_posts FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR 
      (is_anonymous = true AND user_id IS NULL)
    )
  );

-- NSFW Support Groups: Members can view their groups
CREATE POLICY "Members can view their support groups"
  ON nsfw_support_groups FOR SELECT
  USING (
    is_private = false OR 
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM nsfw_support_group_members sgm 
      WHERE sgm.group_id = nsfw_support_groups.id 
      AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create support groups"
  ON nsfw_support_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Support Group Members: Members can view members of their groups
CREATE POLICY "Members can view group members"
  ON nsfw_support_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nsfw_support_group_members sgm 
      WHERE sgm.group_id = nsfw_support_group_members.group_id 
      AND sgm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join support groups"
  ON nsfw_support_group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM nsfw_support_groups sg 
        WHERE sg.id = nsfw_support_group_members.group_id 
        AND sg.is_private = false
      )
    )
  );

-- NSFW Community Challenges: All authenticated users can view active challenges
CREATE POLICY "Authenticated users can view active challenges"
  ON nsfw_community_challenges FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Challenge Participants: Users can view their own participation
CREATE POLICY "Users can manage own challenge participation"
  ON nsfw_challenge_participants FOR ALL
  USING (auth.uid() = user_id);

-- NSFW Content Sharing: Users can view approved content
CREATE POLICY "Users can view approved shared content"
  ON nsfw_content_sharing FOR SELECT
  USING (
    auth.role() = 'authenticated' AND (
      moderation_status = 'approved' OR 
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'moderator')
      )
    )
  );

CREATE POLICY "Users can create shared content"
  ON nsfw_content_sharing FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND (
      auth.uid() = user_id OR 
      user_id IS NULL
    )
  );

-- Expert Moderators: All authenticated users can view
CREATE POLICY "Authenticated users can view expert moderators"
  ON nsfw_expert_moderators FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);



-- END MIGRATION: 20251207000026_nsfw_community_forum.sql

-- BEGIN MIGRATION: 20251207000027_nsfw_sexual_wellness_analytics.sql

-- Migration: NSFW Sexual Wellness Analytics
-- Creates tables for enhanced sexual function tracking, libido monitoring, satisfaction tracking, frequency tracking, and wellness scoring

-- Enhanced Sexual Function Tracking
CREATE TABLE IF NOT EXISTS nsfw_sexual_function_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  entry_date DATE NOT NULL,
  entry_time TIME,
  
  -- Function metrics
  erectile_function_score INTEGER CHECK (erectile_function_score >= 1 AND erectile_function_score <= 10),
  erection_quality TEXT CHECK (erection_quality IN ('none', 'partial', 'full', 'rigid')),
  erection_duration_minutes INTEGER,
  erection_stability INTEGER CHECK (erection_stability >= 1 AND erection_stability <= 10),
  
  -- Performance metrics
  stamina_minutes INTEGER,
  control_level INTEGER CHECK (control_level >= 1 AND control_level <= 10),
  recovery_time_minutes INTEGER,
  
  -- Context
  activity_type TEXT CHECK (activity_type IN ('solo', 'partner', 'both')),
  partner_present BOOLEAN,
  environment TEXT, -- 'home', 'other', etc.
  
  -- Factors affecting
  factors_affecting JSONB, -- {stress: boolean, fatigue: boolean, alcohol: boolean, etc.}
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, entry_date)
);

-- Libido Monitoring
CREATE TABLE IF NOT EXISTS nsfw_libido_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  entry_date DATE NOT NULL,
  
  -- Libido metrics
  libido_level INTEGER NOT NULL CHECK (libido_level >= 1 AND libido_level <= 10),
  libido_direction TEXT CHECK (libido_direction IN ('increasing', 'stable', 'decreasing')),
  
  -- Factors
  contributing_factors JSONB, -- {exercise: boolean, sleep: boolean, stress: boolean, etc.}
  inhibiting_factors JSONB,
  
  -- Desires
  desire_frequency TEXT CHECK (desire_frequency IN ('multiple_daily', 'daily', 'few_times_week', 'weekly', 'less_often')),
  desire_intensity INTEGER CHECK (desire_intensity >= 1 AND desire_intensity <= 10),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Satisfaction Tracking
CREATE TABLE IF NOT EXISTS nsfw_satisfaction_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  entry_date DATE NOT NULL,
  
  -- Satisfaction metrics
  overall_satisfaction INTEGER NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
  physical_satisfaction INTEGER CHECK (physical_satisfaction >= 1 AND physical_satisfaction <= 10),
  emotional_satisfaction INTEGER CHECK (emotional_satisfaction >= 1 AND emotional_satisfaction <= 10),
  
  -- Partner satisfaction (if applicable)
  partner_satisfaction INTEGER CHECK (partner_satisfaction >= 1 AND partner_satisfaction <= 10),
  mutual_satisfaction INTEGER CHECK (mutual_satisfaction >= 1 AND mutual_satisfaction <= 10),
  
  -- Factors
  satisfaction_factors JSONB, -- What contributed to satisfaction
  dissatisfaction_factors JSONB, -- What detracted from satisfaction
  
  -- Context
  activity_type TEXT,
  partner_present BOOLEAN,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Frequency Tracking
CREATE TABLE IF NOT EXISTS nsfw_frequency_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  tracking_period_start DATE NOT NULL,
  tracking_period_end DATE NOT NULL,
  period_type TEXT DEFAULT 'weekly' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  
  -- Frequency metrics
  solo_activity_count INTEGER DEFAULT 0,
  partner_activity_count INTEGER DEFAULT 0,
  total_activity_count INTEGER DEFAULT 0,
  
  -- Average frequency
  average_per_week DECIMAL(5, 2),
  average_per_month DECIMAL(5, 2),
  
  -- Trends
  frequency_trend TEXT CHECK (frequency_trend IN ('increasing', 'stable', 'decreasing', 'fluctuating')),
  trend_strength DECIMAL(3, 2), -- 0.00 to 1.00
  
  -- Goals
  target_frequency_per_week DECIMAL(5, 2),
  goal_achieved BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sexual Wellness Score
CREATE TABLE IF NOT EXISTS nsfw_wellness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  calculation_date DATE NOT NULL,
  calculation_period_days INTEGER DEFAULT 30,
  
  -- Overall score
  overall_wellness_score DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00
  
  -- Component scores
  function_score DECIMAL(5, 2),
  libido_score DECIMAL(5, 2),
  satisfaction_score DECIMAL(5, 2),
  frequency_score DECIMAL(5, 2),
  relationship_score DECIMAL(5, 2), -- If applicable
  
  -- Trends
  score_trend TEXT CHECK (score_trend IN ('improving', 'stable', 'declining', 'fluctuating')),
  score_change DECIMAL(5, 2), -- Change from previous period
  
  -- Insights
  insights TEXT[],
  recommendations TEXT[],
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sexual Wellness Correlations
CREATE TABLE IF NOT EXISTS nsfw_wellness_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  correlation_type TEXT NOT NULL CHECK (correlation_type IN ('function_libido', 'satisfaction_frequency', 'exercise_function', 'sleep_libido', 'stress_function', 'custom')),
  
  -- Correlation data
  metric_a TEXT NOT NULL,
  metric_b TEXT NOT NULL,
  correlation_coefficient DECIMAL(5, 4), -- -1.0000 to 1.0000
  correlation_strength TEXT CHECK (correlation_strength IN ('strong_positive', 'moderate_positive', 'weak_positive', 'none', 'weak_negative', 'moderate_negative', 'strong_negative')),
  
  -- Significance
  is_statistically_significant BOOLEAN DEFAULT false,
  p_value DECIMAL(10, 8),
  
  -- Insights
  interpretation TEXT,
  recommendations TEXT[],
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Wellness Dashboards
CREATE TABLE IF NOT EXISTS nsfw_wellness_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  dashboard_name TEXT NOT NULL,
  description TEXT,
  
  -- Dashboard configuration
  dashboard_config JSONB NOT NULL, -- Layout, widgets, metrics
  selected_metrics TEXT[] NOT NULL,
  date_range JSONB,
  
  -- Visual customization
  theme TEXT DEFAULT 'default',
  chart_types JSONB,
  
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nsfw_sexual_function_user_date ON nsfw_sexual_function_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_libido_user_date ON nsfw_libido_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_satisfaction_user_date ON nsfw_satisfaction_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_frequency_user_id ON nsfw_frequency_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_wellness_scores_user_id ON nsfw_wellness_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_wellness_correlations_user_id ON nsfw_wellness_correlations(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_wellness_dashboards_user_id ON nsfw_wellness_dashboards(user_id);

-- RLS Policies
ALTER TABLE nsfw_sexual_function_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_libido_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_satisfaction_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_frequency_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_wellness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_wellness_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsfw_wellness_dashboards ENABLE ROW LEVEL SECURITY;

-- All NSFW wellness tables: Users can view their own
CREATE POLICY "Users can manage own sexual function tracking"
  ON nsfw_sexual_function_tracking FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own libido tracking"
  ON nsfw_libido_tracking FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own satisfaction tracking"
  ON nsfw_satisfaction_tracking FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own frequency tracking"
  ON nsfw_frequency_tracking FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wellness scores"
  ON nsfw_wellness_scores FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wellness correlations"
  ON nsfw_wellness_correlations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wellness dashboards"
  ON nsfw_wellness_dashboards FOR ALL
  USING (auth.uid() = user_id);



-- END MIGRATION: 20251207000027_nsfw_sexual_wellness_analytics.sql

-- BEGIN MIGRATION: 20251207000028_subscription_tiers_expansion.sql

-- Migration: Subscription Tiers Expansion
-- Creates tables for expanded subscription tiers (Health Pro, Enterprise, Student) and annual plans

-- Expanded Subscription Tiers
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  tier_id TEXT NOT NULL UNIQUE, -- 'free', 'pro', 'premium', 'health_pro', 'enterprise', 'student'
  tier_name TEXT NOT NULL,
  tier_description TEXT,
  
  -- Pricing
  monthly_price DECIMAL(10, 2) NOT NULL,
  annual_price DECIMAL(10, 2), -- NULL if not available
  lifetime_price DECIMAL(10, 2), -- NULL if not available
  
  -- Discounts
  annual_discount_percentage DECIMAL(5, 2) DEFAULT 0, -- e.g., 20.00 for 20% off
  lifetime_discount_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- Stripe Price IDs
  stripe_monthly_price_id TEXT,
  stripe_annual_price_id TEXT,
  stripe_lifetime_price_id TEXT,
  
  -- Features (stored as JSONB for flexibility)
  features JSONB NOT NULL, -- Array of feature strings
  limitations JSONB, -- Array of limitation strings
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  
  -- Metadata
  sort_order INTEGER DEFAULT 0,
  icon_url TEXT,
  color_scheme TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans (user subscriptions)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  tier_id TEXT NOT NULL REFERENCES subscription_tiers(tier_id),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual', 'lifetime')),
  
  -- Stripe
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_customer_id TEXT,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'paused')),
  
  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  
  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  
  -- Pricing
  price_paid DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier Upgrades/Downgrades History
CREATE TABLE IF NOT EXISTS subscription_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  
  change_type TEXT NOT NULL CHECK (change_type IN ('upgrade', 'downgrade', 'renewal', 'cancellation', 'reactivation')),
  from_tier_id TEXT,
  to_tier_id TEXT NOT NULL,
  
  -- Pricing
  previous_price DECIMAL(10, 2),
  new_price DECIMAL(10, 2),
  prorated_amount DECIMAL(10, 2), -- For mid-cycle changes
  
  -- Reason
  reason TEXT,
  user_initiated BOOLEAN DEFAULT true,
  
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier Comparison Data (for UI)
CREATE TABLE IF NOT EXISTS tier_comparison_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  feature_name TEXT NOT NULL,
  feature_description TEXT,
  feature_category TEXT, -- 'scanner', 'analytics', 'ai', 'storage', etc.
  
  -- Which tiers have this feature
  available_tiers TEXT[] NOT NULL, -- Array of tier_ids
  
  -- Feature details
  is_premium BOOLEAN DEFAULT false,
  is_core BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_active ON subscription_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_tier_id ON subscription_tiers(tier_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_user_id ON subscription_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_status ON subscription_plans(status);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_tier_id ON subscription_plans(tier_id);
CREATE INDEX IF NOT EXISTS idx_subscription_changes_user_id ON subscription_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_comparison_features_category ON tier_comparison_features(feature_category);

-- RLS Policies
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_comparison_features ENABLE ROW LEVEL SECURITY;

-- Subscription Tiers: All authenticated users can view
CREATE POLICY "Authenticated users can view subscription tiers"
  ON subscription_tiers FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Subscription Plans: Users can view their own
CREATE POLICY "Users can view own subscription plans"
  ON subscription_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscription plans"
  ON subscription_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription plans"
  ON subscription_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Subscription Changes: Users can view their own
CREATE POLICY "Users can view own subscription changes"
  ON subscription_changes FOR SELECT
  USING (auth.uid() = user_id);

-- Tier Comparison Features: All authenticated users can view
CREATE POLICY "Authenticated users can view tier comparison"
  ON tier_comparison_features FOR SELECT
  USING (auth.role() = 'authenticated');

-- Insert default subscription tiers
INSERT INTO subscription_tiers (tier_id, tier_name, tier_description, monthly_price, annual_price, lifetime_price, annual_discount_percentage, features, limitations, is_active, is_popular, sort_order) VALUES
('free', 'Free', 'Basic features for getting started', 0.00, 0.00, 0.00, 0.00, 
 '["Basic 3D/2D Scanner", "Health Diary (Limited)", "Education Center", "Emergency Guidance"]'::jsonb,
 '["Limited scan history", "No cloud backup", "No AI features", "Basic analytics only"]'::jsonb,
 true, false, 1),
('pro', 'Pro', 'Enhanced tracking and analytics', 9.99, 99.99, 299.99, 20.00,
 '["Everything in Free", "Unlimited Scans", "Advanced Analytics", "Cloud Backup", "Progress Photos", "PE Routine Builder"]'::jsonb,
 '["No AI assistant", "Standard scan limits", "No medical export formats"]'::jsonb,
 true, false, 2),
('premium', 'Premium', 'Full capabilities with AI features', 19.99, 199.99, 499.99, 20.00,
 '["Everything in Pro", "AI Health Chatbot", "AI Scan Analysis", "Medical Export (HL7 FHIR)", "Priority Support", "Custom PE Routines", "Predictive Analytics"]'::jsonb,
 '[]'::jsonb,
 true, true, 3),
('health_pro', 'Health Pro', 'Professional health monitoring', 39.99, 399.99, 999.99, 20.00,
 '["Everything in Premium", "Advanced Health Monitoring", "Professional Reporting", "Extended Health History", "API Access", "Clinic Integration"]'::jsonb,
 '[]'::jsonb,
 true, false, 4),
('enterprise', 'Enterprise', 'For clinics and organizations', 99.99, 999.99, 2499.99, 20.00,
 '["Everything in Health Pro", "Multi-user Management", "White-label Option", "Custom Branding", "Dedicated Support", "SLA Guarantee"]'::jsonb,
 '[]'::jsonb,
 true, false, 5),
('student', 'Student', 'Discounted plan for students', 4.99, 49.99, NULL, 20.00,
 '["Everything in Pro", "Student Verification Required"]'::jsonb,
 '["Limited to verified students", "Annual plan only"]'::jsonb,
 true, false, 6)
ON CONFLICT (tier_id) DO NOTHING;



-- END MIGRATION: 20251207000028_subscription_tiers_expansion.sql

-- BEGIN MIGRATION: 20251207000029_premium_add_ons.sql

-- Migration: Premium Add-Ons System
-- Creates tables for premium add-ons (advanced analytics, extended storage, priority support, etc.)

-- Premium Add-Ons Catalog
CREATE TABLE IF NOT EXISTS premium_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  addon_id TEXT NOT NULL UNIQUE, -- 'advanced_analytics', 'extended_storage', 'priority_support', etc.
  addon_name TEXT NOT NULL,
  addon_description TEXT NOT NULL,
  
  -- Pricing
  monthly_price DECIMAL(10, 2) NOT NULL,
  annual_price DECIMAL(10, 2), -- NULL if not available
  lifetime_price DECIMAL(10, 2), -- NULL if not available
  
  -- Discounts
  annual_discount_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- Stripe Price IDs
  stripe_monthly_price_id TEXT,
  stripe_annual_price_id TEXT,
  stripe_lifetime_price_id TEXT,
  
  -- Features
  features JSONB NOT NULL, -- Array of feature strings
  limitations JSONB, -- Array of limitation strings
  
  -- Requirements
  requires_tier TEXT[], -- Array of tier_ids that can purchase this add-on
  incompatible_addons TEXT[], -- Array of addon_ids that conflict
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  
  -- Metadata
  category TEXT, -- 'analytics', 'storage', 'support', 'export', 'api', 'clinic'
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Add-On Subscriptions
CREATE TABLE IF NOT EXISTS user_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addon_id TEXT NOT NULL REFERENCES premium_add_ons(addon_id),
  
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual', 'lifetime')),
  
  -- Stripe
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'paused')),
  
  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  
  -- Pricing
  price_paid DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, addon_id)
);

-- Add-On Usage Tracking
CREATE TABLE IF NOT EXISTS addon_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addon_id TEXT NOT NULL REFERENCES premium_add_ons(addon_id),
  
  usage_type TEXT NOT NULL, -- 'storage_used', 'api_calls', 'exports_generated', etc.
  usage_value DECIMAL(15, 2) NOT NULL, -- e.g., bytes used, number of calls
  usage_limit DECIMAL(15, 2), -- NULL for unlimited
  
  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  tracked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_premium_add_ons_active ON premium_add_ons(is_active);
CREATE INDEX IF NOT EXISTS idx_premium_add_ons_category ON premium_add_ons(category);
CREATE INDEX IF NOT EXISTS idx_user_add_ons_user_id ON user_add_ons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_add_ons_status ON user_add_ons(status);
CREATE INDEX IF NOT EXISTS idx_addon_usage_tracking_user_id ON addon_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_addon_usage_tracking_period ON addon_usage_tracking(period_start, period_end);

-- RLS Policies
ALTER TABLE premium_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Premium Add-Ons: All authenticated users can view
CREATE POLICY "Authenticated users can view premium add-ons"
  ON premium_add_ons FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- User Add-Ons: Users can view their own
CREATE POLICY "Users can view own add-ons"
  ON user_add_ons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create add-on subscriptions"
  ON user_add_ons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own add-ons"
  ON user_add_ons FOR UPDATE
  USING (auth.uid() = user_id);

-- Add-On Usage Tracking: Users can view their own
CREATE POLICY "Users can view own add-on usage"
  ON addon_usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create usage tracking"
  ON addon_usage_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert default premium add-ons
INSERT INTO premium_add_ons (addon_id, addon_name, addon_description, monthly_price, annual_price, annual_discount_percentage, features, requires_tier, category, is_active, is_popular, sort_order) VALUES
('advanced_analytics', 'Advanced Analytics', 'Enhanced analytics and reporting tools', 9.99, 99.99, 20.00,
 '["Custom Report Builder", "Advanced Charts", "Predictive Modeling", "Export to Excel/PDF"]'::jsonb,
 '["pro", "premium", "health_pro", "enterprise"]'::text[],
 'analytics', true, true, 1),
('extended_storage', 'Extended Cloud Storage', 'Additional cloud storage for backups and data', 4.99, 49.99, 20.00,
 '["500GB Cloud Storage", "Unlimited Backups", "Automatic Sync"]'::jsonb,
 '["pro", "premium", "health_pro", "enterprise"]'::text[],
 'storage', true, false, 2),
('priority_support', 'Priority Support', 'Faster response times and dedicated support', 4.99, 49.99, 20.00,
 '["24/7 Priority Support", "Email Response < 2 hours", "Phone Support", "Dedicated Support Agent"]'::jsonb,
 '["pro", "premium", "health_pro", "enterprise"]'::text[],
 'support', true, false, 3),
('extended_history', 'Extended Health History', 'Keep health data for longer periods', 4.99, 49.99, 20.00,
 '["10 Years Data Retention", "Unlimited Historical Data", "Advanced Search"]'::jsonb,
 '["pro", "premium", "health_pro", "enterprise"]'::text[],
 'storage', true, false, 4),
('api_access', 'API Access', 'Programmatic access to your data', 14.99, 149.99, 20.00,
 '["REST API Access", "Webhook Support", "Rate Limits", "API Documentation"]'::jsonb,
 '["premium", "health_pro", "enterprise"]'::text[],
 'api', true, false, 5),
('clinic_portal', 'Clinic/Provider Portal', 'Professional portal for healthcare providers', 99.99, 999.99, 20.00,
 '["Multi-user Management", "Patient Data Access", "Professional Reporting", "HIPAA Compliance Tools"]'::jsonb,
 '["enterprise"]'::text[],
 'clinic', true, false, 6),
('white_label', 'White-Label Option', 'Custom branding for clinics and organizations', 199.99, 1999.99, 20.00,
 '["Custom Branding", "Custom Domain", "Custom Logo", "Custom Colors"]'::jsonb,
 '["enterprise"]'::text[],
 'clinic', true, false, 7)
ON CONFLICT (addon_id) DO NOTHING;



-- END MIGRATION: 20251207000029_premium_add_ons.sql

-- BEGIN MIGRATION: 20251207000030_marketplace_system.sql

-- Migration: Marketplace System
-- Creates tables for routine marketplace, expert consultations, custom reports, premium content access, equipment/supplement recommendations, and affiliate commissions

-- Marketplace Categories
CREATE TABLE IF NOT EXISTS marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  category_name TEXT NOT NULL UNIQUE,
  category_description TEXT,
  category_type TEXT NOT NULL CHECK (category_type IN ('routine', 'consultation', 'report', 'content', 'equipment', 'supplement', 'course', 'video')),
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Items (routines, courses, etc.)
CREATE TABLE IF NOT EXISTS marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES marketplace_categories(id) ON DELETE SET NULL,
  
  item_type TEXT NOT NULL CHECK (item_type IN ('routine', 'course', 'video', 'report_template', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Content
  content_data JSONB NOT NULL, -- Type-specific content structure
  preview_content JSONB,
  
  -- Media
  preview_images TEXT[],
  preview_video_url TEXT,
  thumbnail_url TEXT,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_subscription BOOLEAN DEFAULT false,
  subscription_duration_days INTEGER,
  is_free BOOLEAN DEFAULT false,
  
  -- Metadata
  tags TEXT[],
  difficulty_level TEXT,
  target_audience TEXT[],
  
  -- Expert/creator info
  expert_name TEXT,
  expert_credentials TEXT,
  expert_bio TEXT,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  revenue_total DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  moderation_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Consultations
CREATE TABLE IF NOT EXISTS expert_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('one_time', 'follow_up', 'group_workshop')),
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  consultation_status TEXT DEFAULT 'pending' CHECK (consultation_status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_intent_id TEXT,
  
  -- Consultation details
  user_concerns TEXT,
  expert_notes TEXT,
  recommendations TEXT[],
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  -- Recording
  recording_url TEXT,
  recording_available BOOLEAN DEFAULT false,
  
  -- Rating
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  user_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Report Generation (Paid)
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  report_type TEXT NOT NULL CHECK (report_type IN ('health_summary', 'progress_report', 'medical_export', 'custom')),
  report_name TEXT NOT NULL,
  
  -- Report configuration
  report_config JSONB NOT NULL, -- Date ranges, metrics, format, etc.
  data_sources TEXT[] NOT NULL, -- Which data to include
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_intent_id TEXT,
  
  -- Generation
  generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed')),
  generated_at TIMESTAMPTZ,
  file_url TEXT,
  file_format TEXT CHECK (file_format IN ('pdf', 'excel', 'csv', 'json', 'hl7_fhir')),
  file_size_bytes INTEGER,
  
  -- Sharing
  is_shared BOOLEAN DEFAULT false,
  shared_with TEXT[], -- Array of user IDs or email addresses
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Recommendations (Affiliate)
CREATE TABLE IF NOT EXISTS equipment_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  equipment_name TEXT NOT NULL,
  equipment_description TEXT NOT NULL,
  equipment_category TEXT, -- 'pump', 'extender', 'supplement', 'other'
  
  -- Affiliate links
  affiliate_url TEXT NOT NULL,
  affiliate_provider TEXT, -- 'amazon', 'other'
  commission_rate DECIMAL(5, 2), -- Percentage
  
  -- Product details
  price_range TEXT, -- e.g., "$50-$100"
  rating DECIMAL(3, 2),
  review_count INTEGER DEFAULT 0,
  image_url TEXT,
  
  -- Recommendations
  recommended_for TEXT[], -- Array of conditions/use cases
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplement Recommendations (Affiliate)
CREATE TABLE IF NOT EXISTS supplement_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  supplement_name TEXT NOT NULL,
  supplement_description TEXT NOT NULL,
  supplement_type TEXT, -- 'vitamin', 'herbal', 'protein', 'other'
  
  -- Affiliate links
  affiliate_url TEXT NOT NULL,
  affiliate_provider TEXT,
  commission_rate DECIMAL(5, 2),
  
  -- Product details
  price_range TEXT,
  rating DECIMAL(3, 2),
  review_count INTEGER DEFAULT 0,
  image_url TEXT,
  
  -- Health benefits
  health_benefits TEXT[],
  recommended_dosage TEXT,
  warnings TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Purchases
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  purchase_type TEXT DEFAULT 'one_time' CHECK (purchase_type IN ('one_time', 'subscription')),
  price_paid DECIMAL(10, 2) NOT NULL,
  payment_intent_id TEXT,
  
  -- Access
  access_granted_at TIMESTAMPTZ DEFAULT NOW(),
  access_expires_at TIMESTAMPTZ, -- NULL for lifetime access
  is_active BOOLEAN DEFAULT true,
  
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Commissions
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for system
  
  -- Commission source
  source_type TEXT NOT NULL CHECK (source_type IN ('equipment', 'supplement', 'other')),
  source_id TEXT NOT NULL, -- ID of equipment/supplement recommendation
  
  -- Purchase details
  purchase_amount DECIMAL(10, 2) NOT NULL,
  commission_rate DECIMAL(5, 2) NOT NULL,
  commission_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status
  commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid', 'cancelled')),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Tracking
  affiliate_link_clicked_at TIMESTAMPTZ,
  purchase_completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_items_creator_id ON marketplace_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_type ON marketplace_items(item_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_active ON marketplace_items(is_active);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_featured ON marketplace_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_expert_id ON expert_consultations(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_user_id ON expert_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_status ON expert_consultations(consultation_status);
CREATE INDEX IF NOT EXISTS idx_custom_reports_user_id ON custom_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_status ON custom_reports(generation_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_user_id ON marketplace_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_item_id ON marketplace_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_user_id ON affiliate_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(commission_status);

-- RLS Policies
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Marketplace Categories: All authenticated users can view
CREATE POLICY "Authenticated users can view marketplace categories"
  ON marketplace_categories FOR SELECT
  USING (auth.role() = 'authenticated');

-- Marketplace Items: All authenticated users can view active items
CREATE POLICY "Authenticated users can view active marketplace items"
  ON marketplace_items FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true AND (is_approved = true OR auth.uid() = creator_id));

CREATE POLICY "Creators can manage own marketplace items"
  ON marketplace_items FOR ALL
  USING (auth.uid() = creator_id);

-- Expert Consultations: Users can view their own
CREATE POLICY "Users can view own consultations"
  ON expert_consultations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = expert_id);

CREATE POLICY "Users can create consultations"
  ON expert_consultations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Experts can update consultations"
  ON expert_consultations FOR UPDATE
  USING (auth.uid() = expert_id);

-- Custom Reports: Users can view their own
CREATE POLICY "Users can manage own custom reports"
  ON custom_reports FOR ALL
  USING (auth.uid() = user_id);

-- Equipment Recommendations: All authenticated users can view
CREATE POLICY "Authenticated users can view equipment recommendations"
  ON equipment_recommendations FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Supplement Recommendations: All authenticated users can view
CREATE POLICY "Authenticated users can view supplement recommendations"
  ON supplement_recommendations FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Marketplace Purchases: Users can view their own
CREATE POLICY "Users can view own marketplace purchases"
  ON marketplace_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
  ON marketplace_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Affiliate Commissions: Users can view their own
CREATE POLICY "Users can view own affiliate commissions"
  ON affiliate_commissions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);



-- END MIGRATION: 20251207000030_marketplace_system.sql

-- BEGIN MIGRATION: 20251207000031_healthcare_provider_portal.sql

-- Migration: Healthcare Provider Portal
-- Creates tables for provider portal, doctor dashboard, patient data access, professional reporting, treatment planning, and HIPAA compliance

-- Healthcare Providers
CREATE TABLE IF NOT EXISTS healthcare_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Provider Information
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('doctor', 'clinic', 'hospital', 'organization')),
  specialty TEXT[],
  credentials TEXT[],
  license_number TEXT,
  license_state TEXT,
  
  -- Contact
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  website TEXT,
  
  -- Subscription
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  subscription_start_date DATE,
  subscription_end_date DATE,
  
  -- HIPAA Compliance
  hipaa_compliant BOOLEAN DEFAULT false,
  hipaa_certification_date DATE,
  baa_signed BOOLEAN DEFAULT false,
  baa_signed_date DATE,
  
  -- Settings
  max_patients INTEGER DEFAULT 100,
  current_patient_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Provider Staff Members
CREATE TABLE IF NOT EXISTS provider_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'nurse', 'assistant', 'viewer')),
  permissions JSONB, -- Specific permissions
  
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, user_id)
);

-- Patient-Provider Relationships
CREATE TABLE IF NOT EXISTS patient_provider_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  
  -- Consent
  consent_granted BOOLEAN DEFAULT false,
  consent_date DATE,
  consent_expires_date DATE,
  consent_scope TEXT[] NOT NULL, -- What data can be accessed
  
  -- Relationship
  relationship_type TEXT DEFAULT 'primary' CHECK (relationship_type IN ('primary', 'consulting', 'specialist', 'temporary')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  
  -- Access
  access_level TEXT DEFAULT 'read' CHECK (access_level IN ('read', 'read_write', 'full')),
  can_view_scans BOOLEAN DEFAULT true,
  can_view_diary BOOLEAN DEFAULT true,
  can_view_analytics BOOLEAN DEFAULT true,
  can_view_reports BOOLEAN DEFAULT true,
  
  -- Notes
  provider_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(patient_id, provider_id)
);

-- Provider Dashboard Data
CREATE TABLE IF NOT EXISTS provider_dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  
  -- Metrics
  metric_date DATE NOT NULL,
  total_patients INTEGER DEFAULT 0,
  active_patients INTEGER DEFAULT 0,
  new_patients INTEGER DEFAULT 0,
  consultations_count INTEGER DEFAULT 0,
  reports_generated INTEGER DEFAULT 0,
  
  -- Engagement
  average_patient_engagement DECIMAL(5, 2),
  patients_with_recent_activity INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id, metric_date)
);

-- Professional Reports (Provider-Generated)
CREATE TABLE IF NOT EXISTS provider_professional_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  report_type TEXT NOT NULL CHECK (report_type IN ('assessment', 'progress', 'treatment_plan', 'summary', 'referral')),
  report_title TEXT NOT NULL,
  
  -- Report content
  report_content JSONB NOT NULL,
  findings TEXT[],
  recommendations TEXT[],
  treatment_plan JSONB,
  
  -- Status
  report_status TEXT DEFAULT 'draft' CHECK (report_status IN ('draft', 'final', 'shared', 'archived')),
  is_shared_with_patient BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  
  -- File
  file_url TEXT,
  file_format TEXT CHECK (file_format IN ('pdf', 'docx', 'hl7_fhir')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Treatment Plans
CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  plan_name TEXT NOT NULL,
  plan_description TEXT,
  
  -- Plan details
  plan_data JSONB NOT NULL, -- Structured treatment plan
  goals TEXT[],
  milestones TEXT[],
  timeline_days INTEGER,
  
  -- Status
  plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('draft', 'active', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Progress
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  milestones_completed INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider-Patient Communications
CREATE TABLE IF NOT EXISTS provider_patient_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  communication_type TEXT NOT NULL CHECK (communication_type IN ('message', 'note', 'alert', 'reminder')),
  subject TEXT,
  content TEXT NOT NULL,
  
  -- Direction
  direction TEXT NOT NULL CHECK (direction IN ('provider_to_patient', 'patient_to_provider')),
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  
  -- HIPAA
  is_encrypted BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HIPAA Audit Log
CREATE TABLE IF NOT EXISTS hipaa_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES healthcare_providers(id) ON DELETE SET NULL,
  
  -- Action
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'create', 'update', 'delete', 'export', 'share', 'access_denied')),
  resource_type TEXT NOT NULL, -- 'patient_data', 'report', 'scan', etc.
  resource_id UUID,
  
  -- Details
  action_description TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Result
  action_result TEXT CHECK (action_result IN ('success', 'failure', 'denied')),
  error_message TEXT,
  
  -- HIPAA
  hipaa_category TEXT, -- 'access', 'disclosure', 'modification', 'deletion'
  patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider Subscriptions
CREATE TABLE IF NOT EXISTS provider_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('basic', 'professional', 'enterprise')),
  price_per_month DECIMAL(10, 2) NOT NULL,
  
  -- Stripe
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Features
  max_patients INTEGER,
  max_staff INTEGER,
  features_included JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_user_id ON healthcare_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_providers_status ON healthcare_providers(subscription_status);
CREATE INDEX IF NOT EXISTS idx_provider_staff_provider_id ON provider_staff(provider_id);
CREATE INDEX IF NOT EXISTS idx_patient_provider_relationships_patient_id ON patient_provider_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_provider_relationships_provider_id ON patient_provider_relationships(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_dashboard_metrics_provider_id ON provider_dashboard_metrics(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_professional_reports_provider_id ON provider_professional_reports(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_professional_reports_patient_id ON provider_professional_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_provider_id ON treatment_plans(provider_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_provider_patient_communications_provider_id ON provider_patient_communications(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_patient_communications_patient_id ON provider_patient_communications(patient_id);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_log_user_id ON hipaa_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_log_patient_id ON hipaa_audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_log_created_at ON hipaa_audit_log(created_at);

-- RLS Policies
ALTER TABLE healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_provider_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_dashboard_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_professional_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_patient_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_subscriptions ENABLE ROW LEVEL SECURITY;

-- Healthcare Providers: Users can view their own
CREATE POLICY "Users can view own provider profile"
  ON healthcare_providers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own provider profile"
  ON healthcare_providers FOR ALL
  USING (auth.uid() = user_id);

-- Provider Staff: Staff can view their provider
CREATE POLICY "Staff can view their provider"
  ON provider_staff FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM provider_staff ps
      WHERE ps.provider_id = provider_staff.provider_id
      AND ps.user_id = auth.uid()
    )
  );

-- Patient-Provider Relationships: Patients and providers can view their relationships
CREATE POLICY "Patients and providers can view relationships"
  ON patient_provider_relationships FOR SELECT
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = patient_provider_relationships.provider_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can create relationships"
  ON patient_provider_relationships FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

-- Provider Dashboard Metrics: Providers can view their own
CREATE POLICY "Providers can view own dashboard metrics"
  ON provider_dashboard_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_dashboard_metrics.provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- Provider Professional Reports: Providers and patients can view
CREATE POLICY "Providers and patients can view reports"
  ON provider_professional_reports FOR SELECT
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_professional_reports.provider_id
      AND hp.user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can create reports"
  ON provider_professional_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_professional_reports.provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- Treatment Plans: Providers and patients can view
CREATE POLICY "Providers and patients can view treatment plans"
  ON treatment_plans FOR SELECT
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = treatment_plans.provider_id
      AND hp.user_id = auth.uid()
    )
  );

-- Provider-Patient Communications: Participants can view
CREATE POLICY "Communication participants can view messages"
  ON provider_patient_communications FOR SELECT
  USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id
  );

CREATE POLICY "Users can create communications"
  ON provider_patient_communications FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- HIPAA Audit Log: System and admins only (read-only for most users)
CREATE POLICY "System can create audit logs"
  ON hipaa_audit_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view own audit logs"
  ON hipaa_audit_log FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin')
    )
  );

-- Provider Subscriptions: Providers can view their own
CREATE POLICY "Providers can view own subscriptions"
  ON provider_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM healthcare_providers hp
      WHERE hp.id = provider_subscriptions.provider_id
      AND hp.user_id = auth.uid()
    )
  );



-- END MIGRATION: 20251207000031_healthcare_provider_portal.sql

-- BEGIN MIGRATION: 20251207000032_conversational_ai_enhancement.sql

-- Migration: Conversational AI Enhancement
-- Creates tables for enhanced AI chatbot with voice interaction, multi-modal AI, contextual memory, and emotional intelligence

-- AI Conversation Sessions
CREATE TABLE IF NOT EXISTS ai_conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session details
  session_name TEXT,
  conversation_mode TEXT DEFAULT 'casual' CHECK (conversation_mode IN ('casual', 'expert', 'medical', 'support')),
  language TEXT DEFAULT 'en',
  
  -- Context
  context_summary TEXT, -- Summary of conversation context
  user_preferences JSONB, -- User preferences for AI interaction
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Conversation Messages
CREATE TABLE IF NOT EXISTS ai_conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_conversation_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message content
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'voice', 'image', 'mixed')),
  content_text TEXT,
  content_audio_url TEXT, -- For voice messages
  content_image_url TEXT, -- For image messages
  transcription TEXT, -- For voice messages
  
  -- Sender
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai')),
  
  -- AI metadata
  ai_model_version TEXT,
  ai_confidence DECIMAL(3, 2),
  ai_reasoning TEXT,
  emotional_tone TEXT, -- Detected emotional tone
  sentiment_score DECIMAL(3, 2), -- -1.0 to 1.0
  
  -- Context
  context_references UUID[], -- References to previous messages
  referenced_data JSONB, -- Referenced user data (scans, diary entries, etc.)
  
  -- Proactive suggestions
  proactive_suggestions JSONB, -- AI-generated proactive suggestions
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Contextual Memory
CREATE TABLE IF NOT EXISTS ai_contextual_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Memory content
  memory_type TEXT NOT NULL CHECK (memory_type IN ('preference', 'fact', 'goal', 'concern', 'history')),
  memory_key TEXT NOT NULL, -- Key identifier for the memory
  memory_value JSONB NOT NULL, -- The actual memory data
  
  -- Context
  source_session_id UUID REFERENCES ai_conversation_sessions(id),
  source_message_id UUID REFERENCES ai_conversation_messages(id),
  
  -- Importance
  importance_score DECIMAL(3, 2) DEFAULT 0.5, -- 0.0 to 1.0
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Expiration
  expires_at TIMESTAMPTZ, -- NULL for permanent memories
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, memory_key)
);

-- AI Proactive Suggestions
CREATE TABLE IF NOT EXISTS ai_proactive_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Suggestion details
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('health_tip', 'reminder', 'routine_suggestion', 'data_review', 'goal_check', 'other')),
  suggestion_title TEXT NOT NULL,
  suggestion_content TEXT NOT NULL,
  suggestion_action JSONB, -- Action to take if user accepts
  
  -- AI metadata
  ai_confidence DECIMAL(3, 2),
  ai_reasoning TEXT,
  trigger_condition JSONB, -- What triggered this suggestion
  
  -- Status
  suggestion_status TEXT DEFAULT 'pending' CHECK (suggestion_status IN ('pending', 'shown', 'accepted', 'dismissed', 'expired')),
  shown_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Voice Interactions
CREATE TABLE IF NOT EXISTS ai_voice_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES ai_conversation_sessions(id),
  
  -- Voice data
  audio_url TEXT NOT NULL,
  transcription TEXT,
  language_detected TEXT,
  
  -- Processing
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,
  
  -- Analysis
  emotional_tone TEXT,
  sentiment_score DECIMAL(3, 2),
  keywords_extracted TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Multi-Modal Interactions
CREATE TABLE IF NOT EXISTS ai_multimodal_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES ai_conversation_sessions(id),
  
  -- Input types
  has_text BOOLEAN DEFAULT false,
  has_voice BOOLEAN DEFAULT false,
  has_image BOOLEAN DEFAULT false,
  
  -- Content
  text_content TEXT,
  voice_url TEXT,
  image_url TEXT,
  
  -- AI processing
  ai_analysis JSONB, -- Combined analysis of all modalities
  ai_response TEXT,
  ai_response_audio_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI User Preferences
CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conversation preferences
  preferred_mode TEXT DEFAULT 'casual' CHECK (preferred_mode IN ('casual', 'expert', 'medical', 'support')),
  preferred_language TEXT DEFAULT 'en',
  voice_enabled BOOLEAN DEFAULT false,
  image_analysis_enabled BOOLEAN DEFAULT true,
  
  -- AI behavior
  ai_personality TEXT DEFAULT 'friendly' CHECK (ai_personality IN ('friendly', 'professional', 'casual', 'supportive')),
  ai_response_length TEXT DEFAULT 'medium' CHECK (ai_response_length IN ('short', 'medium', 'detailed')),
  proactive_suggestions_enabled BOOLEAN DEFAULT true,
  
  -- Privacy
  data_sharing_level TEXT DEFAULT 'minimal' CHECK (data_sharing_level IN ('minimal', 'moderate', 'full')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversation_sessions_user_id ON ai_conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_sessions_active ON ai_conversation_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_messages_session_id ON ai_conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_messages_user_id ON ai_conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_contextual_memory_user_id ON ai_contextual_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_contextual_memory_key ON ai_contextual_memory(memory_key);
CREATE INDEX IF NOT EXISTS idx_ai_proactive_suggestions_user_id ON ai_proactive_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_proactive_suggestions_status ON ai_proactive_suggestions(suggestion_status);
CREATE INDEX IF NOT EXISTS idx_ai_voice_interactions_user_id ON ai_voice_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_multimodal_interactions_user_id ON ai_multimodal_interactions(user_id);

-- RLS Policies
ALTER TABLE ai_conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_contextual_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_proactive_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_voice_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_multimodal_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;

-- AI Conversation Sessions: Users can view their own
CREATE POLICY "Users can manage own conversation sessions"
  ON ai_conversation_sessions FOR ALL
  USING (auth.uid() = user_id);

-- AI Conversation Messages: Users can view their own
CREATE POLICY "Users can manage own conversation messages"
  ON ai_conversation_messages FOR ALL
  USING (auth.uid() = user_id);

-- AI Contextual Memory: Users can view their own
CREATE POLICY "Users can manage own contextual memory"
  ON ai_contextual_memory FOR ALL
  USING (auth.uid() = user_id);

-- AI Proactive Suggestions: Users can view their own
CREATE POLICY "Users can manage own proactive suggestions"
  ON ai_proactive_suggestions FOR ALL
  USING (auth.uid() = user_id);

-- AI Voice Interactions: Users can view their own
CREATE POLICY "Users can manage own voice interactions"
  ON ai_voice_interactions FOR ALL
  USING (auth.uid() = user_id);

-- AI Multi-Modal Interactions: Users can view their own
CREATE POLICY "Users can manage own multimodal interactions"
  ON ai_multimodal_interactions FOR ALL
  USING (auth.uid() = user_id);

-- AI User Preferences: Users can view their own
CREATE POLICY "Users can manage own AI preferences"
  ON ai_user_preferences FOR ALL
  USING (auth.uid() = user_id);



-- END MIGRATION: 20251207000032_conversational_ai_enhancement.sql

-- BEGIN MIGRATION: 20251207000033_predictive_health_modeling.sql

-- Migration: Predictive Health Modeling
-- Creates tables for advanced growth predictions, health risk predictions, optimal routine timing, outcome simulations, and long-term forecasting

-- Predictive Models
CREATE TABLE IF NOT EXISTS predictive_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  model_name TEXT NOT NULL UNIQUE,
  model_type TEXT NOT NULL CHECK (model_type IN ('growth_prediction', 'health_risk', 'routine_timing', 'outcome_simulation', 'long_term_forecast')),
  model_version TEXT NOT NULL,
  model_description TEXT,
  
  -- Model configuration
  model_config JSONB NOT NULL,
  input_features TEXT[] NOT NULL,
  output_features TEXT[] NOT NULL,
  
  -- Performance
  accuracy_score DECIMAL(5, 4),
  training_date DATE,
  last_updated DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_production BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Growth Predictions
CREATE TABLE IF NOT EXISTS growth_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES predictive_models(id),
  
  -- Prediction details
  prediction_date DATE NOT NULL,
  prediction_horizon_days INTEGER NOT NULL, -- How far into the future (30, 60, 90, 180, 365)
  
  -- Input data
  input_data JSONB NOT NULL, -- Historical data used for prediction
  
  -- Predictions
  predicted_growth JSONB NOT NULL, -- Predicted measurements over time
  confidence_intervals JSONB, -- Upper and lower bounds
  confidence_level DECIMAL(3, 2) DEFAULT 0.95,
  
  -- Factors
  contributing_factors JSONB, -- What factors contribute to growth
  limiting_factors JSONB, -- What factors limit growth
  
  -- Recommendations
  recommendations TEXT[],
  optimal_routine_suggestions JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Risk Predictions
CREATE TABLE IF NOT EXISTS health_risk_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES predictive_models(id),
  
  -- Risk assessment
  risk_type TEXT NOT NULL CHECK (risk_type IN ('erectile_dysfunction', 'peyronies', 'circulation', 'general_health', 'other')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
  risk_score DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00
  
  -- Prediction
  prediction_horizon_days INTEGER NOT NULL,
  probability DECIMAL(5, 4), -- Probability of risk occurring
  
  -- Factors
  risk_factors JSONB NOT NULL, -- Identified risk factors
  protective_factors JSONB, -- Protective factors
  
  -- Recommendations
  prevention_recommendations TEXT[],
  monitoring_recommendations TEXT[],
  when_to_see_doctor TEXT,
  
  -- Validation
  validated BOOLEAN DEFAULT false,
  validation_date DATE,
  actual_outcome TEXT, -- If risk occurred
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimal Routine Timing Predictions
CREATE TABLE IF NOT EXISTS routine_timing_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES predictive_models(id),
  
  -- Prediction
  prediction_date DATE NOT NULL,
  prediction_period_days INTEGER DEFAULT 30,
  
  -- Optimal timing
  optimal_times JSONB NOT NULL, -- Best times for routines
  optimal_days JSONB, -- Best days of week
  optimal_duration_minutes INTEGER,
  optimal_frequency_per_week DECIMAL(3, 1),
  
  -- Factors
  timing_factors JSONB, -- What affects optimal timing (sleep, stress, etc.)
  
  -- Expected outcomes
  expected_effectiveness DECIMAL(5, 2), -- Expected effectiveness score
  expected_progress JSONB, -- Expected progress if following optimal timing
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outcome Simulations
CREATE TABLE IF NOT EXISTS outcome_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Simulation scenario
  scenario_name TEXT NOT NULL,
  scenario_type TEXT NOT NULL CHECK (scenario_type IN ('routine_change', 'lifestyle_change', 'what_if', 'goal_achievement')),
  
  -- Input parameters
  simulation_parameters JSONB NOT NULL, -- What-if parameters
  baseline_data JSONB NOT NULL, -- Current baseline
  
  -- Simulated outcomes
  simulated_outcomes JSONB NOT NULL, -- Predicted outcomes
  time_horizon_days INTEGER NOT NULL,
  
  -- Comparison
  vs_baseline JSONB, -- Comparison to baseline
  improvement_percentage DECIMAL(5, 2),
  
  -- Recommendations
  recommendations TEXT[],
  action_items TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Long-Term Health Forecasting
CREATE TABLE IF NOT EXISTS long_term_health_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id UUID REFERENCES predictive_models(id),
  
  -- Forecast
  forecast_date DATE NOT NULL,
  forecast_horizon_years INTEGER NOT NULL, -- 1, 2, 5, 10 years
  
  -- Forecasted metrics
  forecasted_metrics JSONB NOT NULL, -- Long-term health metrics
  confidence_intervals JSONB,
  
  -- Trajectories
  best_case_trajectory JSONB,
  worst_case_trajectory JSONB,
  most_likely_trajectory JSONB,
  
  -- Factors
  key_factors JSONB, -- Factors that will influence long-term health
  intervention_opportunities JSONB, -- Opportunities for intervention
  
  -- Recommendations
  long_term_recommendations TEXT[],
  milestone_goals JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- What-If Scenarios
CREATE TABLE IF NOT EXISTS what_if_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scenario
  scenario_name TEXT NOT NULL,
  scenario_description TEXT,
  
  -- What-if parameters
  what_if_parameters JSONB NOT NULL, -- What changes to simulate
  baseline_comparison JSONB, -- Comparison to baseline
  
  -- Simulated outcomes
  simulated_outcomes JSONB NOT NULL,
  time_horizon_days INTEGER NOT NULL,
  
  -- Analysis
  impact_analysis JSONB, -- Impact of the what-if scenario
  feasibility_score DECIMAL(3, 2), -- How feasible is this scenario
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_predictive_models_type ON predictive_models(model_type);
CREATE INDEX IF NOT EXISTS idx_predictive_models_active ON predictive_models(is_active);
CREATE INDEX IF NOT EXISTS idx_growth_predictions_user_id ON growth_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_predictions_date ON growth_predictions(prediction_date);
CREATE INDEX IF NOT EXISTS idx_health_risk_predictions_user_id ON health_risk_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_health_risk_predictions_risk_level ON health_risk_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_routine_timing_predictions_user_id ON routine_timing_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_outcome_simulations_user_id ON outcome_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_long_term_health_forecasts_user_id ON long_term_health_forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_what_if_scenarios_user_id ON what_if_scenarios(user_id);

-- RLS Policies
ALTER TABLE predictive_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_risk_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_timing_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_term_health_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE what_if_scenarios ENABLE ROW LEVEL SECURITY;

-- Predictive Models: All authenticated users can view active models
CREATE POLICY "Authenticated users can view active models"
  ON predictive_models FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- Growth Predictions: Users can view their own
CREATE POLICY "Users can manage own growth predictions"
  ON growth_predictions FOR ALL
  USING (auth.uid() = user_id);

-- Health Risk Predictions: Users can view their own
CREATE POLICY "Users can manage own health risk predictions"
  ON health_risk_predictions FOR ALL
  USING (auth.uid() = user_id);

-- Routine Timing Predictions: Users can view their own
CREATE POLICY "Users can manage own routine timing predictions"
  ON routine_timing_predictions FOR ALL
  USING (auth.uid() = user_id);

-- Outcome Simulations: Users can view their own
CREATE POLICY "Users can manage own outcome simulations"
  ON outcome_simulations FOR ALL
  USING (auth.uid() = user_id);

-- Long-Term Health Forecasts: Users can view their own
CREATE POLICY "Users can manage own long-term forecasts"
  ON long_term_health_forecasts FOR ALL
  USING (auth.uid() = user_id);

-- What-If Scenarios: Users can view their own
CREATE POLICY "Users can manage own what-if scenarios"
  ON what_if_scenarios FOR ALL
  USING (auth.uid() = user_id);



-- END MIGRATION: 20251207000033_predictive_health_modeling.sql

-- BEGIN MIGRATION: 20251207000034_health_app_integrations.sql

-- Migration: Health App Integrations
-- Creates tables for Apple Health, Google Fit, Fitbit, MyFitnessPal, nutrition tracking, and sleep tracking integrations

-- Health App Integrations
CREATE TABLE IF NOT EXISTS health_app_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Integration details
  integration_type TEXT NOT NULL CHECK (integration_type IN ('apple_health', 'google_fit', 'fitbit', 'myfitnesspal', 'nutrition_app', 'sleep_app', 'other')),
  integration_name TEXT NOT NULL,
  
  -- OAuth/API credentials (encrypted)
  access_token_encrypted TEXT, -- Encrypted access token
  refresh_token_encrypted TEXT, -- Encrypted refresh token
  api_key_encrypted TEXT, -- Encrypted API key if needed
  
  -- Connection status
  is_connected BOOLEAN DEFAULT false,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error', 'expired')),
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed')),
  last_error TEXT,
  
  -- Sync settings
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 60,
  sync_data_types TEXT[] NOT NULL, -- What data to sync
  
  -- Permissions
  permissions_granted TEXT[],
  permissions_required TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, integration_type)
);

-- Health Data Sync History
CREATE TABLE IF NOT EXISTS health_data_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES health_app_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Sync details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('import', 'export', 'bidirectional')),
  data_type TEXT NOT NULL, -- 'steps', 'heart_rate', 'sleep', 'nutrition', etc.
  
  -- Sync results
  records_synced INTEGER DEFAULT 0,
  records_added INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Status
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed', 'partial')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Errors
  error_message TEXT,
  error_details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Data Mapping
CREATE TABLE IF NOT EXISTS health_data_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES health_app_integrations(id) ON DELETE CASCADE,
  
  -- Mapping configuration
  source_field TEXT NOT NULL, -- Field from external app
  target_field TEXT NOT NULL, -- Field in our system
  data_type TEXT NOT NULL, -- 'number', 'text', 'date', 'boolean', etc.
  
  -- Transformation
  transformation_rule JSONB, -- How to transform the data
  unit_conversion JSONB, -- Unit conversion rules
  
  -- Validation
  validation_rules JSONB,
  is_required BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Data Conflicts
CREATE TABLE IF NOT EXISTS health_data_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES health_app_integrations(id) ON DELETE CASCADE,
  
  -- Conflict details
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('duplicate', 'mismatch', 'timestamp', 'value')),
  data_type TEXT NOT NULL,
  
  -- Conflicting data
  local_data JSONB NOT NULL,
  external_data JSONB NOT NULL,
  
  -- Resolution
  resolution_strategy TEXT CHECK (resolution_strategy IN ('keep_local', 'keep_external', 'merge', 'manual', 'newest', 'oldest')),
  resolved_data JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Synced Health Data
CREATE TABLE IF NOT EXISTS synced_health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES health_app_integrations(id) ON DELETE CASCADE,
  
  -- Data details
  data_type TEXT NOT NULL,
  external_id TEXT, -- ID from external app
  external_timestamp TIMESTAMPTZ,
  
  -- Data values
  data_values JSONB NOT NULL,
  
  -- Sync metadata
  sync_source TEXT NOT NULL, -- Which app it came from
  sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_merged BOOLEAN DEFAULT false, -- Whether merged with local data
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_app_integrations_user_id ON health_app_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_health_app_integrations_type ON health_app_integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_health_data_sync_history_integration_id ON health_data_sync_history(integration_id);
CREATE INDEX IF NOT EXISTS idx_health_data_sync_history_user_id ON health_data_sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_health_data_mapping_integration_id ON health_data_mapping(integration_id);
CREATE INDEX IF NOT EXISTS idx_health_data_conflicts_user_id ON health_data_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_health_data_conflicts_resolved ON health_data_conflicts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_synced_health_data_user_id ON synced_health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_synced_health_data_integration_id ON synced_health_data(integration_id);

-- RLS Policies
ALTER TABLE health_app_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data_sync_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synced_health_data ENABLE ROW LEVEL SECURITY;

-- Health App Integrations: Users can view their own
CREATE POLICY "Users can manage own health app integrations"
  ON health_app_integrations FOR ALL
  USING (auth.uid() = user_id);

-- Health Data Sync History: Users can view their own
CREATE POLICY "Users can view own sync history"
  ON health_data_sync_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create sync history"
  ON health_data_sync_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Health Data Mapping: Users can view mappings for their integrations
CREATE POLICY "Users can view data mappings"
  ON health_data_mapping FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM health_app_integrations hai
      WHERE hai.id = health_data_mapping.integration_id
      AND hai.user_id = auth.uid()
    )
  );

-- Health Data Conflicts: Users can view their own
CREATE POLICY "Users can manage own data conflicts"
  ON health_data_conflicts FOR ALL
  USING (auth.uid() = user_id);

-- Synced Health Data: Users can view their own
CREATE POLICY "Users can view own synced data"
  ON synced_health_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create synced data"
  ON synced_health_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);



-- END MIGRATION: 20251207000034_health_app_integrations.sql

-- BEGIN MIGRATION: 20251207000035_api_webhooks.sql

-- Migration: API & Webhooks
-- Creates tables for public API, webhook system, API key management, rate limiting, and usage analytics

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Key details
  key_name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE, -- Hashed API key
  api_key_prefix TEXT NOT NULL, -- First 8 chars for display
  
  -- Access tier
  access_tier TEXT DEFAULT 'basic' CHECK (access_tier IN ('basic', 'pro', 'enterprise')),
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Permissions
  allowed_endpoints TEXT[], -- NULL for all endpoints
  allowed_methods TEXT[] DEFAULT ARRAY['GET'], -- GET, POST, PUT, DELETE
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  -- Usage
  total_requests INTEGER DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Usage Analytics
CREATE TABLE IF NOT EXISTS api_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  
  -- Request data
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  ip_address INET,
  user_agent TEXT,
  
  -- Errors
  error_type TEXT,
  error_message TEXT,
  
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Webhook details
  webhook_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT, -- For signature verification
  
  -- Events
  subscribed_events TEXT[] NOT NULL, -- Events to subscribe to
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  
  -- Retry settings
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  
  -- Statistics
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Deliveries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  
  -- Delivery details
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  payload JSONB NOT NULL,
  
  -- Delivery status
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'retrying')),
  http_status_code INTEGER,
  response_body TEXT,
  
  -- Retry
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  
  -- Timestamps
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

-- API Rate Limiting
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  
  -- Rate limit window
  window_type TEXT NOT NULL CHECK (window_type IN ('minute', 'hour', 'day')),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  
  -- Usage
  request_count INTEGER DEFAULT 0,
  is_limit_exceeded BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(api_key_id, window_type, window_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_usage_analytics_api_key_id ON api_usage_analytics(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_analytics_requested_at ON api_usage_analytics(requested_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(delivery_status);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_api_key_id ON api_rate_limits(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON api_rate_limits(window_start, window_end);

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- API Keys: Users can view their own
CREATE POLICY "Users can manage own API keys"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id);

-- API Usage Analytics: Users can view their own
CREATE POLICY "Users can view own API usage"
  ON api_usage_analytics FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM api_keys ak
      WHERE ak.id = api_usage_analytics.api_key_id
      AND ak.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create API usage analytics"
  ON api_usage_analytics FOR INSERT
  WITH CHECK (true);

-- Webhooks: Users can view their own
CREATE POLICY "Users can manage own webhooks"
  ON webhooks FOR ALL
  USING (auth.uid() = user_id);

-- Webhook Deliveries: Users can view deliveries for their webhooks
CREATE POLICY "Users can view own webhook deliveries"
  ON webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      WHERE w.id = webhook_deliveries.webhook_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create webhook deliveries"
  ON webhook_deliveries FOR INSERT
  WITH CHECK (true);

-- API Rate Limits: System can manage
CREATE POLICY "System can manage rate limits"
  ON api_rate_limits FOR ALL
  USING (true);



-- END MIGRATION: 20251207000035_api_webhooks.sql

-- BEGIN MIGRATION: 20251207000036_export_import_enhancements.sql

-- Migration: Enhanced Export & Import System
-- Creates tables for enhanced export (Excel, PDF, CSV, cloud integrations) and import (CSV, Excel, bulk data) systems

-- Export Jobs
CREATE TABLE IF NOT EXISTS export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Export details
  export_type TEXT NOT NULL CHECK (export_type IN ('excel', 'pdf', 'csv', 'json', 'hl7_fhir', 'google_sheets', 'onedrive', 'dropbox', 'email')),
  export_name TEXT NOT NULL,
  
  -- Export configuration
  export_config JSONB NOT NULL, -- What data to export, date ranges, etc.
  data_sources TEXT[] NOT NULL,
  
  -- Status
  export_status TEXT DEFAULT 'pending' CHECK (export_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- File details
  file_url TEXT,
  file_format TEXT,
  file_size_bytes INTEGER,
  file_name TEXT,
  
  -- Cloud integration
  cloud_service TEXT, -- 'google_sheets', 'onedrive', 'dropbox'
  cloud_file_id TEXT, -- ID of file in cloud service
  cloud_file_url TEXT,
  
  -- Email export
  email_recipients TEXT[],
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Export Templates
CREATE TABLE IF NOT EXISTS export_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for system templates
  
  template_name TEXT NOT NULL,
  template_description TEXT,
  export_type TEXT NOT NULL,
  
  -- Template configuration
  template_config JSONB NOT NULL, -- Layout, fields, formatting, etc.
  is_system_template BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import Jobs
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Import details
  import_type TEXT NOT NULL CHECK (import_type IN ('csv', 'excel', 'json', 'other_app', 'bulk')),
  import_name TEXT NOT NULL,
  source_app TEXT, -- If importing from another app
  
  -- File details
  file_url TEXT,
  file_name TEXT,
  file_size_bytes INTEGER,
  file_format TEXT,
  
  -- Import configuration
  import_config JSONB NOT NULL, -- Mapping, validation rules, etc.
  data_mapping JSONB, -- How to map imported data
  
  -- Status
  import_status TEXT DEFAULT 'pending' CHECK (import_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- Results
  records_total INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  
  -- Validation
  validation_errors JSONB,
  import_errors JSONB,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import History
CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Imported record
  record_type TEXT NOT NULL, -- Type of data imported
  record_id UUID, -- ID of created/updated record
  external_id TEXT, -- ID from source system
  
  -- Status
  import_status TEXT CHECK (import_status IN ('success', 'failed', 'skipped', 'duplicate')),
  error_message TEXT,
  
  -- Data
  imported_data JSONB,
  
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cloud Service Connections
CREATE TABLE IF NOT EXISTS cloud_service_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Service details
  service_type TEXT NOT NULL CHECK (service_type IN ('google_drive', 'google_sheets', 'onedrive', 'dropbox', 'other')),
  service_name TEXT NOT NULL,
  
  -- OAuth credentials (encrypted)
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  
  -- Connection status
  is_connected BOOLEAN DEFAULT false,
  connection_status TEXT DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  
  -- Permissions
  permissions_granted TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, service_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_export_jobs_user_id ON export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON export_jobs(export_status);
CREATE INDEX IF NOT EXISTS idx_export_templates_user_id ON export_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_user_id ON import_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(import_status);
CREATE INDEX IF NOT EXISTS idx_import_history_import_job_id ON import_history(import_job_id);
CREATE INDEX IF NOT EXISTS idx_import_history_user_id ON import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_service_connections_user_id ON cloud_service_connections(user_id);

-- RLS Policies
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_service_connections ENABLE ROW LEVEL SECURITY;

-- Export Jobs: Users can view their own
CREATE POLICY "Users can manage own export jobs"
  ON export_jobs FOR ALL
  USING (auth.uid() = user_id);

-- Export Templates: Users can view public and own
CREATE POLICY "Users can view public and own templates"
  ON export_templates FOR SELECT
  USING (is_public = true OR auth.uid() = user_id OR is_system_template = true);

CREATE POLICY "Users can create own templates"
  ON export_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Import Jobs: Users can view their own
CREATE POLICY "Users can manage own import jobs"
  ON import_jobs FOR ALL
  USING (auth.uid() = user_id);

-- Import History: Users can view their own
CREATE POLICY "Users can view own import history"
  ON import_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create import history"
  ON import_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cloud Service Connections: Users can view their own
CREATE POLICY "Users can manage own cloud connections"
  ON cloud_service_connections FOR ALL
  USING (auth.uid() = user_id);



-- END MIGRATION: 20251207000036_export_import_enhancements.sql

-- BEGIN MIGRATION: 20251207000037_mobile_wearable_features.sql

-- Migration: Advanced Mobile Features & Wearable Integration
-- Creates tables for mobile widgets, app shortcuts, haptic feedback, background processing, and wearable device integration

-- Mobile Widget Configurations
CREATE TABLE IF NOT EXISTS mobile_widget_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Widget details
  widget_type TEXT NOT NULL CHECK (widget_type IN ('scanner_quick', 'health_summary', 'progress_tracker', 'routine_reminder', 'custom')),
  widget_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'both')),
  
  -- Widget configuration
  widget_config JSONB NOT NULL, -- Size, position, data to display, etc.
  refresh_frequency_minutes INTEGER DEFAULT 15,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Shortcuts
CREATE TABLE IF NOT EXISTS app_shortcuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Shortcut details
  shortcut_type TEXT NOT NULL CHECK (shortcut_type IN ('scan', 'diary_entry', 'routine_start', 'quick_action', 'custom')),
  shortcut_name TEXT NOT NULL,
  shortcut_icon TEXT,
  shortcut_action JSONB NOT NULL, -- What action to perform
  
  -- Platform
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'both')),
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Haptic Feedback Preferences
CREATE TABLE IF NOT EXISTS haptic_feedback_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Preferences
  haptic_enabled BOOLEAN DEFAULT true,
  haptic_intensity TEXT DEFAULT 'medium' CHECK (haptic_intensity IN ('light', 'medium', 'strong')),
  
  -- Event-specific settings
  haptic_patterns JSONB NOT NULL, -- Different patterns for different events
  
  -- Battery optimization
  disable_on_low_battery BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Background Processing Jobs
CREATE TABLE IF NOT EXISTS background_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Job details
  job_type TEXT NOT NULL CHECK (job_type IN ('scan_processing', 'data_sync', 'analytics', 'notification', 'backup')),
  job_name TEXT NOT NULL,
  
  -- Scheduling
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('immediate', 'scheduled', 'recurring')),
  scheduled_at TIMESTAMPTZ,
  recurrence_pattern TEXT, -- Cron-like pattern
  
  -- Status
  job_status TEXT DEFAULT 'pending' CHECK (job_status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- Execution
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Battery optimization
  requires_charging BOOLEAN DEFAULT false,
  requires_wifi BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wearable Devices
CREATE TABLE IF NOT EXISTS wearable_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Device details
  device_type TEXT NOT NULL CHECK (device_type IN ('apple_watch', 'wear_os', 'fitbit', 'other')),
  device_name TEXT NOT NULL,
  device_model TEXT,
  device_identifier TEXT UNIQUE, -- Unique device identifier
  
  -- Connection
  is_connected BOOLEAN DEFAULT false,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  last_connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  
  -- Capabilities
  capabilities JSONB, -- What the device can do (heart rate, notifications, etc.)
  
  -- Settings
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 5,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wearable Data Sync
CREATE TABLE IF NOT EXISTS wearable_data_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wearable_id UUID NOT NULL REFERENCES wearable_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Sync details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('health_data', 'notification', 'reminder', 'quick_action')),
  data_type TEXT NOT NULL,
  
  -- Data
  synced_data JSONB NOT NULL,
  
  -- Direction
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('to_wearable', 'from_wearable', 'bidirectional')),
  
  -- Status
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wearable Notifications
CREATE TABLE IF NOT EXISTS wearable_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wearable_id UUID REFERENCES wearable_devices(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'alert', 'achievement', 'routine', 'health_alert')),
  notification_title TEXT NOT NULL,
  notification_body TEXT NOT NULL,
  
  -- Delivery
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'dismissed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  -- Action
  action_data JSONB, -- Action to take if user interacts
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location-Based Features
CREATE TABLE IF NOT EXISTS location_based_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Feature details
  feature_type TEXT NOT NULL CHECK (feature_type IN ('reminder', 'doctor_finder', 'content', 'geofence')),
  feature_name TEXT NOT NULL,
  
  -- Location
  location_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius_meters INTEGER, -- For geofencing
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  trigger_on_enter BOOLEAN DEFAULT true,
  trigger_on_exit BOOLEAN DEFAULT false,
  
  -- Action
  action_data JSONB NOT NULL, -- What to do when triggered
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mobile_widget_configurations_user_id ON mobile_widget_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_app_shortcuts_user_id ON app_shortcuts(user_id);
CREATE INDEX IF NOT EXISTS idx_haptic_feedback_preferences_user_id ON haptic_feedback_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_background_processing_jobs_user_id ON background_processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_background_processing_jobs_status ON background_processing_jobs(job_status);
CREATE INDEX IF NOT EXISTS idx_wearable_devices_user_id ON wearable_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_data_sync_wearable_id ON wearable_data_sync(wearable_id);
CREATE INDEX IF NOT EXISTS idx_wearable_data_sync_user_id ON wearable_data_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_notifications_user_id ON wearable_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_location_based_features_user_id ON location_based_features(user_id);

-- RLS Policies
ALTER TABLE mobile_widget_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE haptic_feedback_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_based_features ENABLE ROW LEVEL SECURITY;

-- Mobile Widget Configurations: Users can view their own
CREATE POLICY "Users can manage own widget configurations"
  ON mobile_widget_configurations FOR ALL
  USING (auth.uid() = user_id);

-- App Shortcuts: Users can view their own
CREATE POLICY "Users can manage own app shortcuts"
  ON app_shortcuts FOR ALL
  USING (auth.uid() = user_id);

-- Haptic Feedback Preferences: Users can view their own
CREATE POLICY "Users can manage own haptic preferences"
  ON haptic_feedback_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Background Processing Jobs: Users can view their own
CREATE POLICY "Users can manage own background jobs"
  ON background_processing_jobs FOR ALL
  USING (auth.uid() = user_id);

-- Wearable Devices: Users can view their own
CREATE POLICY "Users can manage own wearable devices"
  ON wearable_devices FOR ALL
  USING (auth.uid() = user_id);

-- Wearable Data Sync: Users can view their own
CREATE POLICY "Users can view own wearable sync data"
  ON wearable_data_sync FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create wearable sync data"
  ON wearable_data_sync FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Wearable Notifications: Users can view their own
CREATE POLICY "Users can manage own wearable notifications"
  ON wearable_notifications FOR ALL
  USING (auth.uid() = user_id);

-- Location-Based Features: Users can view their own
CREATE POLICY "Users can manage own location features"
  ON location_based_features FOR ALL
  USING (auth.uid() = user_id);



-- END MIGRATION: 20251207000037_mobile_wearable_features.sql

-- BEGIN MIGRATION: 20251207000038_security_privacy_enhancements.sql

-- Migration: Advanced Security & Privacy Enhancements
-- Creates tables for 2FA, biometric auth, session management, device management, security alerts, E2E encryption, and privacy controls

-- Two-Factor Authentication
CREATE TABLE IF NOT EXISTS two_factor_authentication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 2FA method
  method TEXT NOT NULL CHECK (method IN ('totp', 'sms', 'email', 'backup_codes')),
  
  -- TOTP
  totp_secret_encrypted TEXT,
  totp_backup_codes_encrypted TEXT[],
  
  -- SMS/Email
  phone_number_encrypted TEXT,
  email_address TEXT,
  
  -- Status
  is_enabled BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  
  -- Recovery
  recovery_codes_encrypted TEXT[],
  recovery_codes_used TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, method)
);

-- Biometric Authentication
CREATE TABLE IF NOT EXISTS biometric_authentication (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Biometric type
  biometric_type TEXT NOT NULL CHECK (biometric_type IN ('fingerprint', 'face_id', 'touch_id', 'iris', 'voice')),
  
  -- Device
  device_id TEXT NOT NULL,
  device_name TEXT,
  
  -- Status
  is_enabled BOOLEAN DEFAULT false,
  is_registered BOOLEAN DEFAULT false,
  registered_at TIMESTAMPTZ,
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, device_id, biometric_type)
);

-- Active Sessions
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session details
  session_token_hash TEXT NOT NULL UNIQUE,
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'wearable', 'other')),
  platform TEXT,
  browser TEXT,
  
  -- Location
  ip_address INET,
  location_country TEXT,
  location_city TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_current_session BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

-- Device Management
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Device details
  device_name TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'wearable', 'other')),
  device_identifier TEXT NOT NULL UNIQUE,
  platform TEXT,
  os_version TEXT,
  app_version TEXT,
  
  -- Trust
  is_trusted BOOLEAN DEFAULT false,
  trusted_at TIMESTAMPTZ,
  trust_level TEXT DEFAULT 'unknown' CHECK (trust_level IN ('unknown', 'low', 'medium', 'high', 'verified')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Security
  has_biometric BOOLEAN DEFAULT false,
  has_pin BOOLEAN DEFAULT false,
  encryption_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Alerts
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('login_attempt', 'password_change', 'device_added', 'suspicious_activity', 'data_export', 'permission_change', 'other')),
  alert_severity TEXT DEFAULT 'medium' CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')),
  alert_title TEXT NOT NULL,
  alert_message TEXT NOT NULL,
  
  -- Context
  ip_address INET,
  device_id UUID REFERENCES user_devices(id),
  location_country TEXT,
  location_city TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  
  -- Action
  action_taken TEXT,
  action_data JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login History
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Login details
  login_method TEXT NOT NULL CHECK (login_method IN ('password', 'biometric', '2fa', 'oauth', 'magic_link')),
  login_status TEXT NOT NULL CHECK (login_status IN ('success', 'failed', 'blocked')),
  
  -- Device & Location
  device_id UUID REFERENCES user_devices(id),
  ip_address INET,
  user_agent TEXT,
  location_country TEXT,
  location_city TEXT,
  
  -- Security
  is_suspicious BOOLEAN DEFAULT false,
  suspicious_reasons TEXT[],
  
  -- Failure details
  failure_reason TEXT,
  
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- End-to-End Encryption Keys
CREATE TABLE IF NOT EXISTS e2e_encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Key details
  key_type TEXT NOT NULL CHECK (key_type IN ('master_key', 'data_key', 'recovery_key')),
  key_encrypted TEXT NOT NULL, -- Encrypted with user's password
  key_hash TEXT NOT NULL UNIQUE,
  
  -- Key metadata
  key_version INTEGER DEFAULT 1,
  algorithm TEXT DEFAULT 'AES-256-GCM',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_recovery BOOLEAN DEFAULT false,
  
  -- Usage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  rotated_at TIMESTAMPTZ
);

-- Privacy Controls
CREATE TABLE IF NOT EXISTS privacy_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Data sharing
  share_analytics BOOLEAN DEFAULT false,
  share_usage_data BOOLEAN DEFAULT false,
  share_location_data BOOLEAN DEFAULT false,
  
  -- Anonymization
  anonymize_data BOOLEAN DEFAULT false,
  anonymization_level TEXT DEFAULT 'none' CHECK (anonymization_level IN ('none', 'partial', 'full')),
  
  -- Data retention
  auto_delete_enabled BOOLEAN DEFAULT false,
  retention_period_days INTEGER,
  
  -- Visibility
  profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('public', 'friends', 'private')),
  show_in_search BOOLEAN DEFAULT false,
  
  -- GDPR
  gdpr_consent_given BOOLEAN DEFAULT false,
  gdpr_consent_date DATE,
  data_processing_consent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Privacy Audit Log
CREATE TABLE IF NOT EXISTS privacy_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Action
  action_type TEXT NOT NULL CHECK (action_type IN ('data_access', 'data_export', 'data_deletion', 'consent_change', 'privacy_setting_change', 'data_anonymization')),
  action_description TEXT NOT NULL,
  
  -- Data involved
  data_types TEXT[],
  data_count INTEGER,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  
  -- Result
  action_result TEXT CHECK (action_result IN ('success', 'failure', 'partial')),
  
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_two_factor_authentication_user_id ON two_factor_authentication(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_authentication_user_id ON biometric_authentication(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_active ON active_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_identifier ON user_devices(device_identifier);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_id ON security_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_read ON security_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_logged_at ON login_history(logged_at);
CREATE INDEX IF NOT EXISTS idx_e2e_encryption_keys_user_id ON e2e_encryption_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_controls_user_id ON privacy_controls(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_user_id ON privacy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_performed_at ON privacy_audit_log(performed_at);

-- RLS Policies
ALTER TABLE two_factor_authentication ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_authentication ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE e2e_encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_audit_log ENABLE ROW LEVEL SECURITY;

-- Two-Factor Authentication: Users can view their own
CREATE POLICY "Users can manage own 2FA"
  ON two_factor_authentication FOR ALL
  USING (auth.uid() = user_id);

-- Biometric Authentication: Users can view their own
CREATE POLICY "Users can manage own biometric auth"
  ON biometric_authentication FOR ALL
  USING (auth.uid() = user_id);

-- Active Sessions: Users can view their own
CREATE POLICY "Users can manage own sessions"
  ON active_sessions FOR ALL
  USING (auth.uid() = user_id);

-- User Devices: Users can view their own
CREATE POLICY "Users can manage own devices"
  ON user_devices FOR ALL
  USING (auth.uid() = user_id);

-- Security Alerts: Users can view their own
CREATE POLICY "Users can manage own security alerts"
  ON security_alerts FOR ALL
  USING (auth.uid() = user_id);

-- Login History: Users can view their own
CREATE POLICY "Users can view own login history"
  ON login_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create login history"
  ON login_history FOR INSERT
  WITH CHECK (true);

-- E2E Encryption Keys: Users can view their own
CREATE POLICY "Users can manage own encryption keys"
  ON e2e_encryption_keys FOR ALL
  USING (auth.uid() = user_id);

-- Privacy Controls: Users can view their own
CREATE POLICY "Users can manage own privacy controls"
  ON privacy_controls FOR ALL
  USING (auth.uid() = user_id);

-- Privacy Audit Log: Users can view their own
CREATE POLICY "Users can view own privacy audit log"
  ON privacy_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create privacy audit log"
  ON privacy_audit_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);



-- END MIGRATION: 20251207000038_security_privacy_enhancements.sql

-- BEGIN MIGRATION: 20251207000039_nsfw_advanced_features.sql

-- Migration: NSFW Advanced Features
-- Creates tables for pornmd.com integration, multi-camera recording, partner sync video, intimate date planning, and seductive AI chat

-- PornMD Integration
CREATE TABLE IF NOT EXISTS pornmd_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Integration status
  is_enabled BOOLEAN DEFAULT false,
  is_partner BOOLEAN DEFAULT false,
  partner_tier TEXT CHECK (partner_tier IN ('sponsor', 'premium', 'standard')),
  
  -- API credentials (encrypted)
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  
  -- Preferences
  content_preferences JSONB, -- Categories, tags, etc.
  sync_enabled BOOLEAN DEFAULT false,
  
  -- Usage
  last_sync_at TIMESTAMPTZ,
  sync_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Multi-Camera Recording Sessions
CREATE TABLE IF NOT EXISTS multi_camera_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Session details
  session_name TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('solo', 'partner_sync', 'multi_camera')),
  
  -- Recording status
  recording_status TEXT DEFAULT 'draft' CHECK (recording_status IN ('draft', 'recording', 'paused', 'completed', 'editing', 'published')),
  
  -- Settings
  camera_count INTEGER DEFAULT 1,
  sync_enabled BOOLEAN DEFAULT false,
  quality TEXT DEFAULT '1080p' CHECK (quality IN ('720p', '1080p', '4k')),
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Privacy
  is_private BOOLEAN DEFAULT true,
  share_with_partner BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Camera Streams
CREATE TABLE IF NOT EXISTS camera_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES multi_camera_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Camera details
  camera_index INTEGER NOT NULL,
  camera_name TEXT,
  device_id TEXT,
  device_type TEXT CHECK (device_type IN ('webcam', 'phone', 'tablet', 'external', 'partner_device')),
  
  -- Stream status
  is_active BOOLEAN DEFAULT false,
  is_recording BOOLEAN DEFAULT false,
  
  -- Video file
  video_url TEXT,
  video_storage_path TEXT,
  video_duration_seconds INTEGER,
  video_size_bytes BIGINT,
  
  -- Metadata
  resolution_width INTEGER,
  resolution_height INTEGER,
  fps INTEGER,
  codec TEXT,
  
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Recordings
CREATE TABLE IF NOT EXISTS video_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES multi_camera_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Recording details
  recording_name TEXT NOT NULL,
  recording_type TEXT DEFAULT 'multi_camera' CHECK (recording_type IN ('single', 'multi_camera', 'partner_sync')),
  
  -- Video file
  video_url TEXT,
  video_storage_path TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  
  -- Quality
  resolution_width INTEGER,
  resolution_height INTEGER,
  fps INTEGER,
  codec TEXT,
  
  -- Editing
  is_edited BOOLEAN DEFAULT false,
  edit_version INTEGER DEFAULT 1,
  original_recording_id UUID REFERENCES video_recordings(id),
  
  -- Privacy
  is_private BOOLEAN DEFAULT true,
  share_with_partner BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Edits
CREATE TABLE IF NOT EXISTS video_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES video_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Edit details
  edit_name TEXT,
  edit_type TEXT NOT NULL CHECK (edit_type IN ('cut', 'merge', 'transition', 'mask', 'track', 'camera_switch', 'filter', 'effect', 'audio', 'other')),
  
  -- Edit data
  edit_config JSONB NOT NULL, -- Start time, end time, effects, transitions, etc.
  camera_switches JSONB, -- Camera switching points and transitions
  masking_data JSONB, -- Masking and tracking data
  transitions JSONB, -- Transition effects between cameras
  
  -- Result
  edited_video_url TEXT,
  edited_video_storage_path TEXT,
  preview_url TEXT,
  
  -- Status
  edit_status TEXT DEFAULT 'pending' CHECK (edit_status IN ('pending', 'processing', 'completed', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Screenshots
CREATE TABLE IF NOT EXISTS video_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES video_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Screenshot details
  screenshot_name TEXT,
  timestamp_seconds DECIMAL(10, 3) NOT NULL, -- Exact timestamp in video
  
  -- Image file
  image_url TEXT,
  image_storage_path TEXT,
  thumbnail_url TEXT,
  
  -- Editing
  is_edited BOOLEAN DEFAULT false,
  edit_data JSONB, -- Crop, filters, adjustments, etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intimate Date Proposals
CREATE TABLE IF NOT EXISTS intimate_date_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Proposal details
  proposal_title TEXT NOT NULL,
  proposal_type TEXT DEFAULT 'custom' CHECK (proposal_type IN ('template', 'custom', 'quick')),
  template_id UUID, -- If using a template
  
  -- Date & Time
  proposed_date DATE NOT NULL,
  proposed_time TIME NOT NULL,
  duration_minutes INTEGER,
  
  -- Location
  location_name TEXT,
  location_address TEXT,
  location_type TEXT CHECK (location_type IN ('home', 'hotel', 'outdoor', 'other')),
  is_location_private BOOLEAN DEFAULT true,
  
  -- Activities
  activities JSONB NOT NULL, -- Array of activities/positions
  specialty_intimacy TEXT[],
  special_requests TEXT,
  
  -- Media
  voice_message_url TEXT,
  voice_message_duration_seconds INTEGER,
  images_urls TEXT[],
  gifs_urls TEXT[],
  videos_urls TEXT[],
  links TEXT[],
  
  -- Message
  text_message TEXT,
  adult_emojis TEXT[], -- Emoji codes
  
  -- Status
  proposal_status TEXT DEFAULT 'pending' CHECK (proposal_status IN ('pending', 'reviewed', 'accepted', 'declined', 'modified', 'resubmitted')),
  
  -- Partner response
  partner_response TEXT,
  partner_modified_date DATE,
  partner_modified_time TIME,
  partner_suggestions TEXT,
  partner_media_urls TEXT[],
  
  -- Timestamps
  reviewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intimate Date Templates
CREATE TABLE IF NOT EXISTS intimate_date_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Template details
  template_name TEXT NOT NULL,
  template_category TEXT CHECK (template_category IN ('romantic', 'passionate', 'adventurous', 'kinky', 'quick', 'custom')),
  is_public BOOLEAN DEFAULT false,
  
  -- Template content
  default_activities JSONB NOT NULL,
  default_positions TEXT[],
  default_duration_minutes INTEGER,
  default_location_type TEXT,
  
  -- Template message
  default_message TEXT,
  default_voice_script TEXT,
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seductive AI Chat Sessions
CREATE TABLE IF NOT EXISTS seductive_ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Session details
  session_name TEXT,
  session_type TEXT DEFAULT 'solo' CHECK (session_type IN ('solo', 'partner', 'group')),
  
  -- AI settings
  ai_personality TEXT DEFAULT 'seductive' CHECK (ai_personality IN ('seductive', 'flirty', 'dirty', 'nasty', 'romantic', 'kinky', 'custom')),
  ai_intensity TEXT DEFAULT 'medium' CHECK (ai_intensity IN ('light', 'medium', 'strong', 'extreme')),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seductive AI Messages
CREATE TABLE IF NOT EXISTS seductive_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES seductive_ai_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message details
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'ai', 'system')),
  message_content TEXT NOT NULL,
  
  -- Media
  images_urls TEXT[],
  gifs_urls TEXT[],
  videos_urls TEXT[],
  voice_message_url TEXT,
  adult_emojis TEXT[],
  
  -- AI metadata
  ai_confidence DECIMAL(5, 2), -- 0-100
  ai_sentiment TEXT,
  ai_suggestions TEXT[],
  
  -- Context
  context_data JSONB, -- Previous messages context for AI
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sex Positions Library
CREATE TABLE IF NOT EXISTS sex_positions_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Position details
  position_name TEXT NOT NULL UNIQUE,
  position_category TEXT CHECK (position_category IN ('basic', 'advanced', 'kinky', 'romantic', 'adventurous', 'acrobatic')),
  difficulty_level TEXT DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
  
  -- Description
  description TEXT,
  instructions TEXT[],
  tips TEXT[],
  
  -- Media
  image_url TEXT,
  video_url TEXT,
  gif_url TEXT,
  
  -- Metadata
  popularity_score INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Saved Positions
CREATE TABLE IF NOT EXISTS user_saved_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES sex_positions_library(id) ON DELETE CASCADE,
  
  -- User notes
  personal_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  tried BOOLEAN DEFAULT false,
  favorite BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, position_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pornmd_integration_user_id ON pornmd_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_camera_sessions_user_id ON multi_camera_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_camera_sessions_partner_id ON multi_camera_sessions(partner_id);
CREATE INDEX IF NOT EXISTS idx_camera_streams_session_id ON camera_streams(session_id);
CREATE INDEX IF NOT EXISTS idx_camera_streams_user_id ON camera_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_session_id ON video_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_user_id ON video_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_video_edits_recording_id ON video_edits(recording_id);
CREATE INDEX IF NOT EXISTS idx_video_screenshots_recording_id ON video_screenshots(recording_id);
CREATE INDEX IF NOT EXISTS idx_intimate_date_proposals_creator_id ON intimate_date_proposals(creator_id);
CREATE INDEX IF NOT EXISTS idx_intimate_date_proposals_partner_id ON intimate_date_proposals(partner_id);
CREATE INDEX IF NOT EXISTS idx_intimate_date_proposals_status ON intimate_date_proposals(proposal_status);
CREATE INDEX IF NOT EXISTS idx_seductive_ai_sessions_user_id ON seductive_ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_seductive_ai_messages_session_id ON seductive_ai_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_positions_user_id ON user_saved_positions(user_id);

-- RLS Policies
ALTER TABLE pornmd_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_camera_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE camera_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimate_date_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE intimate_date_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE seductive_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seductive_ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sex_positions_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_positions ENABLE ROW LEVEL SECURITY;

-- PornMD Integration: Users can manage their own
CREATE POLICY "Users can manage own pornmd integration"
  ON pornmd_integration FOR ALL
  USING (auth.uid() = user_id);

-- Multi-Camera Sessions: Users can manage their own and view partner sessions
CREATE POLICY "Users can manage own multi-camera sessions"
  ON multi_camera_sessions FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Camera Streams: Users can manage their own
CREATE POLICY "Users can manage own camera streams"
  ON camera_streams FOR ALL
  USING (auth.uid() = user_id);

-- Video Recordings: Users can manage their own and view partner recordings
CREATE POLICY "Users can manage own video recordings"
  ON video_recordings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view partner recordings"
  ON video_recordings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM video_recordings vr
      JOIN multi_camera_sessions mcs ON vr.session_id = mcs.id
      WHERE vr.id = video_recordings.id
      AND (mcs.user_id = auth.uid() OR mcs.partner_id = auth.uid())
      AND mcs.share_with_partner = true
    )
  );

-- Video Edits: Users can manage their own
CREATE POLICY "Users can manage own video edits"
  ON video_edits FOR ALL
  USING (auth.uid() = user_id);

-- Video Screenshots: Users can manage their own
CREATE POLICY "Users can manage own video screenshots"
  ON video_screenshots FOR ALL
  USING (auth.uid() = user_id);

-- Intimate Date Proposals: Users can manage their own and view partner proposals
CREATE POLICY "Users can manage own intimate date proposals"
  ON intimate_date_proposals FOR ALL
  USING (auth.uid() = creator_id OR auth.uid() = partner_id);

-- Intimate Date Templates: Users can view public templates and manage their own
CREATE POLICY "Users can view public templates"
  ON intimate_date_templates FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own templates"
  ON intimate_date_templates FOR ALL
  USING (auth.uid() = user_id);

-- Seductive AI Sessions: Users can manage their own
CREATE POLICY "Users can manage own seductive AI sessions"
  ON seductive_ai_sessions FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = partner_id);

-- Seductive AI Messages: Users can view their session messages
CREATE POLICY "Users can view own seductive AI messages"
  ON seductive_ai_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM seductive_ai_sessions sas
      WHERE sas.id = seductive_ai_messages.session_id
      AND (sas.user_id = auth.uid() OR sas.partner_id = auth.uid())
    )
  );

CREATE POLICY "Users can create seductive AI messages"
  ON seductive_ai_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sex Positions Library: All authenticated users can view
CREATE POLICY "Authenticated users can view sex positions library"
  ON sex_positions_library FOR SELECT
  USING (auth.role() = 'authenticated');

-- User Saved Positions: Users can manage their own
CREATE POLICY "Users can manage own saved positions"
  ON user_saved_positions FOR ALL
  USING (auth.uid() = user_id);



-- END MIGRATION: 20251207000039_nsfw_advanced_features.sql

-- BEGIN MIGRATION: 20251207000040_expert_content_consultations.sql

-- Migration: Expert Content & Consultations System
-- Creates tables for expert profiles, content, Q&A, live consultations, workshops, bookings, and ratings

-- Expert Profiles
CREATE TABLE IF NOT EXISTS expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Expert details
  expert_name TEXT NOT NULL,
  expert_title TEXT NOT NULL, -- e.g., "Certified Sex Therapist", "Intimacy Coach"
  bio TEXT,
  specialties TEXT[] NOT NULL, -- Array of specialties
  credentials TEXT[], -- Certifications, degrees, etc.
  years_experience INTEGER,
  
  -- Media
  profile_image_url TEXT,
  cover_image_url TEXT,
  video_intro_url TEXT,
  
  -- Contact & Availability
  email TEXT,
  website_url TEXT,
  social_media_links JSONB, -- LinkedIn, Twitter, etc.
  timezone TEXT DEFAULT 'UTC',
  availability_schedule JSONB, -- Weekly schedule
  
  -- Pricing
  consultation_rate_per_hour DECIMAL(10, 2) NOT NULL,
  workshop_rate_per_person DECIMAL(10, 2),
  group_workshop_rate DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  
  -- Status
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  verification_date DATE,
  
  -- Statistics
  total_consultations INTEGER DEFAULT 0,
  total_workshops INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Expert Articles
CREATE TABLE IF NOT EXISTS expert_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  
  -- Article details
  article_title TEXT NOT NULL,
  article_slug TEXT NOT NULL UNIQUE,
  article_content TEXT NOT NULL,
  excerpt TEXT,
  
  -- Categories
  category TEXT NOT NULL,
  tags TEXT[],
  
  -- Media
  featured_image_url TEXT,
  video_url TEXT,
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Videos
CREATE TABLE IF NOT EXISTS expert_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  
  -- Video details
  video_title TEXT NOT NULL,
  video_description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  
  -- Categories
  category TEXT NOT NULL,
  tags TEXT[],
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_free_preview BOOLEAN DEFAULT false,
  preview_duration_seconds INTEGER, -- Free preview length
  
  -- Pricing
  price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Q&A
CREATE TABLE IF NOT EXISTS expert_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Question
  question_text TEXT NOT NULL,
  question_category TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Answer
  answer_text TEXT,
  answered_at TIMESTAMPTZ,
  
  -- Status
  is_answered BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  
  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultation Bookings
CREATE TABLE IF NOT EXISTS consultation_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Booking details
  booking_type TEXT NOT NULL CHECK (booking_type IN ('individual', 'couple', 'group')),
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('live_video', 'live_audio', 'chat', 'email')),
  
  -- Schedule
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  timezone TEXT,
  
  -- Status
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Details
  topic TEXT,
  concerns TEXT,
  goals TEXT,
  preferred_approach TEXT,
  
  -- Payment
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_intent_id TEXT,
  
  -- Session
  session_url TEXT, -- Video/audio call link
  session_recording_url TEXT, -- If recorded
  session_notes TEXT, -- Expert notes
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_scheduled_at TIMESTAMPTZ,
  
  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop Bookings
CREATE TABLE IF NOT EXISTS workshop_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL, -- References workshop (would be in separate table)
  
  -- Booking details
  workshop_title TEXT NOT NULL,
  workshop_type TEXT NOT NULL CHECK (workshop_type IN ('live', 'recorded', 'hybrid')),
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  
  -- Schedule
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  timezone TEXT,
  
  -- Status
  booking_status TEXT DEFAULT 'open' CHECK (booking_status IN ('open', 'full', 'in_progress', 'completed', 'cancelled')),
  
  -- Pricing
  price_per_person DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Session
  session_url TEXT,
  session_recording_url TEXT,
  materials_url TEXT, -- Workshop materials download
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop Participants
CREATE TABLE IF NOT EXISTS workshop_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_booking_id UUID NOT NULL REFERENCES workshop_bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment
  amount_paid DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_intent_id TEXT,
  
  -- Attendance
  attended BOOLEAN DEFAULT false,
  attendance_notes TEXT,
  
  -- Feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(workshop_booking_id, user_id)
);

-- Expert Ratings & Reviews
CREATE TABLE IF NOT EXISTS expert_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES consultation_bookings(id) ON DELETE SET NULL,
  workshop_id UUID REFERENCES workshop_bookings(id) ON DELETE SET NULL,
  
  -- Rating
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  helpfulness_rating INTEGER CHECK (helpfulness_rating >= 1 AND helpfulness_rating <= 5),
  
  -- Review
  review_title TEXT,
  review_text TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  
  -- Moderation
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- Engagement
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(expert_id, user_id, consultation_id, workshop_id)
);

-- Follow-up Sessions
CREATE TABLE IF NOT EXISTS follow_up_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_consultation_id UUID NOT NULL REFERENCES consultation_bookings(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES expert_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session details
  session_type TEXT NOT NULL CHECK (session_type IN ('follow_up', 'check_in', 'progress_review')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  
  -- Status
  session_status TEXT DEFAULT 'scheduled' CHECK (session_status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  
  -- Notes
  progress_notes TEXT,
  recommendations TEXT,
  
  -- Payment (may be discounted or free)
  amount DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending',
  
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expert_profiles_user_id ON expert_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_profiles_active ON expert_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_expert_articles_expert_id ON expert_articles(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_articles_published ON expert_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_expert_videos_expert_id ON expert_videos(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_qa_expert_id ON expert_qa(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_qa_answered ON expert_qa(is_answered);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_expert_id ON consultation_bookings(expert_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_user_id ON consultation_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_status ON consultation_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_workshop_bookings_expert_id ON workshop_bookings(expert_id);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_workshop_id ON workshop_participants(workshop_booking_id);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_user_id ON workshop_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_ratings_expert_id ON expert_ratings(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_ratings_user_id ON expert_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_sessions_consultation_id ON follow_up_sessions(original_consultation_id);

-- RLS Policies
ALTER TABLE expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_sessions ENABLE ROW LEVEL SECURITY;

-- Expert Profiles: Public can view, experts can manage their own
CREATE POLICY "Public can view active expert profiles"
  ON expert_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Experts can manage own profile"
  ON expert_profiles FOR ALL
  USING (auth.uid() = user_id);

-- Expert Articles: Public can view published articles
CREATE POLICY "Public can view published articles"
  ON expert_articles FOR SELECT
  USING (is_published = true);

CREATE POLICY "Experts can manage own articles"
  ON expert_articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM expert_profiles ep
      WHERE ep.id = expert_articles.expert_id
      AND ep.user_id = auth.uid()
    )
  );

-- Expert Videos: Public can view published videos
CREATE POLICY "Public can view published videos"
  ON expert_videos FOR SELECT
  USING (is_published = true);

CREATE POLICY "Experts can manage own videos"
  ON expert_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM expert_profiles ep
      WHERE ep.id = expert_videos.expert_id
      AND ep.user_id = auth.uid()
    )
  );

-- Expert Q&A: Public can view answered Q&A
CREATE POLICY "Public can view answered Q&A"
  ON expert_qa FOR SELECT
  USING (is_answered = true AND is_public = true);

CREATE POLICY "Users can create Q&A"
  ON expert_qa FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Experts can answer Q&A"
  ON expert_qa FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM expert_profiles ep
      WHERE ep.id = expert_qa.expert_id
      AND ep.user_id = auth.uid()
    )
  );

-- Consultation Bookings: Users can manage their own bookings
CREATE POLICY "Users can manage own consultation bookings"
  ON consultation_bookings FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = expert_id);

-- Workshop Bookings: Public can view open workshops
CREATE POLICY "Public can view open workshops"
  ON workshop_bookings FOR SELECT
  USING (booking_status = 'open');

-- Workshop Participants: Users can manage their own participation
CREATE POLICY "Users can manage own workshop participation"
  ON workshop_participants FOR ALL
  USING (auth.uid() = user_id);

-- Expert Ratings: Public can view public ratings
CREATE POLICY "Public can view public ratings"
  ON expert_ratings FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create ratings"
  ON expert_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Follow-up Sessions: Users can manage their own
CREATE POLICY "Users can manage own follow-up sessions"
  ON follow_up_sessions FOR ALL
  USING (auth.uid() = user_id OR auth.uid() = expert_id);



-- END MIGRATION: 20251207000040_expert_content_consultations.sql

-- BEGIN MIGRATION: 20251209013319_c02a8722-9fd6-44f9-82fd-273dd6cc1435.sql

-- ============================================================================
-- NSFW ADVANCED FEATURES - Part 1: Core Feature Tables
-- ============================================================================

-- PornMD Integration
CREATE TABLE IF NOT EXISTS public.pornmd_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  is_partner BOOLEAN DEFAULT false,
  partner_tier TEXT CHECK (partner_tier IN ('sponsor', 'premium', 'standard')),
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  content_preferences JSONB,
  sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  sync_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Multi-Camera Recording Sessions
CREATE TABLE IF NOT EXISTS public.multi_camera_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_name TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('solo', 'partner_sync', 'multi_camera')),
  recording_status TEXT DEFAULT 'draft' CHECK (recording_status IN ('draft', 'recording', 'paused', 'completed', 'editing', 'published')),
  camera_count INTEGER DEFAULT 1,
  sync_enabled BOOLEAN DEFAULT false,
  quality TEXT DEFAULT '1080p' CHECK (quality IN ('720p', '1080p', '4k')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  is_private BOOLEAN DEFAULT true,
  share_with_partner BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Camera Streams
CREATE TABLE IF NOT EXISTS public.camera_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.multi_camera_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camera_index INTEGER NOT NULL,
  camera_name TEXT,
  device_id TEXT,
  device_type TEXT CHECK (device_type IN ('webcam', 'phone', 'tablet', 'external', 'partner_device')),
  is_active BOOLEAN DEFAULT false,
  is_recording BOOLEAN DEFAULT false,
  video_url TEXT,
  video_storage_path TEXT,
  video_duration_seconds INTEGER,
  video_size_bytes BIGINT,
  resolution_width INTEGER,
  resolution_height INTEGER,
  fps INTEGER,
  codec TEXT,
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Recordings
CREATE TABLE IF NOT EXISTS public.video_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.multi_camera_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recording_name TEXT NOT NULL,
  recording_type TEXT DEFAULT 'multi_camera' CHECK (recording_type IN ('single', 'multi_camera', 'partner_sync')),
  video_url TEXT,
  video_storage_path TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  resolution_width INTEGER,
  resolution_height INTEGER,
  fps INTEGER,
  codec TEXT,
  is_edited BOOLEAN DEFAULT false,
  edit_version INTEGER DEFAULT 1,
  original_recording_id UUID REFERENCES public.video_recordings(id),
  is_private BOOLEAN DEFAULT true,
  share_with_partner BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Edits
CREATE TABLE IF NOT EXISTS public.video_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES public.video_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edit_name TEXT,
  edit_type TEXT NOT NULL CHECK (edit_type IN ('cut', 'merge', 'transition', 'mask', 'track', 'camera_switch', 'filter', 'effect', 'audio', 'other')),
  edit_config JSONB NOT NULL,
  camera_switches JSONB,
  masking_data JSONB,
  transitions JSONB,
  edited_video_url TEXT,
  edited_video_storage_path TEXT,
  preview_url TEXT,
  edit_status TEXT DEFAULT 'pending' CHECK (edit_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Screenshots
CREATE TABLE IF NOT EXISTS public.video_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES public.video_recordings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  screenshot_name TEXT,
  timestamp_seconds DECIMAL(10, 3) NOT NULL,
  image_url TEXT,
  image_storage_path TEXT,
  thumbnail_url TEXT,
  is_edited BOOLEAN DEFAULT false,
  edit_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intimate Date Proposals
CREATE TABLE IF NOT EXISTS public.intimate_date_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_title TEXT NOT NULL,
  proposal_type TEXT DEFAULT 'custom' CHECK (proposal_type IN ('template', 'custom', 'quick')),
  template_id UUID,
  proposed_date DATE NOT NULL,
  proposed_time TIME NOT NULL,
  duration_minutes INTEGER,
  location_name TEXT,
  location_address TEXT,
  location_type TEXT CHECK (location_type IN ('home', 'hotel', 'outdoor', 'other')),
  is_location_private BOOLEAN DEFAULT true,
  activities JSONB NOT NULL,
  specialty_intimacy TEXT[],
  special_requests TEXT,
  voice_message_url TEXT,
  voice_message_duration_seconds INTEGER,
  images_urls TEXT[],
  gifs_urls TEXT[],
  videos_urls TEXT[],
  links TEXT[],
  text_message TEXT,
  adult_emojis TEXT[],
  proposal_status TEXT DEFAULT 'pending' CHECK (proposal_status IN ('pending', 'reviewed', 'accepted', 'declined', 'modified', 'resubmitted')),
  partner_response TEXT,
  partner_modified_date DATE,
  partner_modified_time TIME,
  partner_suggestions TEXT,
  partner_media_urls TEXT[],
  reviewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Intimate Date Templates
CREATE TABLE IF NOT EXISTS public.intimate_date_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  template_category TEXT CHECK (template_category IN ('romantic', 'passionate', 'adventurous', 'kinky', 'quick', 'custom')),
  is_public BOOLEAN DEFAULT false,
  default_activities JSONB NOT NULL,
  default_positions TEXT[],
  default_duration_minutes INTEGER,
  default_location_type TEXT,
  default_message TEXT,
  default_voice_script TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seductive AI Chat Sessions
CREATE TABLE IF NOT EXISTS public.seductive_ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_name TEXT,
  session_type TEXT DEFAULT 'solo' CHECK (session_type IN ('solo', 'partner', 'group')),
  ai_personality TEXT DEFAULT 'seductive' CHECK (ai_personality IN ('seductive', 'flirty', 'dirty', 'nasty', 'romantic', 'kinky', 'custom')),
  ai_intensity TEXT DEFAULT 'medium' CHECK (ai_intensity IN ('light', 'medium', 'strong', 'extreme')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seductive AI Messages
CREATE TABLE IF NOT EXISTS public.seductive_ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.seductive_ai_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'ai', 'system')),
  message_content TEXT NOT NULL,
  images_urls TEXT[],
  gifs_urls TEXT[],
  videos_urls TEXT[],
  voice_message_url TEXT,
  adult_emojis TEXT[],
  ai_confidence DECIMAL(5, 2),
  ai_sentiment TEXT,
  ai_suggestions TEXT[],
  context_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sex Positions Library
CREATE TABLE IF NOT EXISTS public.sex_positions_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_name TEXT NOT NULL UNIQUE,
  position_category TEXT CHECK (position_category IN ('basic', 'advanced', 'kinky', 'romantic', 'adventurous', 'acrobatic')),
  difficulty_level TEXT DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
  description TEXT,
  instructions TEXT[],
  tips TEXT[],
  image_url TEXT,
  video_url TEXT,
  gif_url TEXT,
  popularity_score INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Saved Positions
CREATE TABLE IF NOT EXISTS public.user_saved_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.sex_positions_library(id) ON DELETE CASCADE,
  personal_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  tried BOOLEAN DEFAULT false,
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, position_id)
);

-- Indexes for NSFW Advanced Features
CREATE INDEX IF NOT EXISTS idx_pornmd_integration_user_id ON public.pornmd_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_camera_sessions_user_id ON public.multi_camera_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_camera_sessions_partner_id ON public.multi_camera_sessions(partner_id);
CREATE INDEX IF NOT EXISTS idx_camera_streams_session_id ON public.camera_streams(session_id);
CREATE INDEX IF NOT EXISTS idx_camera_streams_user_id ON public.camera_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_session_id ON public.video_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_video_recordings_user_id ON public.video_recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_video_edits_recording_id ON public.video_edits(recording_id);
CREATE INDEX IF NOT EXISTS idx_video_screenshots_recording_id ON public.video_screenshots(recording_id);
CREATE INDEX IF NOT EXISTS idx_intimate_date_proposals_creator_id ON public.intimate_date_proposals(creator_id);
CREATE INDEX IF NOT EXISTS idx_intimate_date_proposals_partner_id ON public.intimate_date_proposals(partner_id);
CREATE INDEX IF NOT EXISTS idx_intimate_date_proposals_status ON public.intimate_date_proposals(proposal_status);
CREATE INDEX IF NOT EXISTS idx_seductive_ai_sessions_user_id ON public.seductive_ai_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_seductive_ai_messages_session_id ON public.seductive_ai_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_positions_user_id ON public.user_saved_positions(user_id);

-- Enable RLS
ALTER TABLE public.pornmd_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_camera_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seductive_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seductive_ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sex_positions_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for NSFW Advanced Features
CREATE POLICY "Users can manage own pornmd integration" ON public.pornmd_integration FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own multi-camera sessions" ON public.multi_camera_sessions FOR ALL USING (auth.uid() = user_id OR auth.uid() = partner_id);
CREATE POLICY "Users can manage own camera streams" ON public.camera_streams FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video recordings" ON public.video_recordings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video edits" ON public.video_edits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video screenshots" ON public.video_screenshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own intimate date proposals" ON public.intimate_date_proposals FOR ALL USING (auth.uid() = creator_id OR auth.uid() = partner_id);
CREATE POLICY "Users can view public templates" ON public.intimate_date_templates FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own templates" ON public.intimate_date_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own seductive AI sessions" ON public.seductive_ai_sessions FOR ALL USING (auth.uid() = user_id OR auth.uid() = partner_id);
CREATE POLICY "Users can create seductive AI messages" ON public.seductive_ai_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own seductive AI messages" ON public.seductive_ai_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view sex positions library" ON public.sex_positions_library FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own saved positions" ON public.user_saved_positions FOR ALL USING (auth.uid() = user_id);

-- END MIGRATION: 20251209013319_c02a8722-9fd6-44f9-82fd-273dd6cc1435.sql

-- BEGIN MIGRATION: 20251209013441_a945de7f-626e-4d66-a518-03b5dce3faf8.sql

-- ============================================================================
-- PART 2: Expert Content & Consultations System
-- ============================================================================

-- Expert Profiles
CREATE TABLE IF NOT EXISTS public.expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  credentials TEXT[] DEFAULT '{}',
  years_experience INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  consultation_rate_per_hour NUMERIC(10,2) DEFAULT 0.0,
  group_workshop_rate_per_person NUMERIC(10,2) DEFAULT 0.0,
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  availability_schedule JSONB DEFAULT '{}',
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Articles
CREATE TABLE IF NOT EXISTS public.expert_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Videos
CREATE TABLE IF NOT EXISTS public.expert_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Questions & Answers
CREATE TABLE IF NOT EXISTS public.expert_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'archived')),
  answer TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Consultations
CREATE TABLE IF NOT EXISTS public.expert_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('individual', 'group')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_amount NUMERIC(10,2) DEFAULT 0.0,
  meeting_url TEXT,
  recording_url TEXT,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Group Workshops
CREATE TABLE IF NOT EXISTS public.expert_group_workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_participants INTEGER DEFAULT 10,
  current_participants INTEGER DEFAULT 0,
  price_per_person NUMERIC(10,2) NOT NULL,
  meeting_url TEXT,
  recording_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop Participants
CREATE TABLE IF NOT EXISTS public.workshop_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.expert_group_workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workshop_id, user_id)
);

-- Indexes for Expert System
CREATE INDEX IF NOT EXISTS idx_expert_profiles_user_id ON public.expert_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_profiles_verified ON public.expert_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_expert_profiles_available ON public.expert_profiles(is_available);
CREATE INDEX IF NOT EXISTS idx_expert_articles_expert_id ON public.expert_articles(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_articles_published ON public.expert_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_expert_videos_expert_id ON public.expert_videos(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_questions_expert_id ON public.expert_questions(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_questions_user_id ON public.expert_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_expert_id ON public.expert_consultations(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_user_id ON public.expert_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_scheduled ON public.expert_consultations(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_workshop_id ON public.workshop_participants(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_user_id ON public.workshop_participants(user_id);

-- RLS for Expert System
ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_group_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_participants ENABLE ROW LEVEL SECURITY;

-- Expert System Policies
CREATE POLICY "Anyone can view verified expert profiles" ON public.expert_profiles FOR SELECT USING (is_verified = true AND is_available = true);
CREATE POLICY "Experts can manage own profile" ON public.expert_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view published articles" ON public.expert_articles FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "Experts can manage own articles" ON public.expert_articles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_articles.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Anyone can view published videos" ON public.expert_videos FOR SELECT USING (published_at IS NOT NULL);
CREATE POLICY "Experts can manage own videos" ON public.expert_videos FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_videos.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view own questions" ON public.expert_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Experts can view questions for them" ON public.expert_questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_questions.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create questions" ON public.expert_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Experts can answer questions" ON public.expert_questions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_questions.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view own consultations" ON public.expert_consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Experts can view their consultations" ON public.expert_consultations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_consultations.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can book consultations" ON public.expert_consultations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users and experts can update consultations" ON public.expert_consultations FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_consultations.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Anyone can view workshops" ON public.expert_group_workshops FOR SELECT USING (true);
CREATE POLICY "Experts can manage own workshops" ON public.expert_group_workshops FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.expert_profiles
    WHERE expert_profiles.id = expert_group_workshops.expert_id
    AND expert_profiles.user_id = auth.uid()
  )
);
CREATE POLICY "Users can view own workshop participation" ON public.workshop_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join workshops" ON public.workshop_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- END MIGRATION: 20251209013441_a945de7f-626e-4d66-a518-03b5dce3faf8.sql

-- BEGIN MIGRATION: 20251209013610_6766dfd6-1859-4585-8300-4e04e04b2a5a.sql

-- ============================================================================
-- PART 3: NSFW Video Content, Forum, Wellness Analytics & Supporting Tables
-- ============================================================================

-- NSFW Video Library
CREATE TABLE IF NOT EXISTS public.nsfw_video_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technique', 'tutorial', 'expert_interview', 'educational', 'demonstration', 'advanced', 'beginner')),
  video_url_sd TEXT,
  video_url_hd TEXT,
  video_url_4k TEXT,
  video_duration_seconds INTEGER,
  thumbnail_url TEXT,
  preview_gif_url TEXT,
  tags TEXT[],
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  content_rating TEXT CHECK (content_rating IN ('educational', 'demonstrative', 'explicit')),
  expert_id UUID REFERENCES auth.users(id),
  expert_name TEXT,
  expert_credentials TEXT,
  step_by_step_guide JSONB,
  key_points TEXT[],
  warnings TEXT[],
  prerequisites TEXT[],
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  requires_dlc BOOLEAN DEFAULT false,
  dlc_pack_id UUID,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Playlists
CREATE TABLE IF NOT EXISTS public.nsfw_video_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  playlist_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  video_ids UUID[] NOT NULL,
  video_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER,
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_curated BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  auto_play_next BOOLEAN DEFAULT true,
  shuffle_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Progress Tracking
CREATE TABLE IF NOT EXISTS public.nsfw_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_position_seconds INTEGER DEFAULT 0,
  watched_duration_seconds INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  playback_speed DECIMAL(3, 2) DEFAULT 1.0,
  quality_preference TEXT DEFAULT 'auto' CHECK (quality_preference IN ('sd', 'hd', '4k', 'auto')),
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_position_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Video Downloads
CREATE TABLE IF NOT EXISTS public.nsfw_video_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quality TEXT NOT NULL CHECK (quality IN ('sd', 'hd', '4k')),
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER,
  download_status TEXT DEFAULT 'pending' CHECK (download_status IN ('pending', 'downloading', 'completed', 'failed', 'paused')),
  downloaded_bytes INTEGER DEFAULT 0,
  download_progress DECIMAL(5, 2) DEFAULT 0,
  downloaded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Reviews
CREATE TABLE IF NOT EXISTS public.nsfw_video_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id)
);

-- Video Watch History
CREATE TABLE IF NOT EXISTS public.nsfw_video_watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.nsfw_video_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  watch_duration_seconds INTEGER,
  completion_percentage DECIMAL(5, 2),
  watch_source TEXT,
  referrer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Forum Categories
CREATE TABLE IF NOT EXISTS public.nsfw_forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  thread_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Forum Threads
CREATE TABLE IF NOT EXISTS public.nsfw_forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.nsfw_forum_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  thread_title TEXT NOT NULL,
  thread_content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NSFW Forum Posts
CREATE TABLE IF NOT EXISTS public.nsfw_forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.nsfw_forum_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  post_content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  parent_post_id UUID REFERENCES public.nsfw_forum_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sexual Function Tracking
CREATE TABLE IF NOT EXISTS public.nsfw_sexual_function_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  entry_time TIME,
  erectile_function_score INTEGER CHECK (erectile_function_score >= 1 AND erectile_function_score <= 10),
  erection_quality TEXT CHECK (erection_quality IN ('none', 'partial', 'full', 'rigid')),
  erection_duration_minutes INTEGER,
  erection_stability INTEGER CHECK (erection_stability >= 1 AND erection_stability <= 10),
  stamina_minutes INTEGER,
  control_level INTEGER CHECK (control_level >= 1 AND control_level <= 10),
  recovery_time_minutes INTEGER,
  activity_type TEXT CHECK (activity_type IN ('solo', 'partner', 'both')),
  partner_present BOOLEAN,
  environment TEXT,
  factors_affecting JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- Libido Tracking
CREATE TABLE IF NOT EXISTS public.nsfw_libido_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  libido_level INTEGER NOT NULL CHECK (libido_level >= 1 AND libido_level <= 10),
  libido_direction TEXT CHECK (libido_direction IN ('increasing', 'stable', 'decreasing')),
  contributing_factors JSONB,
  inhibiting_factors JSONB,
  desire_frequency TEXT CHECK (desire_frequency IN ('multiple_daily', 'daily', 'few_times_week', 'weekly', 'less_often')),
  desire_intensity INTEGER CHECK (desire_intensity >= 1 AND desire_intensity <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Satisfaction Tracking
CREATE TABLE IF NOT EXISTS public.nsfw_satisfaction_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  overall_satisfaction INTEGER NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
  physical_satisfaction INTEGER CHECK (physical_satisfaction >= 1 AND physical_satisfaction <= 10),
  emotional_satisfaction INTEGER CHECK (emotional_satisfaction >= 1 AND emotional_satisfaction <= 10),
  partner_satisfaction INTEGER CHECK (partner_satisfaction >= 1 AND partner_satisfaction <= 10),
  mutual_satisfaction INTEGER CHECK (mutual_satisfaction >= 1 AND mutual_satisfaction <= 10),
  satisfaction_factors JSONB,
  dissatisfaction_factors JSONB,
  activity_type TEXT,
  partner_present BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Frequency Tracking
CREATE TABLE IF NOT EXISTS public.nsfw_frequency_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tracking_period_start DATE NOT NULL,
  tracking_period_end DATE NOT NULL,
  period_type TEXT DEFAULT 'weekly' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  solo_activity_count INTEGER DEFAULT 0,
  partner_activity_count INTEGER DEFAULT 0,
  total_activity_count INTEGER DEFAULT 0,
  average_per_week DECIMAL(5, 2),
  average_per_month DECIMAL(5, 2),
  frequency_trend TEXT CHECK (frequency_trend IN ('increasing', 'stable', 'decreasing', 'fluctuating')),
  trend_strength DECIMAL(3, 2),
  target_frequency_per_week DECIMAL(5, 2),
  goal_achieved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wellness Scores
CREATE TABLE IF NOT EXISTS public.nsfw_wellness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calculation_date DATE NOT NULL,
  calculation_period_days INTEGER DEFAULT 30,
  overall_wellness_score DECIMAL(5, 2) NOT NULL,
  function_score DECIMAL(5, 2),
  libido_score DECIMAL(5, 2),
  satisfaction_score DECIMAL(5, 2),
  frequency_score DECIMAL(5, 2),
  relationship_score DECIMAL(5, 2),
  score_trend TEXT CHECK (score_trend IN ('improving', 'stable', 'declining', 'fluctuating')),
  score_change DECIMAL(5, 2),
  insights TEXT[],
  recommendations TEXT[],
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Success Stories
CREATE TABLE IF NOT EXISTS public.success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  before_stats JSONB,
  after_stats JSONB,
  duration_weeks INTEGER,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trust Badges
CREATE TABLE IF NOT EXISTS public.trust_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_name TEXT NOT NULL UNIQUE,
  badge_type TEXT NOT NULL,
  icon_url TEXT,
  description TEXT,
  link_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonial Votes
CREATE TABLE IF NOT EXISTS public.testimonial_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id UUID NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(testimonial_id, user_id)
);

-- User Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_category ON public.nsfw_video_content(category);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_premium ON public.nsfw_video_content(is_premium);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_featured ON public.nsfw_video_content(is_featured);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_playlists_user_id ON public.nsfw_video_playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_progress_user_id ON public.nsfw_video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_downloads_user_id ON public.nsfw_video_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_video_watch_history_user_id ON public.nsfw_video_watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_threads_category ON public.nsfw_forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_forum_posts_thread ON public.nsfw_forum_posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_sexual_function_user_date ON public.nsfw_sexual_function_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_libido_user_date ON public.nsfw_libido_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_satisfaction_user_date ON public.nsfw_satisfaction_tracking(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_nsfw_frequency_user_id ON public.nsfw_frequency_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_wellness_scores_user_id ON public.nsfw_wellness_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON public.testimonials(featured);
CREATE INDEX IF NOT EXISTS idx_success_stories_featured ON public.success_stories(featured);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON public.user_subscriptions(user_id);

-- Enable RLS on all tables
ALTER TABLE public.nsfw_video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_video_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_video_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_video_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_video_watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_sexual_function_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_libido_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_satisfaction_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_frequency_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_wellness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trust_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonial_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view approved videos" ON public.nsfw_video_content FOR SELECT TO authenticated USING (is_approved = true AND is_active = true);
CREATE POLICY "Users can manage own playlists" ON public.nsfw_video_playlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public playlists" ON public.nsfw_video_playlists FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage own video progress" ON public.nsfw_video_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video downloads" ON public.nsfw_video_downloads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own video reviews" ON public.nsfw_video_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view approved reviews" ON public.nsfw_video_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can manage own watch history" ON public.nsfw_video_watch_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view forum categories" ON public.nsfw_forum_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view approved threads" ON public.nsfw_forum_threads FOR SELECT TO authenticated USING (is_approved = true OR auth.uid() = user_id);
CREATE POLICY "Users can create threads" ON public.nsfw_forum_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR (is_anonymous = true AND user_id IS NULL));
CREATE POLICY "Users can update own threads" ON public.nsfw_forum_threads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view approved posts" ON public.nsfw_forum_posts FOR SELECT TO authenticated USING (is_approved = true OR auth.uid() = user_id);
CREATE POLICY "Users can create posts" ON public.nsfw_forum_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR (is_anonymous = true AND user_id IS NULL));
CREATE POLICY "Users can manage own sexual function tracking" ON public.nsfw_sexual_function_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own libido tracking" ON public.nsfw_libido_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own satisfaction tracking" ON public.nsfw_satisfaction_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own frequency tracking" ON public.nsfw_frequency_tracking FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own wellness scores" ON public.nsfw_wellness_scores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view verified testimonials" ON public.testimonials FOR SELECT USING (verified = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own testimonials" ON public.testimonials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view verified success stories" ON public.success_stories FOR SELECT USING (verified = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage own success stories" ON public.success_stories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active trust badges" ON public.trust_badges FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage own votes" ON public.testimonial_votes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subscription" ON public.user_subscriptions FOR ALL USING (auth.uid() = user_id);

-- END MIGRATION: 20251209013610_6766dfd6-1859-4585-8300-4e04e04b2a5a.sql

-- BEGIN MIGRATION: 20251209020121_85e3384b-4ca1-4ae6-9b1e-536b33a9d95a.sql

-- Achievement System Tables

-- Achievement Definitions
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('consistency', 'progress', 'health', 'community', 'premium', 'special')),
    icon_name TEXT,
    badge_color TEXT NOT NULL DEFAULT '#FFD700',
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('streak', 'count', 'milestone', 'custom')),
    requirement_value INTEGER,
    requirement_data JSONB,
    points INTEGER NOT NULL DEFAULT 10,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Achievements (progress tracking)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    achievement_id UUID NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    progress_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, achievement_id)
);

-- User Streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    streak_type TEXT NOT NULL CHECK (streak_type IN ('scan', 'routine', 'diary', 'education', 'community')),
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    streak_start_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, streak_type)
);

-- User Milestones
CREATE TABLE IF NOT EXISTS public.user_milestones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    milestone_type TEXT NOT NULL CHECK (milestone_type IN ('scan_count', 'routine_count', 'diary_count', 'days_active', 'measurement_growth', 'custom')),
    milestone_value INTEGER NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    milestone_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, milestone_type, milestone_value)
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS public.leaderboards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('achievements', 'streaks', 'progress', 'community')),
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    display_name TEXT NOT NULL DEFAULT 'Anonymous',
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, leaderboard_type, period)
);

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('scans', 'scans', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('progress-photos', 'progress-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('videos', 'videos', false, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
    ('documents', 'documents', false, 20971520, ARRAY['application/pdf', 'application/json', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all new tables
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievement_definitions (public read)
CREATE POLICY "Anyone can view active achievements" ON public.achievement_definitions
    FOR SELECT USING (is_active = true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON public.user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_streaks
CREATE POLICY "Users can manage own streaks" ON public.user_streaks
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_milestones
CREATE POLICY "Users can manage own milestones" ON public.user_milestones
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for leaderboards
CREATE POLICY "Anyone can view leaderboards" ON public.leaderboards
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own leaderboard entry" ON public.leaderboards
    FOR ALL USING (auth.uid() = user_id);

-- Storage Policies for scans bucket
CREATE POLICY "Users can view own scans" ON storage.objects
    FOR SELECT USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own scans" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own scans" ON storage.objects
    FOR DELETE USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for progress-photos bucket
CREATE POLICY "Users can view own progress photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own progress photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own progress photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for avatars bucket (public read)
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Database functions for achievements
CREATE OR REPLACE FUNCTION public.check_achievement_progress(
    p_user_id UUID,
    p_achievement_code TEXT,
    p_progress_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_achievement achievement_definitions%ROWTYPE;
    v_user_achievement user_achievements%ROWTYPE;
    v_new_progress INTEGER;
    v_unlocked BOOLEAN := false;
BEGIN
    -- Get achievement definition
    SELECT * INTO v_achievement FROM achievement_definitions WHERE code = p_achievement_code AND is_active = true;
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Get or create user achievement
    SELECT * INTO v_user_achievement FROM user_achievements 
    WHERE user_id = p_user_id AND achievement_id = v_achievement.id;
    
    IF NOT FOUND THEN
        INSERT INTO user_achievements (user_id, achievement_id, progress)
        VALUES (p_user_id, v_achievement.id, p_progress_increment)
        RETURNING * INTO v_user_achievement;
        v_new_progress := p_progress_increment;
    ELSE
        IF v_user_achievement.is_unlocked THEN
            RETURN false; -- Already unlocked
        END IF;
        v_new_progress := v_user_achievement.progress + p_progress_increment;
        UPDATE user_achievements 
        SET progress = v_new_progress, updated_at = now()
        WHERE id = v_user_achievement.id;
    END IF;
    
    -- Check if achievement is now unlocked
    IF v_achievement.requirement_value IS NOT NULL AND v_new_progress >= v_achievement.requirement_value THEN
        UPDATE user_achievements 
        SET is_unlocked = true, unlocked_at = now()
        WHERE user_id = p_user_id AND achievement_id = v_achievement.id;
        v_unlocked := true;
    END IF;
    
    RETURN v_unlocked;
END;
$$;

-- Database function for updating streaks
CREATE OR REPLACE FUNCTION public.update_streak(
    p_user_id UUID,
    p_streak_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_streak user_streaks%ROWTYPE;
    v_today DATE := CURRENT_DATE;
    v_new_streak INTEGER;
BEGIN
    -- Get or create user streak
    SELECT * INTO v_streak FROM user_streaks 
    WHERE user_id = p_user_id AND streak_type = p_streak_type;
    
    IF NOT FOUND THEN
        INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_start_date)
        VALUES (p_user_id, p_streak_type, 1, 1, v_today, v_today)
        RETURNING current_streak INTO v_new_streak;
    ELSE
        -- Check if streak continues or resets
        IF v_streak.last_activity_date = v_today THEN
            -- Already updated today
            RETURN v_streak.current_streak;
        ELSIF v_streak.last_activity_date = v_today - INTERVAL '1 day' THEN
            -- Streak continues
            v_new_streak := v_streak.current_streak + 1;
            UPDATE user_streaks 
            SET current_streak = v_new_streak,
                longest_streak = GREATEST(longest_streak, v_new_streak),
                last_activity_date = v_today,
                updated_at = now()
            WHERE id = v_streak.id;
        ELSE
            -- Streak resets
            v_new_streak := 1;
            UPDATE user_streaks 
            SET current_streak = 1,
                last_activity_date = v_today,
                streak_start_date = v_today,
                updated_at = now()
            WHERE id = v_streak.id;
        END IF;
    END IF;
    
    RETURN v_new_streak;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_achievement_definitions_updated_at
    BEFORE UPDATE ON public.achievement_definitions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at
    BEFORE UPDATE ON public.user_achievements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON public.user_streaks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaderboards_updated_at
    BEFORE UPDATE ON public.leaderboards
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- END MIGRATION: 20251209020121_85e3384b-4ca1-4ae6-9b1e-536b33a9d95a.sql

-- BEGIN MIGRATION: 20251209052741_5826ded5-e7d3-4ad2-9877-2064cea9cdc4.sql

-- DLC Packs table
CREATE TABLE public.dlc_packs (
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
CREATE TABLE public.dlc_bundles (
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
CREATE TABLE public.dlc_purchases (
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
CREATE TABLE public.dlc_download_queue (
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
CREATE TABLE public.dlc_updates (
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
CREATE TABLE public.dlc_licenses (
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
CREATE INDEX idx_dlc_packs_type ON public.dlc_packs(pack_type);
CREATE INDEX idx_dlc_packs_featured ON public.dlc_packs(is_featured) WHERE is_featured = true;
CREATE INDEX idx_dlc_purchases_user ON public.dlc_purchases(user_id);
CREATE INDEX idx_dlc_purchases_pack ON public.dlc_purchases(pack_id);
CREATE INDEX idx_dlc_download_queue_user ON public.dlc_download_queue(user_id);
CREATE INDEX idx_dlc_licenses_user ON public.dlc_licenses(user_id);
CREATE INDEX idx_dlc_licenses_key ON public.dlc_licenses(license_key);

-- Add updated_at trigger
CREATE TRIGGER update_dlc_packs_updated_at
  BEFORE UPDATE ON public.dlc_packs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dlc_bundles_updated_at
  BEFORE UPDATE ON public.dlc_bundles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dlc_licenses_updated_at
  BEFORE UPDATE ON public.dlc_licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- END MIGRATION: 20251209052741_5826ded5-e7d3-4ad2-9877-2064cea9cdc4.sql

-- BEGIN MIGRATION: 20251209100000_advanced_reporting_tables.sql

-- Advanced Reporting System Tables
-- Custom reports, templates, health risk scoring

-- Custom Reports
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  report_name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('progress', 'health', 'comparison', 'comprehensive', 'custom')),
  
  -- Configuration
  report_config JSONB NOT NULL DEFAULT '{}',
  selected_metrics TEXT[] NOT NULL DEFAULT '{}',
  date_range JSONB NOT NULL DEFAULT '{}',
  theme TEXT DEFAULT 'professional' CHECK (theme IN ('light', 'dark', 'professional', 'minimal')),
  color_scheme JSONB DEFAULT '{}',
  chart_types JSONB DEFAULT '{}',
  
  -- Sharing
  is_shared BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  shared_with_users UUID[],
  shared_with_doctors UUID[],
  
  -- Scheduling
  is_scheduled BOOLEAN DEFAULT false,
  schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
  schedule_day INTEGER,
  schedule_time TIME,
  next_scheduled_at TIMESTAMPTZ,
  last_generated_at TIMESTAMPTZ,
  
  -- Stats
  generation_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Flags
  is_favorite BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  
  template_config JSONB NOT NULL DEFAULT '{}',
  default_metrics TEXT[] NOT NULL DEFAULT '{}',
  default_date_range JSONB DEFAULT '{}',
  default_theme TEXT DEFAULT 'professional',
  default_color_scheme JSONB DEFAULT '{}',
  
  is_premium BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Risk Scores
CREATE TABLE IF NOT EXISTS health_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  risk_category TEXT NOT NULL,
  overall_risk_score INTEGER NOT NULL CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'elevated', 'high')),
  
  risk_factors JSONB NOT NULL DEFAULT '[]',
  recommendations TEXT[] NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_reports_user ON custom_reports(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_reports_share_token ON custom_reports(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_custom_reports_scheduled ON custom_reports(is_scheduled, next_scheduled_at) WHERE is_scheduled = true;
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category, is_premium);
CREATE INDEX IF NOT EXISTS idx_health_risk_scores_user ON health_risk_scores(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_risk_scores ENABLE ROW LEVEL SECURITY;

-- Custom reports policies
CREATE POLICY "Users can manage their own reports"
  ON custom_reports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view shared reports"
  ON custom_reports FOR SELECT
  USING (
    auth.uid() = user_id OR
    is_shared = true OR
    auth.uid() = ANY(shared_with_users)
  );

-- Report templates policies (public read)
CREATE POLICY "Anyone can view report templates"
  ON report_templates FOR SELECT
  USING (true);

-- Health risk scores policies
CREATE POLICY "Users can manage their own health risk scores"
  ON health_risk_scores FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default report templates
INSERT INTO report_templates (id, template_name, description, category, template_config, default_metrics, default_theme, is_premium)
VALUES 
  (
    gen_random_uuid(),
    'Weekly Progress Report',
    'Summarize your weekly progress with key metrics and charts',
    'progress',
    '{"include_charts": true, "include_tables": true, "include_summary": true, "include_recommendations": true, "page_size": "a4", "orientation": "portrait"}',
    ARRAY['length', 'girth', 'routine_completion'],
    'professional',
    false
  ),
  (
    gen_random_uuid(),
    'Monthly Health Assessment',
    'Comprehensive monthly health and progress assessment',
    'health',
    '{"include_charts": true, "include_tables": true, "include_summary": true, "include_recommendations": true, "page_size": "a4", "orientation": "landscape"}',
    ARRAY['length', 'girth', 'eq_score', 'hardness', 'routine_completion'],
    'professional',
    true
  ),
  (
    gen_random_uuid(),
    'Doctor-Ready Report',
    'Professional medical report format suitable for healthcare providers',
    'medical',
    '{"include_charts": true, "include_tables": true, "include_summary": true, "include_recommendations": false, "page_size": "letter", "orientation": "portrait"}',
    ARRAY['length', 'girth', 'erect_length', 'erect_girth', 'eq_score'],
    'minimal',
    true
  )
ON CONFLICT DO NOTHING;



-- END MIGRATION: 20251209100000_advanced_reporting_tables.sql

-- BEGIN MIGRATION: 20251209100001_scans_table.sql

-- Scans table for storing scan history and AI analysis results
-- Required by useAIScanAnalysis hook and other components

-- Create scans table if it doesn't exist
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Scan type and metadata
  scan_type TEXT NOT NULL DEFAULT 'measurement',
  scan_source TEXT CHECK (scan_source IN ('camera', 'upload', 'manual')),
  
  -- Measurements
  length DECIMAL(5, 2),
  girth DECIMAL(5, 2),
  erect_length DECIMAL(5, 2),
  erect_girth DECIMAL(5, 2),
  
  -- AI Analysis results
  analysis_result JSONB,
  overall_health TEXT CHECK (overall_health IN ('good', 'fair', 'needs_attention', 'concerning')),
  confidence_level INTEGER CHECK (confidence_level >= 0 AND confidence_level <= 100),
  urgency TEXT CHECK (urgency IN ('routine', 'soon', 'urgent')),
  
  -- Curvature assessment
  curvature_detected BOOLEAN DEFAULT false,
  curvature_angle DECIMAL(5, 2),
  curvature_direction TEXT,
  curvature_severity TEXT CHECK (curvature_severity IN ('none', 'mild', 'moderate', 'severe')),
  
  -- Skin health
  skin_health_status TEXT,
  skin_observations TEXT[],
  
  -- Conditions detected
  conditions JSONB DEFAULT '[]',
  recommendations TEXT[] DEFAULT '{}',
  
  -- Image reference (not storing actual image for privacy)
  has_image BOOLEAN DEFAULT false,
  image_hash TEXT, -- For duplicate detection
  
  -- Calibration data
  calibration_factor DECIMAL(5, 4),
  reference_object TEXT,
  
  -- Notes and tags
  notes TEXT,
  tags TEXT[],
  
  -- Timestamps
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scans_user ON scans(user_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_type ON scans(user_id, scan_type);
CREATE INDEX IF NOT EXISTS idx_scans_health ON scans(user_id, overall_health);
CREATE INDEX IF NOT EXISTS idx_scans_created ON scans(created_at DESC);

-- RLS Policies
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scans"
  ON scans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_scans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_scans_updated_at ON scans;
CREATE TRIGGER trigger_scans_updated_at
  BEFORE UPDATE ON scans
  FOR EACH ROW
  EXECUTE FUNCTION update_scans_updated_at();

-- Function to get scan statistics
CREATE OR REPLACE FUNCTION get_scan_statistics(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_scans INTEGER,
  avg_length DECIMAL,
  avg_girth DECIMAL,
  length_change DECIMAL,
  girth_change DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_scans AS (
    SELECT *
    FROM scans
    WHERE user_id = p_user_id
      AND scanned_at >= NOW() - (p_days || ' days')::INTERVAL
    ORDER BY scanned_at DESC
  ),
  first_scan AS (
    SELECT length, girth
    FROM recent_scans
    ORDER BY scanned_at ASC
    LIMIT 1
  ),
  last_scan AS (
    SELECT length, girth
    FROM recent_scans
    ORDER BY scanned_at DESC
    LIMIT 1
  )
  SELECT
    (SELECT COUNT(*)::INTEGER FROM recent_scans),
    (SELECT AVG(length) FROM recent_scans WHERE length IS NOT NULL),
    (SELECT AVG(girth) FROM recent_scans WHERE girth IS NOT NULL),
    COALESCE((SELECT length FROM last_scan) - (SELECT length FROM first_scan), 0),
    COALESCE((SELECT girth FROM last_scan) - (SELECT girth FROM first_scan), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



-- END MIGRATION: 20251209100001_scans_table.sql

-- BEGIN MIGRATION: 20251209115121_52be4f6f-3484-4238-995b-671564f522ad.sql

-- Healthcare Provider Portal Tables

-- Healthcare Providers
CREATE TABLE IF NOT EXISTS public.healthcare_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'doctor',
  specialty TEXT[] DEFAULT '{}',
  credentials TEXT[] DEFAULT '{}',
  license_number TEXT,
  license_state TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  website TEXT,
  subscription_tier TEXT DEFAULT 'basic',
  subscription_status TEXT DEFAULT 'active',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  hipaa_compliant BOOLEAN DEFAULT false,
  hipaa_certification_date TIMESTAMPTZ,
  baa_signed BOOLEAN DEFAULT false,
  baa_signed_date TIMESTAMPTZ,
  max_patients INTEGER DEFAULT 100,
  current_patient_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patient Provider Relationships
CREATE TABLE IF NOT EXISTS public.patient_provider_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  provider_id UUID NOT NULL REFERENCES public.healthcare_providers(id) ON DELETE CASCADE,
  consent_granted BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  consent_expires_date TIMESTAMPTZ,
  consent_scope TEXT[] DEFAULT '{}',
  relationship_type TEXT DEFAULT 'primary',
  status TEXT DEFAULT 'active',
  access_level TEXT DEFAULT 'read',
  can_view_scans BOOLEAN DEFAULT false,
  can_view_diary BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  provider_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Provider Professional Reports
CREATE TABLE IF NOT EXISTS public.provider_professional_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.healthcare_providers(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'assessment',
  report_title TEXT NOT NULL,
  report_content JSONB DEFAULT '{}',
  findings TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  treatment_plan JSONB,
  report_status TEXT DEFAULT 'draft',
  is_shared_with_patient BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  file_url TEXT,
  file_format TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Treatment Plans
CREATE TABLE IF NOT EXISTS public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.healthcare_providers(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  plan_description TEXT,
  plan_data JSONB DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  milestones TEXT[] DEFAULT '{}',
  timeline_days INTEGER,
  plan_status TEXT DEFAULT 'draft',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress_percentage NUMERIC DEFAULT 0,
  milestones_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HIPAA Audit Logs
CREATE TABLE IF NOT EXISTS public.hipaa_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_id UUID,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habit Definitions (templates)
CREATE TABLE IF NOT EXISTS public.habit_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom',
  frequency TEXT NOT NULL DEFAULT 'daily',
  target_value NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'times',
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_times TEXT[] DEFAULT '{}',
  reminder_days INTEGER[] DEFAULT '{}',
  linked_routine_id UUID,
  linked_feature TEXT,
  color TEXT DEFAULT '#4CAF50',
  icon TEXT DEFAULT '💪',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Habits
CREATE TABLE IF NOT EXISTS public.user_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_definition_id UUID NOT NULL REFERENCES public.habit_definitions(id) ON DELETE CASCADE,
  custom_name TEXT,
  custom_target_value NUMERIC,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT now(),
  paused_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  completion_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habit Entries
CREATE TABLE IF NOT EXISTS public.habit_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_habit_id UUID NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  completed_value NUMERIC DEFAULT 0,
  target_value NUMERIC,
  notes TEXT,
  mood TEXT,
  difficulty_rating INTEGER,
  duration_minutes INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habit Streaks
CREATE TABLE IF NOT EXISTS public.habit_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_habit_id UUID NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  streak_start_date DATE NOT NULL,
  streak_end_date DATE,
  streak_length INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_provider_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_professional_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hipaa_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for healthcare_providers
CREATE POLICY "Users can view own provider profile" ON public.healthcare_providers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own provider profile" ON public.healthcare_providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own provider profile" ON public.healthcare_providers FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for patient_provider_relationships
CREATE POLICY "Patients can view own relationships" ON public.patient_provider_relationships FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Providers can view their patient relationships" ON public.patient_provider_relationships FOR SELECT USING (EXISTS (SELECT 1 FROM public.healthcare_providers WHERE id = provider_id AND user_id = auth.uid()));
CREATE POLICY "Patients can create relationships" ON public.patient_provider_relationships FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can update own relationships" ON public.patient_provider_relationships FOR UPDATE USING (auth.uid() = patient_id);

-- RLS Policies for provider_professional_reports
CREATE POLICY "Providers can manage own reports" ON public.provider_professional_reports FOR ALL USING (EXISTS (SELECT 1 FROM public.healthcare_providers WHERE id = provider_id AND user_id = auth.uid()));
CREATE POLICY "Patients can view shared reports" ON public.provider_professional_reports FOR SELECT USING (patient_id = auth.uid() AND is_shared_with_patient = true);

-- RLS Policies for treatment_plans
CREATE POLICY "Providers can manage own treatment plans" ON public.treatment_plans FOR ALL USING (EXISTS (SELECT 1 FROM public.healthcare_providers WHERE id = provider_id AND user_id = auth.uid()));
CREATE POLICY "Patients can view own treatment plans" ON public.treatment_plans FOR SELECT USING (patient_id = auth.uid());

-- RLS Policies for hipaa_audit_logs
CREATE POLICY "Users can view own audit logs" ON public.hipaa_audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create audit logs" ON public.hipaa_audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for habit_definitions
CREATE POLICY "Users can view own and template habits" ON public.habit_definitions FOR SELECT USING (user_id = auth.uid() OR is_template = true);
CREATE POLICY "Users can create own habit definitions" ON public.habit_definitions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit definitions" ON public.habit_definitions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit definitions" ON public.habit_definitions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_habits
CREATE POLICY "Users can manage own habits" ON public.user_habits FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for habit_entries
CREATE POLICY "Users can manage own habit entries" ON public.habit_entries FOR ALL USING (EXISTS (SELECT 1 FROM public.user_habits WHERE id = user_habit_id AND user_id = auth.uid()));

-- RLS Policies for habit_streaks
CREATE POLICY "Users can manage own habit streaks" ON public.habit_streaks FOR ALL USING (EXISTS (SELECT 1 FROM public.user_habits WHERE id = user_habit_id AND user_id = auth.uid()));

-- Create function to increment patient count
CREATE OR REPLACE FUNCTION public.increment_patient_count(p_provider_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.healthcare_providers
  SET current_patient_count = current_patient_count + 1,
      updated_at = now()
  WHERE id = p_provider_id;
END;
$$;

-- Insert default habit templates
INSERT INTO public.habit_definitions (id, name, description, category, frequency, target_value, unit, icon, color, is_template) VALUES
('00000000-0000-0000-0000-000000000001', 'Daily PE Routine', 'Complete your daily PE exercises', 'pe_routine', 'daily', 1, 'session', '💪', '#4CAF50', true),
('00000000-0000-0000-0000-000000000002', 'Jelqing Session', 'Complete jelqing exercises', 'pe_routine', 'daily', 20, 'minutes', '🎯', '#2196F3', true),
('00000000-0000-0000-0000-000000000003', 'Stretching Routine', 'Complete stretching exercises', 'pe_routine', 'daily', 15, 'minutes', '🧘', '#9C27B0', true),
('00000000-0000-0000-0000-000000000004', 'Kegel Exercises', 'Complete kegel exercises', 'health', 'daily', 50, 'reps', '💎', '#FF9800', true)
ON CONFLICT (id) DO NOTHING;

-- END MIGRATION: 20251209115121_52be4f6f-3484-4238-995b-671564f522ad.sql

-- BEGIN MIGRATION: 20251209131229_93bb1fb0-c46e-4cc9-b5b7-d3c2cf517055.sql

-- Create referral_codes table
CREATE TABLE public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral_tracking table
CREATE TABLE public.referral_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id),
  status TEXT NOT NULL DEFAULT 'pending',
  reward_type TEXT NULL,
  reward_value NUMERIC NULL,
  reward_applied BOOLEAN NOT NULL DEFAULT false,
  referred_subscribed BOOLEAN NOT NULL DEFAULT false,
  referred_subscription_tier TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  rewarded_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create referral_rewards table
CREATE TABLE public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  referral_tracking_id UUID NOT NULL REFERENCES public.referral_tracking(id),
  reward_type TEXT NOT NULL,
  reward_value NUMERIC NOT NULL,
  reward_status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  applied_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
CREATE POLICY "Users can view their own referral codes" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" ON public.referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for referral_tracking
CREATE POLICY "Users can view their referral tracking" ON public.referral_tracking
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referral tracking" ON public.referral_tracking
  FOR INSERT WITH CHECK (true);

-- RLS policies for referral_rewards
CREATE POLICY "Users can view their own rewards" ON public.referral_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert rewards" ON public.referral_rewards
  FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_tracking_referrer ON public.referral_tracking(referrer_id);
CREATE INDEX idx_referral_tracking_referred ON public.referral_tracking(referred_id);

-- END MIGRATION: 20251209131229_93bb1fb0-c46e-4cc9-b5b7-d3c2cf517055.sql

-- BEGIN MIGRATION: 20251212012325_ee02f76c-1acd-491d-97ce-7542b73fde08.sql

-- ==================== DLC Content Items ====================
CREATE TABLE public.dlc_content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.dlc_packs(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('position', 'video', 'image', '3d_model', 'audio', 'document', 'other')),
  content_name TEXT NOT NULL,
  content_description TEXT,
  file_url TEXT,
  file_size_bytes BIGINT,
  thumbnail_url TEXT,
  preview_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sort_order INTEGER DEFAULT 0,
  is_preview_available BOOLEAN DEFAULT false,
  is_downloadable BOOLEAN DEFAULT true,
  is_streamable BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.dlc_content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view content items of active packs"
  ON public.dlc_content_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.dlc_packs WHERE id = pack_id AND is_active = true
  ));

CREATE INDEX idx_dlc_content_items_pack_id ON public.dlc_content_items(pack_id);
CREATE INDEX idx_dlc_content_items_content_type ON public.dlc_content_items(content_type);

-- ==================== DLC Promo Codes ====================
CREATE TABLE public.dlc_promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_trial')),
  discount_value NUMERIC NOT NULL,
  applicable_pack_ids UUID[] DEFAULT '{}',
  applicable_bundle_ids UUID[] DEFAULT '{}',
  applies_to_all BOOLEAN DEFAULT false,
  min_purchase_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.dlc_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promo codes"
  ON public.dlc_promo_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE UNIQUE INDEX idx_dlc_promo_codes_code ON public.dlc_promo_codes(code);

-- ==================== DLC Promo Code Usage ====================
CREATE TABLE public.dlc_promo_code_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.dlc_promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  purchase_id UUID REFERENCES public.dlc_purchases(id),
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.dlc_promo_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own promo code usage"
  ON public.dlc_promo_code_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can use promo codes"
  ON public.dlc_promo_code_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_dlc_promo_code_usage_user ON public.dlc_promo_code_usage(user_id);

-- ==================== DLC Gift Codes ====================
CREATE TABLE public.dlc_gift_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  pack_id UUID REFERENCES public.dlc_packs(id),
  bundle_id UUID REFERENCES public.dlc_bundles(id),
  sender_id UUID,
  sender_email TEXT,
  sender_name TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  gift_message TEXT,
  value_amount NUMERIC,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_by UUID,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.dlc_gift_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sent gifts"
  ON public.dlc_gift_codes FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = redeemed_by);

CREATE POLICY "Users can create gift codes"
  ON public.dlc_gift_codes FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can redeem gift codes"
  ON public.dlc_gift_codes FOR UPDATE
  USING (is_redeemed = false AND (expires_at IS NULL OR expires_at > now()));

CREATE UNIQUE INDEX idx_dlc_gift_codes_code ON public.dlc_gift_codes(code);

-- ==================== DLC Wishlist ====================
CREATE TABLE public.dlc_wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pack_id UUID REFERENCES public.dlc_packs(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES public.dlc_bundles(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  notify_on_sale BOOLEAN DEFAULT true,
  notify_on_release BOOLEAN DEFAULT true,
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT wishlist_pack_or_bundle CHECK (
    (pack_id IS NOT NULL AND bundle_id IS NULL) OR
    (pack_id IS NULL AND bundle_id IS NOT NULL)
  )
);

ALTER TABLE public.dlc_wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist"
  ON public.dlc_wishlist FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_dlc_wishlist_user ON public.dlc_wishlist(user_id);
CREATE UNIQUE INDEX idx_dlc_wishlist_user_pack ON public.dlc_wishlist(user_id, pack_id) WHERE pack_id IS NOT NULL;
CREATE UNIQUE INDEX idx_dlc_wishlist_user_bundle ON public.dlc_wishlist(user_id, bundle_id) WHERE bundle_id IS NOT NULL;

-- ==================== DLC Ratings ====================
CREATE TABLE public.dlc_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pack_id UUID REFERENCES public.dlc_packs(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES public.dlc_bundles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT,
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT rating_pack_or_bundle CHECK (
    (pack_id IS NOT NULL AND bundle_id IS NULL) OR
    (pack_id IS NULL AND bundle_id IS NOT NULL)
  )
);

ALTER TABLE public.dlc_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved ratings"
  ON public.dlc_ratings FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Users can create ratings"
  ON public.dlc_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON public.dlc_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings"
  ON public.dlc_ratings FOR DELETE
  USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_dlc_ratings_user_pack ON public.dlc_ratings(user_id, pack_id) WHERE pack_id IS NOT NULL;
CREATE UNIQUE INDEX idx_dlc_ratings_user_bundle ON public.dlc_ratings(user_id, bundle_id) WHERE bundle_id IS NOT NULL;

-- ==================== NSFW Positions Gallery ====================
CREATE TABLE public.nsfw_positions_gallery (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_name TEXT NOT NULL,
  position_slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  detailed_instructions TEXT,
  category TEXT NOT NULL CHECK (category IN ('classic', 'advanced', 'tantric', 'kama_sutra', 'modern', 'acrobatic', 'romantic', 'quickie', 'oral', 'manual')),
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  intimacy_level TEXT CHECK (intimacy_level IN ('low', 'medium', 'high', 'very_high')),
  physical_intensity TEXT CHECK (physical_intensity IN ('gentle', 'moderate', 'vigorous', 'intense')),
  image_url TEXT,
  image_url_illustrated TEXT,
  thumbnail_url TEXT,
  video_tutorial_url TEXT,
  animation_url TEXT,
  benefits TEXT[],
  tips TEXT[],
  variations TEXT[],
  related_position_ids UUID[],
  required_flexibility TEXT CHECK (required_flexibility IN ('none', 'some', 'moderate', 'high')),
  recommended_duration_minutes INTEGER,
  best_for TEXT[],
  tags TEXT[] DEFAULT '{}',
  is_premium BOOLEAN DEFAULT false,
  requires_dlc BOOLEAN DEFAULT false,
  dlc_pack_id UUID REFERENCES public.dlc_packs(id),
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  average_rating NUMERIC,
  rating_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.nsfw_positions_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active positions"
  ON public.nsfw_positions_gallery FOR SELECT
  USING (is_active = true);

CREATE INDEX idx_nsfw_positions_category ON public.nsfw_positions_gallery(category);
CREATE INDEX idx_nsfw_positions_difficulty ON public.nsfw_positions_gallery(difficulty_level);
CREATE INDEX idx_nsfw_positions_premium ON public.nsfw_positions_gallery(is_premium);

-- ==================== NSFW Positions Favorites ====================
CREATE TABLE public.nsfw_positions_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  position_id UUID NOT NULL REFERENCES public.nsfw_positions_gallery(id) ON DELETE CASCADE,
  notes TEXT,
  personal_rating INTEGER CHECK (personal_rating >= 1 AND personal_rating <= 5),
  tried_count INTEGER DEFAULT 0,
  last_tried_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, position_id)
);

ALTER TABLE public.nsfw_positions_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own position favorites"
  ON public.nsfw_positions_favorites FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_nsfw_positions_favorites_user ON public.nsfw_positions_favorites(user_id);

-- ==================== NSFW Position Ratings ====================
CREATE TABLE public.nsfw_position_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  position_id UUID NOT NULL REFERENCES public.nsfw_positions_gallery(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, position_id)
);

ALTER TABLE public.nsfw_position_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view position ratings"
  ON public.nsfw_position_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own position ratings"
  ON public.nsfw_position_ratings FOR ALL
  USING (auth.uid() = user_id);

-- ==================== NSFW AI Chat Sessions ====================
CREATE TABLE public.nsfw_ai_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_name TEXT,
  chat_type TEXT CHECK (chat_type IN ('intimacy_coach', 'relationship_advice', 'technique_guide', 'fantasy_exploration', 'general')),
  messages JSONB DEFAULT '[]'::jsonb,
  message_count INTEGER DEFAULT 0,
  context_data JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.nsfw_ai_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI chat sessions"
  ON public.nsfw_ai_chat_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_nsfw_ai_chat_user ON public.nsfw_ai_chat_sessions(user_id);
CREATE INDEX idx_nsfw_ai_chat_type ON public.nsfw_ai_chat_sessions(chat_type);

-- ==================== NSFW Expert Content ====================
CREATE TABLE public.nsfw_expert_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID REFERENCES public.expert_profiles(id),
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'video', 'course', 'guide', 'qa', 'workshop_recording')),
  title TEXT NOT NULL,
  description TEXT,
  content_body TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes INTEGER,
  is_premium BOOLEAN DEFAULT false,
  requires_dlc BOOLEAN DEFAULT false,
  dlc_pack_id UUID REFERENCES public.dlc_packs(id),
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  average_rating NUMERIC,
  rating_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.nsfw_expert_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published expert content"
  ON public.nsfw_expert_content FOR SELECT
  USING (is_approved = true AND is_active = true AND published_at IS NOT NULL);

CREATE POLICY "Experts can manage own content"
  ON public.nsfw_expert_content FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.expert_profiles WHERE id = expert_id AND user_id = auth.uid()
  ));

CREATE INDEX idx_nsfw_expert_content_type ON public.nsfw_expert_content(content_type);
CREATE INDEX idx_nsfw_expert_content_category ON public.nsfw_expert_content(category);

-- ==================== DLC Installed Content Tracking ====================
CREATE TABLE public.dlc_installed_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pack_id UUID NOT NULL REFERENCES public.dlc_packs(id),
  purchase_id UUID NOT NULL REFERENCES public.dlc_purchases(id),
  content_item_id UUID REFERENCES public.dlc_content_items(id),
  installed_version TEXT NOT NULL,
  file_path TEXT,
  file_size_bytes BIGINT,
  checksum TEXT,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  is_valid BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.dlc_installed_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own installed content"
  ON public.dlc_installed_content FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_dlc_installed_user ON public.dlc_installed_content(user_id);
CREATE INDEX idx_dlc_installed_pack ON public.dlc_installed_content(pack_id);

-- END MIGRATION: 20251212012325_ee02f76c-1acd-491d-97ce-7542b73fde08.sql

-- BEGIN MIGRATION: 20251212031733_2206dac9-5b6f-4e3d-8349-e81e4b683f59.sql

-- Create learning tables for interactive learning persistence
CREATE TABLE IF NOT EXISTS public.learning_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty_level TEXT DEFAULT 'beginner',
  estimated_duration_minutes INTEGER DEFAULT 0,
  module_count INTEGER DEFAULT 0,
  lesson_count INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  intro_video_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  enrollment_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  estimated_duration_minutes INTEGER DEFAULT 0,
  lesson_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  content_data JSONB,
  order_index INTEGER DEFAULT 0,
  estimated_duration_minutes INTEGER DEFAULT 0,
  requires_completion_of TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  current_module_id UUID REFERENCES public.learning_modules(id),
  current_lesson_id UUID REFERENCES public.learning_lessons(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.learning_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.learning_lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completion_percentage NUMERIC(5,2) DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.learning_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.learning_lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT DEFAULT 'multiple_choice',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  attempt_limit INTEGER,
  show_results_immediately BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.learning_quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC(5,2),
  passed BOOLEAN DEFAULT false,
  time_taken_minutes INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  certificate_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on all learning tables
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_certificates ENABLE ROW LEVEL SECURITY;

-- Courses, modules, lessons, quizzes are publicly readable
CREATE POLICY "Learning courses are viewable by everyone" ON public.learning_courses FOR SELECT USING (is_published = true);
CREATE POLICY "Learning modules are viewable by everyone" ON public.learning_modules FOR SELECT USING (true);
CREATE POLICY "Learning lessons are viewable by everyone" ON public.learning_lessons FOR SELECT USING (true);
CREATE POLICY "Learning quizzes are viewable by everyone" ON public.learning_quizzes FOR SELECT USING (true);

-- User-specific data is only accessible by the owner
CREATE POLICY "Users can view their own enrollments" ON public.learning_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own enrollments" ON public.learning_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own enrollments" ON public.learning_enrollments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own lesson progress" ON public.learning_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own lesson progress" ON public.learning_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lesson progress" ON public.learning_lesson_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own quiz attempts" ON public.learning_quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quiz attempts" ON public.learning_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own certificates" ON public.learning_certificates FOR SELECT USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_enrollments_user ON public.learning_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_enrollments_course ON public.learning_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_lesson_progress_user ON public.learning_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_quiz_attempts_user ON public.learning_quiz_attempts(user_id);

-- END MIGRATION: 20251212031733_2206dac9-5b6f-4e3d-8349-e81e4b683f59.sql

-- BEGIN MIGRATION: 20251212090000_dlc_schema_compat.sql

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



-- END MIGRATION: 20251212090000_dlc_schema_compat.sql

-- BEGIN MIGRATION: 20251212094000_dlc_catalog_and_stripe.sql

-- Migration: DLC catalog alignment + Stripe columns
-- Purpose:
-- - Ensure dlc_packages matches the in-app DLCRegistry catalog (7 packages)
-- - Add optional Stripe identifiers for packages (future-proof)
-- Notes:
-- - Idempotent (safe to re-run)
-- - Does not delete or drop existing data

-- Optional Stripe identifiers
ALTER TABLE IF EXISTS dlc_packages
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

ALTER TABLE IF EXISTS dlc_packages
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

CREATE INDEX IF NOT EXISTS idx_dlc_packages_stripe_product_id ON dlc_packages(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_dlc_packages_stripe_price_id ON dlc_packages(stripe_price_id);

-- Upsert canonical package catalog
-- (Keeps existing rows, updates fields to match current catalog definition)
WITH catalog AS (
  SELECT * FROM (VALUES
    (
      'dlc-positions',
      'Positions Collection',
      'individual',
      'Comprehensive guide to partner connection techniques with visual instructions and expert tips for adults',
      '100+ positions with detailed instructions, images, difficulty ratings, and expert tips. Includes favorites, playlists, and advanced filtering.',
      'Explore 100+ ways to connect',
      9.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":8.99,"GBP":7.99,"CAD":12.99}'::jsonb,
      '[
        {"id":"positions_gallery","name":"Positions Gallery","description":"100+ positions with visual guides","icon":"Heart","category":"positions"},
        {"id":"position_details","name":"Position Details","description":"Detailed instructions and tips","icon":"Info","category":"positions"},
        {"id":"position_favorites","name":"Favorites","description":"Save and organize favorites","icon":"Star","category":"positions"},
        {"id":"position_filters","name":"Advanced Filters","description":"Filter by difficulty, category, and more","icon":"Filter","category":"positions"},
        {"id":"position_playlists","name":"Position Playlists","description":"Create custom playlists","icon":"List","category":"positions"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2024.12.1',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      1,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{"es":"Colección de Posiciones","de":"Positionssammlung","fr":"Collection de Positions"}'::jsonb,
      '{"es":"Guía completa de técnicas de conexión con instrucciones visuales","de":"Umfassender Leitfaden für Verbindungstechniken mit visuellen Anleitungen","fr":"Guide complet des techniques de connexion avec instructions visuelles"}'::jsonb
    ),
    (
      'dlc-videos',
      'Video Library',
      'individual',
      'Premium video library featuring expert demonstrations and educational wellness content for adults',
      'Educational video library with HD streaming, offline downloads, playlists, and progress tracking.',
      'Learn from the experts',
      14.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":12.99,"GBP":11.99,"CAD":18.99}'::jsonb,
      '[
        {"id":"video_library","name":"Video Library","description":"Premium adult video content library","icon":"Video","category":"videos"},
        {"id":"video_streaming","name":"HD Streaming","description":"Stream in high definition","icon":"Play","category":"videos"},
        {"id":"video_downloads","name":"Offline Downloads","description":"Download for offline viewing","icon":"Download","category":"videos"},
        {"id":"video_playlists","name":"Video Playlists","description":"Create and manage playlists","icon":"List","category":"videos"},
        {"id":"video_progress","name":"Progress Tracking","description":"Track viewing progress","icon":"CheckCircle","category":"videos"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2024.12.1',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      2,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-intimate',
      'Intimate Experience Pack',
      'bundle',
      'Complete intimate wellness toolkit with guides, tracking, and partner features',
      'Positions Collection + wellness analytics + partner sync + relationship insights + reports.',
      'The complete couple''s toolkit',
      14.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":12.99,"GBP":11.99,"CAD":18.99}'::jsonb,
      '[
        {"id":"positions_gallery","name":"Positions Gallery","description":"100+ positions with visual guides","icon":"Heart","category":"positions"},
        {"id":"position_details","name":"Position Details","description":"Detailed instructions and tips","icon":"Info","category":"positions"},
        {"id":"position_favorites","name":"Favorites","description":"Save and organize favorites","icon":"Star","category":"positions"},
        {"id":"position_filters","name":"Advanced Filters","description":"Filter by difficulty, category, and more","icon":"Filter","category":"positions"},
        {"id":"position_playlists","name":"Position Playlists","description":"Create custom playlists","icon":"List","category":"positions"},
        {"id":"wellness_analytics","name":"Wellness Analytics","description":"Detailed wellness tracking","icon":"BarChart","category":"analytics"},
        {"id":"partner_sync","name":"Partner Sync","description":"Sync data with your partner","icon":"Users","category":"analytics"},
        {"id":"intimate_reports","name":"Intimate Reports","description":"Generate detailed reports","icon":"FileText","category":"analytics"},
        {"id":"trend_analysis","name":"Trend Analysis","description":"Analyze patterns and trends","icon":"TrendingUp","category":"analytics"},
        {"id":"relationship_insights","name":"Relationship Insights","description":"Insights and recommendations","icon":"Lightbulb","category":"analytics"}
      ]'::jsonb,
      ARRAY['dlc-positions']::TEXT[],
      '1.0.0',
      '2024.12.1',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      true,
      3,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-creator',
      'Creator & Community Pack',
      'bundle',
      'Join our exclusive community with premium content from verified wellness experts',
      'Video Library + private forum + expert Q&A + creator marketplace + exclusive content.',
      'Join the community',
      19.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":17.99,"GBP":15.99,"CAD":24.99}'::jsonb,
      '[
        {"id":"video_library","name":"Video Library","description":"Premium adult video content library","icon":"Video","category":"videos"},
        {"id":"video_streaming","name":"HD Streaming","description":"Stream in high definition","icon":"Play","category":"videos"},
        {"id":"video_downloads","name":"Offline Downloads","description":"Download for offline viewing","icon":"Download","category":"videos"},
        {"id":"video_playlists","name":"Video Playlists","description":"Create and manage playlists","icon":"List","category":"videos"},
        {"id":"video_progress","name":"Progress Tracking","description":"Track viewing progress","icon":"CheckCircle","category":"videos"},
        {"id":"private_forum","name":"Private Forum","description":"Private community forum","icon":"MessageCircle","category":"community"},
        {"id":"private_groups","name":"Private Groups","description":"Join or create private groups","icon":"Users","category":"community"},
        {"id":"expert_qa","name":"Expert Q&A","description":"Ask questions to verified experts","icon":"HelpCircle","category":"community"},
        {"id":"creator_marketplace","name":"Creator Marketplace","description":"Premium content from creators","icon":"ShoppingBag","category":"marketplace"},
        {"id":"exclusive_content","name":"Exclusive Content","description":"Members-only content","icon":"Lock","category":"community"}
      ]'::jsonb,
      ARRAY['dlc-videos']::TEXT[],
      '1.0.0',
      '2024.12.1',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      4,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-advanced',
      'Advanced Features Pack',
      'bundle',
      'Premium suite of advanced features for the complete intimate experience',
      'Positions + Videos + Multi-camera recording + Date planner + AI companion + Partner sync.',
      'Unlock everything',
      29.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":26.99,"GBP":23.99,"CAD":37.99}'::jsonb,
      '[
        {"id":"positions_gallery","name":"Positions Gallery","description":"100+ positions with visual guides","icon":"Heart","category":"positions"},
        {"id":"position_details","name":"Position Details","description":"Detailed instructions and tips","icon":"Info","category":"positions"},
        {"id":"position_favorites","name":"Favorites","description":"Save and organize favorites","icon":"Star","category":"positions"},
        {"id":"position_filters","name":"Advanced Filters","description":"Filter by difficulty, category, and more","icon":"Filter","category":"positions"},
        {"id":"position_playlists","name":"Position Playlists","description":"Create custom playlists","icon":"List","category":"positions"},
        {"id":"video_library","name":"Video Library","description":"Premium adult video content library","icon":"Video","category":"videos"},
        {"id":"video_streaming","name":"HD Streaming","description":"Stream in high definition","icon":"Play","category":"videos"},
        {"id":"video_downloads","name":"Offline Downloads","description":"Download for offline viewing","icon":"Download","category":"videos"},
        {"id":"video_playlists","name":"Video Playlists","description":"Create and manage playlists","icon":"List","category":"videos"},
        {"id":"video_progress","name":"Progress Tracking","description":"Track viewing progress","icon":"CheckCircle","category":"videos"},
        {"id":"multi_camera","name":"Multi-Camera Recording","description":"Record with multiple cameras","icon":"Camera","category":"advanced"},
        {"id":"intimate_dates","name":"Intimate Date Planner","description":"Plan and schedule dates","icon":"Calendar","category":"advanced"},
        {"id":"ai_companion","name":"AI Companion Chat","description":"AI companion suggestions","icon":"MessageSquare","category":"advanced"},
        {"id":"partner_video_sync","name":"Partner Video Sync","description":"Sync recordings with partner","icon":"Link","category":"advanced"}
      ]'::jsonb,
      ARRAY['dlc-positions','dlc-videos']::TEXT[],
      '1.0.0',
      '2024.12.1',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      true,
      5,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-complete',
      'Ultimate Complete Pack',
      'bundle',
      'The complete experience - all premium features unlocked forever with lifetime access',
      'Everything included: Positions, Videos, Analytics, Community, Advanced features. Lifetime access and updates.',
      'The ultimate experience',
      39.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":35.99,"GBP":31.99,"CAD":49.99}'::jsonb,
      '[
        {"id":"positions_gallery","name":"Positions Gallery","description":"100+ positions with visual guides","icon":"Heart","category":"positions"},
        {"id":"position_details","name":"Position Details","description":"Detailed instructions and tips","icon":"Info","category":"positions"},
        {"id":"position_favorites","name":"Favorites","description":"Save and organize favorites","icon":"Star","category":"positions"},
        {"id":"position_filters","name":"Advanced Filters","description":"Filter by difficulty, category, and more","icon":"Filter","category":"positions"},
        {"id":"position_playlists","name":"Position Playlists","description":"Create custom playlists","icon":"List","category":"positions"},
        {"id":"video_library","name":"Video Library","description":"Premium adult video content library","icon":"Video","category":"videos"},
        {"id":"video_streaming","name":"HD Streaming","description":"Stream in high definition","icon":"Play","category":"videos"},
        {"id":"video_downloads","name":"Offline Downloads","description":"Download for offline viewing","icon":"Download","category":"videos"},
        {"id":"video_playlists","name":"Video Playlists","description":"Create and manage playlists","icon":"List","category":"videos"},
        {"id":"video_progress","name":"Progress Tracking","description":"Track viewing progress","icon":"CheckCircle","category":"videos"},
        {"id":"wellness_analytics","name":"Wellness Analytics","description":"Detailed wellness tracking","icon":"BarChart","category":"analytics"},
        {"id":"partner_sync","name":"Partner Sync","description":"Sync data with your partner","icon":"Users","category":"analytics"},
        {"id":"intimate_reports","name":"Intimate Reports","description":"Generate detailed reports","icon":"FileText","category":"analytics"},
        {"id":"trend_analysis","name":"Trend Analysis","description":"Analyze patterns and trends","icon":"TrendingUp","category":"analytics"},
        {"id":"relationship_insights","name":"Relationship Insights","description":"Insights and recommendations","icon":"Lightbulb","category":"analytics"},
        {"id":"private_forum","name":"Private Forum","description":"Private community forum","icon":"MessageCircle","category":"community"},
        {"id":"private_groups","name":"Private Groups","description":"Join or create private groups","icon":"Users","category":"community"},
        {"id":"expert_qa","name":"Expert Q&A","description":"Ask questions to verified experts","icon":"HelpCircle","category":"community"},
        {"id":"creator_marketplace","name":"Creator Marketplace","description":"Premium content from creators","icon":"ShoppingBag","category":"marketplace"},
        {"id":"exclusive_content","name":"Exclusive Content","description":"Members-only content","icon":"Lock","category":"community"},
        {"id":"multi_camera","name":"Multi-Camera Recording","description":"Record with multiple cameras","icon":"Camera","category":"advanced"},
        {"id":"intimate_dates","name":"Intimate Date Planner","description":"Plan and schedule dates","icon":"Calendar","category":"advanced"},
        {"id":"ai_companion","name":"AI Companion Chat","description":"AI companion suggestions","icon":"MessageSquare","category":"advanced"},
        {"id":"partner_video_sync","name":"Partner Video Sync","description":"Sync recordings with partner","icon":"Link","category":"advanced"}
      ]'::jsonb,
      ARRAY['dlc-positions','dlc-videos','dlc-intimate','dlc-creator','dlc-advanced']::TEXT[],
      '1.0.0',
      '2024.12.1',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      true,
      6,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-subscription',
      'All-Access Pass',
      'subscription',
      'Full access to everything with continuous updates and priority support',
      'Subscription access to all DLC features and updates. Cancel anytime.',
      'All access, always updated',
      9.99::DECIMAL(10,2),
      'subscription',
      'monthly',
      '{"EUR":8.99,"GBP":7.99,"CAD":12.99}'::jsonb,
      '[
        {"id":"positions_gallery","name":"Positions Gallery","description":"100+ positions with visual guides","icon":"Heart","category":"positions"},
        {"id":"video_library","name":"Video Library","description":"Premium adult video content library","icon":"Video","category":"videos"},
        {"id":"wellness_analytics","name":"Wellness Analytics","description":"Detailed wellness tracking","icon":"BarChart","category":"analytics"},
        {"id":"private_forum","name":"Private Forum","description":"Private community forum","icon":"MessageCircle","category":"community"},
        {"id":"multi_camera","name":"Multi-Camera Recording","description":"Record with multiple cameras","icon":"Camera","category":"advanced"}
      ]'::jsonb,
      ARRAY['dlc-positions','dlc-videos','dlc-intimate','dlc-creator','dlc-advanced']::TEXT[],
      '1.0.0',
      '2024.12.1',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      7,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    )
  ) AS t(
    package_id,
    package_name,
    package_type,
    safe_description,
    full_description,
    marketing_tagline,
    price_usd,
    price_type,
    subscription_interval,
    regional_pricing,
    features,
    included_packages,
    version,
    content_version,
    min_app_version,
    max_app_version,
    content_changelog,
    is_active,
    is_featured,
    display_order,
    content_rating,
    preview_images,
    preview_video_url,
    localized_names,
    localized_descriptions
  )
)
INSERT INTO dlc_packages (
  package_id,
  package_name,
  package_type,
  safe_description,
  full_description,
  marketing_tagline,
  price_usd,
  price_type,
  subscription_interval,
  regional_pricing,
  features,
  included_packages,
  version,
  content_version,
  min_app_version,
  max_app_version,
  content_changelog,
  is_active,
  is_featured,
  display_order,
  content_rating,
  preview_images,
  preview_video_url,
  localized_names,
  localized_descriptions
)
SELECT
  package_id,
  package_name,
  package_type,
  safe_description,
  full_description,
  marketing_tagline,
  price_usd,
  price_type,
  subscription_interval,
  regional_pricing,
  features,
  included_packages,
  version,
  content_version,
  min_app_version,
  max_app_version,
  content_changelog,
  is_active,
  is_featured,
  display_order,
  content_rating,
  preview_images,
  preview_video_url,
  localized_names,
  localized_descriptions
FROM catalog
ON CONFLICT (package_id) DO UPDATE SET
  package_name = EXCLUDED.package_name,
  package_type = EXCLUDED.package_type,
  safe_description = EXCLUDED.safe_description,
  full_description = EXCLUDED.full_description,
  marketing_tagline = EXCLUDED.marketing_tagline,
  price_usd = EXCLUDED.price_usd,
  price_type = EXCLUDED.price_type,
  subscription_interval = EXCLUDED.subscription_interval,
  regional_pricing = EXCLUDED.regional_pricing,
  features = EXCLUDED.features,
  included_packages = EXCLUDED.included_packages,
  version = EXCLUDED.version,
  content_version = EXCLUDED.content_version,
  min_app_version = EXCLUDED.min_app_version,
  max_app_version = EXCLUDED.max_app_version,
  content_changelog = EXCLUDED.content_changelog,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order,
  content_rating = EXCLUDED.content_rating,
  preview_images = EXCLUDED.preview_images,
  preview_video_url = EXCLUDED.preview_video_url,
  localized_names = EXCLUDED.localized_names,
  localized_descriptions = EXCLUDED.localized_descriptions,
  updated_at = NOW();



-- END MIGRATION: 20251212094000_dlc_catalog_and_stripe.sql

-- BEGIN MIGRATION: 20251213000000_stripe_webhook_events.sql

-- =============================================
-- Stripe Webhook Event Idempotency Ledger
-- Migration: 20251213000000_stripe_webhook_events.sql
-- Description: Tracks processed Stripe webhook events to guarantee idempotency
-- =============================================

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  stripe_created_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'skipped')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status ON stripe_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_received_at ON stripe_webhook_events(received_at);

-- Service role processes webhooks; keep table locked down for clients.
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;



-- END MIGRATION: 20251213000000_stripe_webhook_events.sql

-- BEGIN MIGRATION: 20251213000001_user_subscriptions_compat.sql

-- =============================================
-- user_subscriptions compatibility + forward schema
-- Migration: 20251213000001_user_subscriptions_compat.sql
-- Description: Ensures columns referenced by app + webhooks exist (idempotent)
-- =============================================

ALTER TABLE IF EXISTS public.user_subscriptions
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT,
  ADD COLUMN IF NOT EXISTS plan_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Helpful indexes (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_price_id ON public.user_subscriptions(stripe_price_id);



-- END MIGRATION: 20251213000001_user_subscriptions_compat.sql

-- BEGIN MIGRATION: 20251213000002_feedback_hub.sql

-- Feedback Hub: user-submitted bugs, wishlist items, feature/expansion requests
-- Idempotent and safe to re-run.

CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  kind TEXT NOT NULL CHECK (kind IN ('bug','glitch','error','feature_request','expansion_request','wishlist','general','praise')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  rating SMALLINT CHECK (rating >= 0 AND rating <= 10),
  sentiment TEXT CHECK (sentiment IN ('love','like','neutral','dislike','hate')),
  severity TEXT CHECK (severity IN ('low','medium','high','critical')),
  frequency TEXT CHECK (frequency IN ('once','sometimes','often','always')),

  steps_to_reproduce TEXT,
  expected TEXT,
  actual TEXT,
  tags TEXT[],

  allow_contact BOOLEAN NOT NULL DEFAULT FALSE,
  contact_email TEXT,

  attachments JSONB,
  environment JSONB,
  audit_snapshot JSONB,
  source TEXT NOT NULL DEFAULT 'settings_feedback_hub',

  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','triaged','in_progress','resolved','won''t_fix','duplicate')),
  admin_response TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_feedback_user_id_idx ON public.user_feedback (user_id);
CREATE INDEX IF NOT EXISTS user_feedback_status_idx ON public.user_feedback (status);
CREATE INDEX IF NOT EXISTS user_feedback_created_at_idx ON public.user_feedback (created_at DESC);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can read their own feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_feedback' AND policyname = 'Users can view own feedback'
  ) THEN
    CREATE POLICY "Users can view own feedback" ON public.user_feedback
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can create feedback for themselves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_feedback' AND policyname = 'Users can create own feedback'
  ) THEN
    CREATE POLICY "Users can create own feedback" ON public.user_feedback
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own feedback (limited to their rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_feedback' AND policyname = 'Users can update own feedback'
  ) THEN
    CREATE POLICY "Users can update own feedback" ON public.user_feedback
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Service role can manage all feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_feedback' AND policyname = 'Service role can manage feedback'
  ) THEN
    CREATE POLICY "Service role can manage feedback" ON public.user_feedback
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_feedback_updated_at ON public.user_feedback;
CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_user_feedback_updated_at();



-- END MIGRATION: 20251213000002_feedback_hub.sql

-- BEGIN MIGRATION: 20251213000003_forum_counters.sql

-- Community Forum counters + reputation maintenance (threads/posts/interactions)
-- Depends on tables from 20251207000010_community_forum.sql
-- Idempotent and safe to re-run.

CREATE OR REPLACE FUNCTION public.forum_reputation_ensure(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO forum_user_reputation (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.forum_reputation_recompute_level(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pts integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(reputation_points, 0) INTO pts
  FROM forum_user_reputation
  WHERE user_id = p_user_id;

  UPDATE forum_user_reputation
  SET level = GREATEST(1, FLOOR(pts / 100.0)::int + 1),
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- Threads: update category counters + author reputation
CREATE OR REPLACE FUNCTION public.forum_threads_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE forum_categories
  SET thread_count = COALESCE(thread_count, 0) + 1,
      last_activity_at = NOW(),
      updated_at = NOW()
  WHERE id = NEW.category_id;

  PERFORM public.forum_reputation_ensure(NEW.user_id);
  UPDATE forum_user_reputation
  SET thread_count = COALESCE(thread_count, 0) + 1,
      reputation_points = COALESCE(reputation_points, 0) + 5,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;

  PERFORM public.forum_reputation_recompute_level(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_threads_after_insert ON forum_threads;
CREATE TRIGGER trg_forum_threads_after_insert
AFTER INSERT ON forum_threads
FOR EACH ROW
EXECUTE FUNCTION public.forum_threads_after_insert();

-- Posts: update thread + category counters + author reputation
CREATE OR REPLACE FUNCTION public.forum_posts_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cat_id uuid;
BEGIN
  SELECT category_id INTO cat_id FROM forum_threads WHERE id = NEW.thread_id;

  UPDATE forum_threads
  SET reply_count = COALESCE(reply_count, 0) + 1,
      last_reply_at = NOW(),
      last_reply_by = NEW.user_id,
      updated_at = NOW()
  WHERE id = NEW.thread_id;

  UPDATE forum_categories
  SET post_count = COALESCE(post_count, 0) + 1,
      last_activity_at = NOW(),
      updated_at = NOW()
  WHERE id = cat_id;

  PERFORM public.forum_reputation_ensure(NEW.user_id);
  UPDATE forum_user_reputation
  SET post_count = COALESCE(post_count, 0) + 1,
      reputation_points = COALESCE(reputation_points, 0) + 2,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;

  PERFORM public.forum_reputation_recompute_level(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_posts_after_insert ON forum_posts;
CREATE TRIGGER trg_forum_posts_after_insert
AFTER INSERT ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION public.forum_posts_after_insert();

-- Interactions: update like/helpful counts + recipient reputation
CREATE OR REPLACE FUNCTION public.forum_interactions_apply_delta(p_content_type text, p_content_id uuid, p_interaction_type text, p_delta int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid;
BEGIN
  IF p_delta = 0 THEN
    RETURN;
  END IF;

  IF p_interaction_type = 'like' THEN
    IF p_content_type = 'thread' THEN
      UPDATE forum_threads
      SET like_count = GREATEST(0, COALESCE(like_count, 0) + p_delta),
          updated_at = NOW()
      WHERE id = p_content_id;
    ELSIF p_content_type = 'post' THEN
      UPDATE forum_posts
      SET like_count = GREATEST(0, COALESCE(like_count, 0) + p_delta),
          updated_at = NOW()
      WHERE id = p_content_id;
    END IF;
  ELSIF p_interaction_type = 'helpful' THEN
    IF p_content_type = 'thread' THEN
      UPDATE forum_threads
      SET helpful_count = GREATEST(0, COALESCE(helpful_count, 0) + p_delta),
          updated_at = NOW()
      WHERE id = p_content_id;
      SELECT user_id INTO target_user FROM forum_threads WHERE id = p_content_id;
    ELSIF p_content_type = 'post' THEN
      UPDATE forum_posts
      SET helpful_count = GREATEST(0, COALESCE(helpful_count, 0) + p_delta),
          updated_at = NOW()
      WHERE id = p_content_id;
      SELECT user_id INTO target_user FROM forum_posts WHERE id = p_content_id;
    END IF;

    IF target_user IS NOT NULL THEN
      PERFORM public.forum_reputation_ensure(target_user);
      UPDATE forum_user_reputation
      SET helpful_marks_received = GREATEST(0, COALESCE(helpful_marks_received, 0) + p_delta),
          reputation_points = GREATEST(0, COALESCE(reputation_points, 0) + p_delta),
          updated_at = NOW()
      WHERE user_id = target_user;
      PERFORM public.forum_reputation_recompute_level(target_user);
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.forum_interactions_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.forum_interactions_apply_delta(NEW.content_type, NEW.content_id, NEW.interaction_type, 1);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.forum_interactions_after_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.forum_interactions_apply_delta(OLD.content_type, OLD.content_id, OLD.interaction_type, -1);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_interactions_after_insert ON forum_interactions;
CREATE TRIGGER trg_forum_interactions_after_insert
AFTER INSERT ON forum_interactions
FOR EACH ROW
EXECUTE FUNCTION public.forum_interactions_after_insert();

DROP TRIGGER IF EXISTS trg_forum_interactions_after_delete ON forum_interactions;
CREATE TRIGGER trg_forum_interactions_after_delete
AFTER DELETE ON forum_interactions
FOR EACH ROW
EXECUTE FUNCTION public.forum_interactions_after_delete();



-- END MIGRATION: 20251213000003_forum_counters.sql

-- BEGIN MIGRATION: 20251213000004_group_chat_creator_join.sql

-- Allow group creators to add themselves as members (including private groups).
-- This complements the existing "Users can join public groups..." policy.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'group_chat_members'
      AND policyname = 'Creators can self-join their own groups'
  ) THEN
    CREATE POLICY "Creators can self-join their own groups"
      ON public.group_chat_members
      FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.group_chats gc
          WHERE gc.id = group_chat_members.group_id
            AND gc.created_by = auth.uid()
        )
      );
  END IF;
END
$$;



-- END MIGRATION: 20251213000004_group_chat_creator_join.sql

-- BEGIN MIGRATION: 20251213120000_app_userbase_measurement_averages.sql

-- App userbase measurement averages (aggregate only)
-- Provides privacy-safe length/girth averages across all users' scans
-- NOTE: Returns NULL averages until k-anonymity threshold is met.

CREATE OR REPLACE FUNCTION public.get_app_userbase_measurement_averages(p_days integer DEFAULT 3650, p_min_sample integer DEFAULT 25)
RETURNS TABLE (
  sample_size integer,
  is_sufficient boolean,
  avg_length numeric,
  avg_girth numeric,
  window_days integer,
  computed_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT
      s.length::numeric AS length,
      s.girth::numeric AS girth
    FROM public.scans s
    WHERE
      s.scanned_at >= (now() - (p_days::text || ' days')::interval)
      AND (s.scan_type IS NULL OR s.scan_type <> 'ai_analysis')
      AND (s.length IS NOT NULL OR s.girth IS NOT NULL)
  ),
  stats AS (
    SELECT
      COUNT(*)::integer AS n,
      AVG(length) FILTER (WHERE length IS NOT NULL) AS avg_len,
      AVG(girth) FILTER (WHERE girth IS NOT NULL) AS avg_gir
    FROM filtered
  )
  SELECT
    stats.n AS sample_size,
    (stats.n >= GREATEST(1, p_min_sample)) AS is_sufficient,
    CASE WHEN stats.n >= GREATEST(1, p_min_sample) THEN stats.avg_len ELSE NULL END AS avg_length,
    CASE WHEN stats.n >= GREATEST(1, p_min_sample) THEN stats.avg_gir ELSE NULL END AS avg_girth,
    p_days AS window_days,
    now() AS computed_at
  FROM stats;
$$;

REVOKE ALL ON FUNCTION public.get_app_userbase_measurement_averages(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_app_userbase_measurement_averages(integer, integer) TO authenticated;



-- END MIGRATION: 20251213120000_app_userbase_measurement_averages.sql

-- BEGIN MIGRATION: 20251213160716_48f31b4e-8dd5-4015-996b-b387fc13d441.sql

-- Create scans table (core measurement storage)
CREATE TABLE public.scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  length NUMERIC,
  girth NUMERIC,
  overall_health TEXT,
  confidence_level NUMERIC,
  urgency TEXT,
  analysis_result JSONB
);

ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scans" ON public.scans FOR ALL USING (auth.uid() = user_id);

-- Create ai_scan_analysis table
CREATE TABLE public.ai_scan_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id),
  user_id UUID NOT NULL,
  analysis_type TEXT NOT NULL DEFAULT 'health_detection',
  detected_conditions JSONB DEFAULT '[]',
  risk_factors JSONB DEFAULT '[]',
  health_alerts JSONB DEFAULT '[]',
  suggested_measurements JSONB,
  measurement_confidence NUMERIC,
  measurement_reasoning TEXT,
  overall_quality_score NUMERIC,
  quality_breakdown JSONB,
  quality_recommendations TEXT[],
  anomalies_detected JSONB DEFAULT '[]',
  anomaly_confidence NUMERIC,
  previous_scan_id UUID,
  comparison_results JSONB,
  trend_direction TEXT,
  trend_data JSONB,
  visualization_url TEXT,
  ai_model_version TEXT,
  ai_model_confidence NUMERIC,
  processing_time_ms INTEGER,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ai_scan_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ai_scan_analysis" ON public.ai_scan_analysis FOR ALL USING (auth.uid() = user_id);

-- Create quality_assessment_history table
CREATE TABLE public.quality_assessment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id),
  user_id UUID NOT NULL,
  overall_score NUMERIC NOT NULL,
  lighting_score NUMERIC,
  focus_score NUMERIC,
  angle_score NUMERIC,
  distance_score NUMERIC,
  stability_score NUMERIC,
  contrast_score NUMERIC,
  recommendations TEXT[],
  critical_issues TEXT[],
  compared_to_average BOOLEAN DEFAULT false,
  average_score NUMERIC,
  percentile_rank NUMERIC,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.quality_assessment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quality_assessment_history" ON public.quality_assessment_history FOR ALL USING (auth.uid() = user_id);

-- Create anomaly_detection_log table
CREATE TABLE public.anomaly_detection_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id),
  user_id UUID NOT NULL,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  confidence NUMERIC NOT NULL,
  description TEXT NOT NULL,
  location JSONB,
  affected_measurements TEXT[],
  compared_to_previous BOOLEAN DEFAULT false,
  previous_scan_id UUID,
  deviation_amount NUMERIC,
  recommendation TEXT,
  requires_attention BOOLEAN DEFAULT false,
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.anomaly_detection_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own anomaly_detection_log" ON public.anomaly_detection_log FOR ALL USING (auth.uid() = user_id);

-- Create measurement_suggestions table
CREATE TABLE public.measurement_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID REFERENCES public.scans(id),
  user_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL,
  current_value NUMERIC,
  suggested_value NUMERIC NOT NULL,
  improvement_expected NUMERIC NOT NULL,
  reasoning TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  is_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.measurement_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own measurement_suggestions" ON public.measurement_suggestions FOR ALL USING (auth.uid() = user_id);

-- Create real_time_scan_feedback table
CREATE TABLE public.real_time_scan_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  feedback_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.real_time_scan_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own real_time_scan_feedback" ON public.real_time_scan_feedback FOR ALL USING (auth.uid() = user_id);

-- Create health_trend_visualizations table
CREATE TABLE public.health_trend_visualizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  visualization_type TEXT NOT NULL,
  trend_data JSONB NOT NULL DEFAULT '{}',
  time_period_days INTEGER,
  data_points JSONB,
  chart_image_url TEXT,
  chart_config JSONB,
  insights TEXT[],
  predictions JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.health_trend_visualizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own health_trend_visualizations" ON public.health_trend_visualizations FOR ALL USING (auth.uid() = user_id);

-- Create learning_paths table
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  path_name TEXT NOT NULL,
  path_type TEXT NOT NULL DEFAULT 'custom',
  course_ids UUID[] DEFAULT '{}',
  current_course_index INTEGER DEFAULT 0,
  progress_percentage NUMERIC DEFAULT 0,
  estimated_completion_date DATE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own learning_paths" ON public.learning_paths FOR ALL USING (auth.uid() = user_id);

-- Create learning_recommendations table
CREATE TABLE public.learning_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.learning_courses(id),
  priority INTEGER DEFAULT 0,
  confidence_score NUMERIC,
  recommendation_reason TEXT,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.learning_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own learning_recommendations" ON public.learning_recommendations FOR ALL USING (auth.uid() = user_id);

-- Create marketplace_categories table
CREATE TABLE public.marketplace_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  parent_id UUID REFERENCES public.marketplace_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active marketplace_categories" ON public.marketplace_categories FOR SELECT USING (is_active = true);

-- Create marketplace_items table
CREATE TABLE public.marketplace_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.marketplace_categories(id),
  seller_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  item_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  average_rating NUMERIC,
  rating_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published marketplace_items" ON public.marketplace_items FOR SELECT USING (status = 'published');
CREATE POLICY "Sellers can manage own marketplace_items" ON public.marketplace_items FOR ALL USING (auth.uid() = seller_id);

-- Create provider_reports table
CREATE TABLE public.provider_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  report_title TEXT NOT NULL,
  report_content JSONB DEFAULT '{}',
  findings TEXT[],
  recommendations TEXT[],
  status TEXT DEFAULT 'draft',
  is_shared_with_patient BOOLEAN DEFAULT false,
  shared_at TIMESTAMP WITH TIME ZONE,
  file_url TEXT,
  file_format TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.provider_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage own reports" ON public.provider_reports FOR ALL USING (auth.uid() = provider_id);
CREATE POLICY "Patients can view shared reports" ON public.provider_reports FOR SELECT USING (auth.uid() = patient_id AND is_shared_with_patient = true);

-- END MIGRATION: 20251213160716_48f31b4e-8dd5-4015-996b-b387fc13d441.sql

-- BEGIN MIGRATION: 20251214050830_b394dc89-f277-4d88-ba9d-85cf5c6d6a7d.sql

-- Create user-uploads storage bucket with proper security
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  false,
  20971520,
  ARRAY['application/json', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for user-uploads bucket
CREATE POLICY "Users can upload own files to user-uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own files in user-uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files in user-uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- END MIGRATION: 20251214050830_b394dc89-f277-4d88-ba9d-85cf5c6d6a7d.sql

-- BEGIN MIGRATION: 20251214143000_nsfw_video_dlc_pack_fk.sql

-- Migration: Add FK from nsfw_video_content.dlc_pack_id -> dlc_packages.id
-- Idempotent via catalog check.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nsfw_video_content_dlc_pack_id_fkey'
  ) THEN
    ALTER TABLE nsfw_video_content
      ADD CONSTRAINT nsfw_video_content_dlc_pack_id_fkey
      FOREIGN KEY (dlc_pack_id) REFERENCES dlc_packages(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_dlc_pack_id ON nsfw_video_content(dlc_pack_id);



-- END MIGRATION: 20251214143000_nsfw_video_dlc_pack_fk.sql

-- BEGIN MIGRATION: 20251214190001_dlc_wishlist_packages.sql

-- Migration: DLC wishlist for dlc_packages
-- Purpose: Persist DLC store wishlist for the new dlc_packages system
-- Idempotent / safe to re-run

CREATE TABLE IF NOT EXISTS dlc_wishlist_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id) ON DELETE CASCADE,

  priority INTEGER DEFAULT 0,
  notify_on_sale BOOLEAN DEFAULT true,
  notify_on_release BOOLEAN DEFAULT true,
  notes TEXT,

  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, package_id)
);

CREATE INDEX IF NOT EXISTS idx_dlc_wishlist_packages_user_id ON dlc_wishlist_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_wishlist_packages_package_id ON dlc_wishlist_packages(package_id);

ALTER TABLE dlc_wishlist_packages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dlc_wishlist_packages'
      AND policyname = 'Users can manage own DLC wishlist packages'
  ) THEN
    CREATE POLICY "Users can manage own DLC wishlist packages"
      ON dlc_wishlist_packages
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


-- END MIGRATION: 20251214190001_dlc_wishlist_packages.sql

-- BEGIN MIGRATION: 20251214193000_learning_course_reviews.sql

-- Migration: learning_course_reviews
-- Adds course review/rating support for Interactive Learning
-- Idempotent / safe to re-run

CREATE TABLE IF NOT EXISTS learning_course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_course_reviews_course_id ON learning_course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_course_reviews_user_id ON learning_course_reviews(user_id);

ALTER TABLE learning_course_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'learning_course_reviews'
      AND policyname = 'Anyone can view course reviews'
  ) THEN
    CREATE POLICY "Anyone can view course reviews"
      ON learning_course_reviews
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'learning_course_reviews'
      AND policyname = 'Users can manage own course reviews'
  ) THEN
    CREATE POLICY "Users can manage own course reviews"
      ON learning_course_reviews
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_learning_course_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_learning_course_reviews_updated_at ON learning_course_reviews;
CREATE TRIGGER trg_learning_course_reviews_updated_at
  BEFORE UPDATE ON learning_course_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_course_reviews_updated_at();


-- END MIGRATION: 20251214193000_learning_course_reviews.sql

-- BEGIN MIGRATION: 20251214194000_email_marketing.sql

-- Migration: Email Marketing System
-- Creates tables for email templates, segments, campaigns, and send events
-- Idempotent / safe to re-run

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('welcome', 'onboarding', 'engagement', 'retention', 'promotional', 'transactional')),
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, category)
);

CREATE TABLE IF NOT EXISTS email_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  segment_id UUID REFERENCES email_segments(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_send_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  provider TEXT,
  provider_message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_send_events_campaign_id ON email_send_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_send_events_user_id ON email_send_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_send_events_status ON email_send_events(status);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_send_events ENABLE ROW LEVEL SECURITY;

-- Templates: authenticated read; admins manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_templates' AND policyname='Authenticated users can view email templates'
  ) THEN
    CREATE POLICY "Authenticated users can view email templates" ON email_templates
      FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_templates' AND policyname='Admins can manage email templates'
  ) THEN
    CREATE POLICY "Admins can manage email templates" ON email_templates
      FOR ALL
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_segments' AND policyname='Admins can manage email segments'
  ) THEN
    CREATE POLICY "Admins can manage email segments" ON email_segments
      FOR ALL
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_campaigns' AND policyname='Admins can manage email campaigns'
  ) THEN
    CREATE POLICY "Admins can manage email campaigns" ON email_campaigns
      FOR ALL
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='email_send_events' AND policyname='Admins can view email send events'
  ) THEN
    CREATE POLICY "Admins can view email send events" ON email_send_events
      FOR SELECT
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_email_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_templates_updated_at ON email_templates;
CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_marketing_updated_at();

DROP TRIGGER IF EXISTS trg_email_segments_updated_at ON email_segments;
CREATE TRIGGER trg_email_segments_updated_at
  BEFORE UPDATE ON email_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_email_marketing_updated_at();

DROP TRIGGER IF EXISTS trg_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER trg_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_email_marketing_updated_at();


-- END MIGRATION: 20251214194000_email_marketing.sql

-- BEGIN MIGRATION: 20251214195000_interactive_learning_admin_policies.sql

-- Migration: Interactive Learning admin write policies
-- Allows admin/super_admin to manage courses/modules/lessons/quizzes
-- Idempotent / safe to re-run

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE IF EXISTS learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_quizzes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- learning_modules
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='learning_modules' AND policyname='Admins can manage learning modules'
  ) THEN
    CREATE POLICY "Admins can manage learning modules"
      ON learning_modules
      FOR ALL
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));
  END IF;

  -- learning_lessons
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='learning_lessons' AND policyname='Admins can manage learning lessons'
  ) THEN
    CREATE POLICY "Admins can manage learning lessons"
      ON learning_lessons
      FOR ALL
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));
  END IF;

  -- learning_quizzes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='learning_quizzes' AND policyname='Admins can manage learning quizzes'
  ) THEN
    CREATE POLICY "Admins can manage learning quizzes"
      ON learning_quizzes
      FOR ALL
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));
  END IF;
END $$;


-- END MIGRATION: 20251214195000_interactive_learning_admin_policies.sql

-- BEGIN MIGRATION: 20251215011557_7ce52efd-87e4-4388-abe5-2b7fcd26375f.sql

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

ALTER TABLE public.dlc_license_devices ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can manage own device tokens" ON public.device_tokens
  FOR ALL USING (auth.uid() = user_id);

-- END MIGRATION: 20251215011557_7ce52efd-87e4-4388-abe5-2b7fcd26375f.sql

-- BEGIN MIGRATION: 20251215020000_stripe_webhook_events_and_device_tokens_compat.sql

-- ============================================================
-- Compatibility migration: unify schema expectations
-- - stripe_webhook_events is used by edge function `stripe-webhook`
-- - device_tokens is used by push notification utilities + retention cleanup
--
-- This migration is idempotent and safe to re-run.
-- ============================================================

-- -----------------------------
-- stripe_webhook_events
-- -----------------------------
DO $$
BEGIN
  IF to_regclass('public.stripe_webhook_events') IS NOT NULL THEN
    -- Columns used by the app-generated types / older compatibility layers
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb;
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS processed boolean DEFAULT false;
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

    -- Columns used by edge function `stripe-webhook` (more detailed lifecycle)
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS stripe_created_at timestamptz;
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS received_at timestamptz DEFAULT now();
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS status text DEFAULT 'received';
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

    -- Backfill (safe no-ops if already populated)
    UPDATE public.stripe_webhook_events SET id = gen_random_uuid() WHERE id IS NULL;
    UPDATE public.stripe_webhook_events SET payload = '{}'::jsonb WHERE payload IS NULL;
    UPDATE public.stripe_webhook_events SET processed = false WHERE processed IS NULL;
    UPDATE public.stripe_webhook_events SET received_at = now() WHERE received_at IS NULL;
    UPDATE public.stripe_webhook_events SET status = 'received' WHERE status IS NULL;
    UPDATE public.stripe_webhook_events SET metadata = '{}'::jsonb WHERE metadata IS NULL;
    UPDATE public.stripe_webhook_events
      SET created_at = COALESCE(created_at, received_at, now())
      WHERE created_at IS NULL;

    -- Ensure event_id can be used for idempotent upserts (onConflict: 'event_id')
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id_unique ON public.stripe_webhook_events(event_id)';

    -- Add a status check constraint if absent (keeps status values sane)
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'stripe_webhook_events_status_check'
        AND conrelid = 'public.stripe_webhook_events'::regclass
    ) THEN
      BEGIN
        ALTER TABLE public.stripe_webhook_events
          ADD CONSTRAINT stripe_webhook_events_status_check
          CHECK (status IN ('received', 'processing', 'processed', 'failed', 'skipped'));
      EXCEPTION WHEN others THEN
        -- If an incompatible constraint already exists (or permissions differ), keep going.
        NULL;
      END;
    END IF;

    -- Tighten NOT NULL where possible (ignore if blocked by existing data/constraints)
    BEGIN
      ALTER TABLE public.stripe_webhook_events ALTER COLUMN id SET NOT NULL;
    EXCEPTION WHEN others THEN
      NULL;
    END;

    BEGIN
      ALTER TABLE public.stripe_webhook_events ALTER COLUMN payload SET NOT NULL;
    EXCEPTION WHEN others THEN
      NULL;
    END;

    -- Ensure RLS is enabled (service role bypasses; clients remain locked down)
    ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- -----------------------------
-- device_tokens
-- -----------------------------
DO $$
BEGIN
  IF to_regclass('public.device_tokens') IS NOT NULL THEN
    -- Some parts of the app expect an is_active flag.
    ALTER TABLE public.device_tokens
      ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

    UPDATE public.device_tokens SET is_active = true WHERE is_active IS NULL;

    ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;



-- END MIGRATION: 20251215020000_stripe_webhook_events_and_device_tokens_compat.sql

-- BEGIN MIGRATION: 20251215021000_dlc_tables_compat.sql

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



-- END MIGRATION: 20251215021000_dlc_tables_compat.sql

-- BEGIN MIGRATION: 20251215030000_add_super_admin_role.sql

-- Ensure app_role enum supports super_admin (idempotent on Postgres 15+)
DO $$
BEGIN
  BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
  EXCEPTION
    WHEN undefined_object THEN
      -- app_role may not exist in some environments yet; ignore
      NULL;
  END;
END $$;



-- END MIGRATION: 20251215030000_add_super_admin_role.sql

-- BEGIN MIGRATION: 20251215090000_user_position_media_overrides.sql

-- ============================================================================
-- User Position Media Overrides (NSFW Positions)
-- Allows users to replace a position's default media with their own uploads.
-- Idempotent + RLS-protected.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_position_media_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_key TEXT NOT NULL,
  media_kind TEXT NOT NULL CHECK (media_kind IN ('image', 'gif', 'video')),

  -- Supabase Storage reference (optional but recommended)
  bucket TEXT,
  storage_path TEXT,
  public_url TEXT,
  mime_type TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, position_key, media_kind)
);

CREATE INDEX IF NOT EXISTS idx_user_position_media_overrides_user_position
  ON public.user_position_media_overrides(user_id, position_key);

ALTER TABLE public.user_position_media_overrides ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_position_media_overrides'
      AND policyname = 'Users manage own position media overrides'
  ) THEN
    CREATE POLICY "Users manage own position media overrides"
      ON public.user_position_media_overrides
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;



-- END MIGRATION: 20251215090000_user_position_media_overrides.sql

-- BEGIN MIGRATION: 20251216170000_dlc_admin_import_pipeline.sql

-- Migration: Admin DLC content import pipeline (idempotent)
-- - Adds audit tables for imports
-- - Adds stable slug key for nsfw_video_content

-- Import job ledger
CREATE TABLE IF NOT EXISTS public.dlc_content_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  import_type text NOT NULL CHECK (import_type IN ('positions', 'videos')),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),

  source_file_name text,
  source_sha256 text,

  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_dlc_content_import_jobs_created_at ON public.dlc_content_import_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_dlc_content_import_jobs_type ON public.dlc_content_import_jobs(import_type);
CREATE INDEX IF NOT EXISTS idx_dlc_content_import_jobs_status ON public.dlc_content_import_jobs(status);

ALTER TABLE public.dlc_content_import_jobs ENABLE ROW LEVEL SECURITY;

-- Keep import jobs service-only (admin tools should use edge/service role)
DROP POLICY IF EXISTS "No public access to dlc_content_import_jobs" ON public.dlc_content_import_jobs;
CREATE POLICY "No public access to dlc_content_import_jobs"
  ON public.dlc_content_import_jobs FOR ALL
  USING (false);

-- Per-item results
CREATE TABLE IF NOT EXISTS public.dlc_content_import_job_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  job_id uuid NOT NULL REFERENCES public.dlc_content_import_jobs(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'skipped', 'failed')),
  error_message text,

  UNIQUE(job_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_dlc_content_import_job_items_job_id ON public.dlc_content_import_job_items(job_id);
CREATE INDEX IF NOT EXISTS idx_dlc_content_import_job_items_status ON public.dlc_content_import_job_items(status);

ALTER TABLE public.dlc_content_import_job_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access to dlc_content_import_job_items" ON public.dlc_content_import_job_items;
CREATE POLICY "No public access to dlc_content_import_job_items"
  ON public.dlc_content_import_job_items FOR ALL
  USING (false);

-- Stable key for NSFW video content to support idempotent imports
DO $$
BEGIN
  IF to_regclass('public.nsfw_video_content') IS NOT NULL THEN
    ALTER TABLE public.nsfw_video_content
      ADD COLUMN IF NOT EXISTS content_slug text;

    ALTER TABLE public.nsfw_video_content
      ADD COLUMN IF NOT EXISTS source_import_key text;

    -- Unique slug (nullable until populated)
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_nsfw_video_content_content_slug_unique ON public.nsfw_video_content(content_slug) WHERE content_slug IS NOT NULL';

    -- Optional unique source key for fully idempotent multi-source imports
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_nsfw_video_content_source_import_key_unique ON public.nsfw_video_content(source_import_key) WHERE source_import_key IS NOT NULL';
  END IF;
END $$;


-- END MIGRATION: 20251216170000_dlc_admin_import_pipeline.sql

-- BEGIN MIGRATION: 20251216171000_dlc_license_devices_primary.sql

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


-- END MIGRATION: 20251216171000_dlc_license_devices_primary.sql

-- BEGIN MIGRATION: 20251216172000_dlc_package_keyring.sql

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


-- END MIGRATION: 20251216172000_dlc_package_keyring.sql

-- BEGIN MIGRATION: 20251217000000_app_analytics_events.sql

-- =============================================
-- App Analytics Events (Privacy-consented product analytics)
-- Migration: 20251217000000_app_analytics_events.sql
-- Description: First-party event collection for growth funnel analysis
-- Notes:
-- - Idempotent (safe re-run)
-- - RLS: authenticated inserts only (limits abuse); users can read own events
-- =============================================

CREATE TABLE IF NOT EXISTS app_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,

  -- Event
  event_name TEXT NOT NULL,
  event_category TEXT,
  event_action TEXT,
  event_label TEXT,
  event_value NUMERIC,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Client context (best-effort)
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_platform TEXT,
  app_version TEXT,
  app_build TEXT,
  distribution_channel TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_analytics_events_user_id ON app_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_app_analytics_events_event_name ON app_analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_app_analytics_events_created_at ON app_analytics_events(created_at);

ALTER TABLE app_analytics_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert events for themselves.
DROP POLICY IF EXISTS "Users can insert own app analytics events" ON app_analytics_events;
CREATE POLICY "Users can insert own app analytics events"
  ON app_analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can read their own events.
DROP POLICY IF EXISTS "Users can view own app analytics events" ON app_analytics_events;
CREATE POLICY "Users can view own app analytics events"
  ON app_analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all analytics events.
DROP POLICY IF EXISTS "Service role can manage app analytics events" ON app_analytics_events;
CREATE POLICY "Service role can manage app analytics events"
  ON app_analytics_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');



-- END MIGRATION: 20251217000000_app_analytics_events.sql

-- BEGIN MIGRATION: 20251219044634_0d9aa75c-3cf8-4fef-9794-ab10d2570d45.sql

-- Compatibility migration (idempotent):
-- - Some environments already applied 20251217000000_app_analytics_events.sql
-- - This migration must NOT fail if the table/policies already exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'app_analytics_events'
  ) THEN
    -- Create app_analytics_events table for analytics tracking
    CREATE TABLE public.app_analytics_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      session_id TEXT,
      event_name TEXT NOT NULL,
      event_category TEXT,
      event_action TEXT,
      event_label TEXT,
      event_value NUMERIC,
      properties JSONB NOT NULL DEFAULT '{}'::jsonb,
      page_path TEXT,
      referrer TEXT,
      user_agent TEXT,
      device_platform TEXT,
      app_version TEXT,
      app_build TEXT,
      distribution_channel TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END
$$;

-- Enable RLS (safe if already enabled)
ALTER TABLE public.app_analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies (drop+recreate to ensure a consistent, safe rule-set)
DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.app_analytics_events;
CREATE POLICY "Users can insert own analytics events"
  ON public.app_analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own analytics events" ON public.app_analytics_events;
CREATE POLICY "Users can view own analytics events"
  ON public.app_analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add missing columns to dlc_packages
ALTER TABLE public.dlc_packages
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS included_packages TEXT[] DEFAULT '{}'::text[];

-- Add missing columns to dlc_age_verifications
ALTER TABLE public.dlc_age_verifications
ADD COLUMN IF NOT EXISTS adult_content_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_app_analytics_events_user_id ON public.app_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_app_analytics_events_created_at ON public.app_analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_app_analytics_events_event_name ON public.app_analytics_events(event_name);

-- END MIGRATION: 20251219044634_0d9aa75c-3cf8-4fef-9794-ab10d2570d45.sql

-- BEGIN MIGRATION: 20251219072226_0b68c1a9-04f0-46dc-bd32-a4913df5b14e.sql

-- Fix HIPAA audit logs to be append-only (users cannot UPDATE or DELETE their own logs)
-- First, drop any existing UPDATE/DELETE policies on hipaa_audit_logs
DROP POLICY IF EXISTS "Users can update own logs" ON public.hipaa_audit_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON public.hipaa_audit_logs;

-- Ensure only INSERT and SELECT policies exist for users
-- Check existing policies and create proper append-only structure

-- Drop all existing policies to recreate properly
DROP POLICY IF EXISTS "Users can view own logs" ON public.hipaa_audit_logs;
DROP POLICY IF EXISTS "Users can create own logs" ON public.hipaa_audit_logs;

-- Recreate with append-only pattern
CREATE POLICY "Users can view their own audit logs"
ON public.hipaa_audit_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create audit log entries"
ON public.hipaa_audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policies - making it append-only

-- END MIGRATION: 20251219072226_0b68c1a9-04f0-46dc-bd32-a4913df5b14e.sql

-- BEGIN MIGRATION: 20251220084336_bdd0c075-7cd0-4e84-8875-9feb2bea2894.sql

-- Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- END MIGRATION: 20251220084336_bdd0c075-7cd0-4e84-8875-9feb2bea2894.sql

-- BEGIN MIGRATION: 20251220120000_nsfw_topic_packs_and_topics_library.sql

-- Migration: NSFW Topic Packs + Topics Library (metadata-only scaffolding)
-- Goals:
-- - Add additional NSFW DLC "topic pack" catalog entries to dlc_packages (no content shipped)
-- - Add a DB-backed Topics Library for admin-imported items
-- - Extend admin import pipeline to allow import_type = 'topics'
-- Notes:
-- - Idempotent (safe to re-run)
-- - Does not delete or drop existing data

-- ------------------------------------------------------------
-- 1) Extend admin import job constraint: allow import_type 'topics'
-- ------------------------------------------------------------
DO $$
DECLARE c record;
BEGIN
  IF to_regclass('public.dlc_content_import_jobs') IS NULL THEN
    RETURN;
  END IF;

  -- Drop any existing CHECK constraints that reference import_type (name can vary by environment)
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.dlc_content_import_jobs'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%import_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.dlc_content_import_jobs DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;

  -- Recreate canonical constraint
  ALTER TABLE public.dlc_content_import_jobs
    ADD CONSTRAINT dlc_content_import_jobs_import_type_check
    CHECK (import_type IN ('positions', 'videos', 'topics'));
END $$;

-- ------------------------------------------------------------
-- 2) NSFW Topics taxonomy
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nsfw_topics (
  topic_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  requires_feature_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  content_rating TEXT NOT NULL DEFAULT '18+',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nsfw_topics_is_active ON public.nsfw_topics(is_active);
CREATE INDEX IF NOT EXISTS idx_nsfw_topics_sort_order ON public.nsfw_topics(sort_order);

ALTER TABLE public.nsfw_topics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='nsfw_topics' AND policyname='Anyone can view active nsfw_topics'
  ) THEN
    CREATE POLICY "Anyone can view active nsfw_topics"
      ON public.nsfw_topics
      FOR SELECT
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='nsfw_topics' AND policyname='Service role can manage nsfw_topics'
  ) THEN
    CREATE POLICY "Service role can manage nsfw_topics"
      ON public.nsfw_topics
      FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- Seed canonical topics (safe labels; content is imported separately)
INSERT INTO public.nsfw_topics (topic_id, display_name, description, requires_feature_id, sort_order, is_active, content_rating)
VALUES
  ('power_dynamics', 'Power Dynamics', 'Consent-focused power dynamics, communication, and safety-first guidance.', 'topic_power_dynamics', 10, true, '18+'),
  ('tantric', 'Tantric & Mindful Intimacy', 'Mindfulness, breathwork, connection, and slow intimacy practices.', 'topic_tantric', 20, true, '18+'),
  ('kama_sutra', 'Classic Texts & Positions', 'Classic position reference and historical context (adult).', 'topic_kama_sutra', 30, true, '18+'),
  ('roleplay', 'Roleplay & Fantasy', 'Communication, boundaries, and scenarios for consensual roleplay.', 'topic_roleplay', 40, true, '18+'),
  ('male_pleasure', 'Male Pleasure & Pelvic Health', 'Adult techniques with anatomy/safety framing; pelvic floor and prostate education.', 'topic_male_pleasure', 50, true, '18+')
ON CONFLICT (topic_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  requires_feature_id = EXCLUDED.requires_feature_id,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  content_rating = EXCLUDED.content_rating,
  updated_at = now();

-- ------------------------------------------------------------
-- 3) Topics Library items (content imported by admin pipeline)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nsfw_topic_library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL REFERENCES public.nsfw_topics(topic_id) ON DELETE RESTRICT,
  source_import_key TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  resources JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] NOT NULL DEFAULT '{}',
  content_rating TEXT NOT NULL DEFAULT 'educational' CHECK (content_rating IN ('educational', 'demonstrative', 'explicit')),
  requires_feature_id TEXT NOT NULL,
  requires_dlc BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nsfw_topic_library_items_topic_id ON public.nsfw_topic_library_items(topic_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_topic_library_items_requires_feature_id ON public.nsfw_topic_library_items(requires_feature_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_topic_library_items_is_active ON public.nsfw_topic_library_items(is_active);

-- Idempotent unique source key (optional)
DO $$
BEGIN
  EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_nsfw_topic_library_items_source_import_key_unique ON public.nsfw_topic_library_items(source_import_key) WHERE source_import_key IS NOT NULL';
END $$;

ALTER TABLE public.nsfw_topic_library_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='nsfw_topic_library_items' AND policyname='Anyone can view active topic library items'
  ) THEN
    CREATE POLICY "Anyone can view active topic library items"
      ON public.nsfw_topic_library_items
      FOR SELECT
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='nsfw_topic_library_items' AND policyname='Service role can manage topic library items'
  ) THEN
    CREATE POLICY "Service role can manage topic library items"
      ON public.nsfw_topic_library_items
      FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

-- ------------------------------------------------------------
-- 4) DLC catalog: add topic packs (metadata-only)
-- ------------------------------------------------------------
-- These packages unlock only the Topics Library + specific topic gates.
WITH topic_catalog AS (
  SELECT * FROM (VALUES
    (
      'dlc-topic-power-dynamics',
      'Power Dynamics Pack',
      'individual',
      'Consent-first guidance and educational resources for adult power dynamics.',
      'A structured library of consent, boundaries, and safety-focused resources. Content is delivered via the Topics Library after purchase.',
      'Consent-first, safety-first',
      4.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{}'::jsonb,
      '[
        {"id":"topics_library","name":"Topics Library","description":"Access the Topics Library module","icon":"BookOpen","category":"topics"},
        {"id":"topic_power_dynamics","name":"Power Dynamics","description":"Unlock power dynamics topic content","icon":"Shield","category":"topics"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.20',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      20,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-topic-tantric',
      'Tantric Pack',
      'individual',
      'Mindfulness-focused intimacy education and breathwork resources (adult).',
      'A structured library of tantric and mindful intimacy practices and resources. Content is delivered via the Topics Library after purchase.',
      'Mindful connection',
      4.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{}'::jsonb,
      '[
        {"id":"topics_library","name":"Topics Library","description":"Access the Topics Library module","icon":"BookOpen","category":"topics"},
        {"id":"topic_tantric","name":"Tantric & Mindful Intimacy","description":"Unlock tantric topic content","icon":"Sparkles","category":"topics"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.20',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      21,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-topic-kama-sutra',
      'Classic Texts & Positions Pack',
      'individual',
      'Classic text context and position reference (adult).',
      'A structured library of classic position references and historical context. Content is delivered via the Topics Library after purchase.',
      'Classic reference',
      4.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{}'::jsonb,
      '[
        {"id":"topics_library","name":"Topics Library","description":"Access the Topics Library module","icon":"BookOpen","category":"topics"},
        {"id":"topic_kama_sutra","name":"Classic Texts & Positions","description":"Unlock classic texts/positions topic content","icon":"BookOpen","category":"topics"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.20',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      22,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-topic-roleplay',
      'Roleplay Pack',
      'individual',
      'Consent-forward roleplay education, scripts, and scenario frameworks (adult).',
      'A structured library of roleplay communication and scenario frameworks. Content is delivered via the Topics Library after purchase.',
      'Playful, consensual scenarios',
      4.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{}'::jsonb,
      '[
        {"id":"topics_library","name":"Topics Library","description":"Access the Topics Library module","icon":"BookOpen","category":"topics"},
        {"id":"topic_roleplay","name":"Roleplay & Fantasy","description":"Unlock roleplay topic content","icon":"Mask","category":"topics"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.20',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      23,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-topic-male-pleasure',
      'Male Pleasure & Pelvic Health Pack',
      'individual',
      'Adult-focused education with anatomy and safety framing for male pleasure and pelvic health.',
      'A structured library of anatomy-forward resources and pelvic health education. Content is delivered via the Topics Library after purchase.',
      'Anatomy-first, safety-first',
      4.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{}'::jsonb,
      '[
        {"id":"topics_library","name":"Topics Library","description":"Access the Topics Library module","icon":"BookOpen","category":"topics"},
        {"id":"topic_male_pleasure","name":"Male Pleasure & Pelvic Health","description":"Unlock male pleasure/pelvic health topic content","icon":"HeartPulse","category":"topics"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.20',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      24,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    )
  ) AS t(
    package_id,
    package_name,
    package_type,
    safe_description,
    full_description,
    marketing_tagline,
    price_usd,
    price_type,
    subscription_interval,
    regional_pricing,
    features,
    included_packages,
    version,
    content_version,
    min_app_version,
    max_app_version,
    content_changelog,
    is_active,
    is_featured,
    display_order,
    content_rating,
    preview_images,
    preview_video_url,
    localized_names,
    localized_descriptions
  )
)
INSERT INTO public.dlc_packages (
  package_id,
  package_name,
  package_type,
  safe_description,
  full_description,
  marketing_tagline,
  price_usd,
  price_type,
  subscription_interval,
  regional_pricing,
  features,
  included_packages,
  version,
  content_version,
  min_app_version,
  max_app_version,
  content_changelog,
  is_active,
  is_featured,
  display_order,
  content_rating,
  preview_images,
  preview_video_url,
  localized_names,
  localized_descriptions
)
SELECT
  package_id,
  package_name,
  package_type,
  safe_description,
  full_description,
  marketing_tagline,
  price_usd,
  price_type,
  subscription_interval,
  regional_pricing,
  features,
  included_packages,
  version,
  content_version,
  min_app_version,
  max_app_version,
  content_changelog,
  is_active,
  is_featured,
  display_order,
  content_rating,
  preview_images,
  preview_video_url,
  localized_names,
  localized_descriptions
FROM topic_catalog
ON CONFLICT (package_id) DO UPDATE SET
  package_name = EXCLUDED.package_name,
  package_type = EXCLUDED.package_type,
  safe_description = EXCLUDED.safe_description,
  full_description = EXCLUDED.full_description,
  marketing_tagline = EXCLUDED.marketing_tagline,
  price_usd = EXCLUDED.price_usd,
  price_type = EXCLUDED.price_type,
  subscription_interval = EXCLUDED.subscription_interval,
  regional_pricing = EXCLUDED.regional_pricing,
  features = EXCLUDED.features,
  included_packages = EXCLUDED.included_packages,
  version = EXCLUDED.version,
  content_version = EXCLUDED.content_version,
  min_app_version = EXCLUDED.min_app_version,
  max_app_version = EXCLUDED.max_app_version,
  content_changelog = EXCLUDED.content_changelog,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order,
  content_rating = EXCLUDED.content_rating,
  preview_images = EXCLUDED.preview_images,
  preview_video_url = EXCLUDED.preview_video_url,
  localized_names = EXCLUDED.localized_names,
  localized_descriptions = EXCLUDED.localized_descriptions,
  updated_at = now();



-- END MIGRATION: 20251220120000_nsfw_topic_packs_and_topics_library.sql

-- BEGIN MIGRATION: 20251220124000_admin_dlc_package_toggles.sql

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



-- END MIGRATION: 20251220124000_admin_dlc_package_toggles.sql

-- BEGIN MIGRATION: 20251223130000_nsfw_content_storage_bucket.sql

-- Migration: NSFW DLC private storage bucket (idempotent)
-- Purpose:
-- - Create a private Supabase Storage bucket used for NSFW DLC assets (images/videos).
-- - No direct client RLS policies are granted on purpose; access is via signed URLs only.
-- - Admin uploads use signed upload URLs issued by edge functions.

-- Create/ensure bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nsfw-content',
  'nsfw-content',
  false,
  10737418240, -- 10GB (adjust in dashboard if needed)
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/json',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- NOTE:
-- We intentionally do NOT add storage.objects policies for this bucket.
-- With RLS enabled on storage.objects, this means:
-- - Regular authenticated users cannot list/read/write objects directly.
-- - The service role (edge functions) can read/write and can mint signed URLs.
-- - Clients access assets only via signed URLs (see functions: get-dlc-signed-url / get-dlc-signed-upload-url).



-- END MIGRATION: 20251223130000_nsfw_content_storage_bucket.sql

-- BEGIN MIGRATION: 20251224071255_4f105f38-1f97-4526-8437-9181b6393c92.sql

-- Create beta_testers table for managing beta access
CREATE TABLE IF NOT EXISTS public.beta_testers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    email text NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    expires_at timestamptz,
    granted_by uuid,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

-- Users can view their own beta status
CREATE POLICY "Users can view own beta status"
ON public.beta_testers
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all beta testers (using existing has_role function)
CREATE POLICY "Admins can manage beta testers"
ON public.beta_testers
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_beta_testers_user_id ON public.beta_testers(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_testers_email ON public.beta_testers(email);

-- Add updated_at trigger
CREATE TRIGGER update_beta_testers_updated_at
    BEFORE UPDATE ON public.beta_testers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- END MIGRATION: 20251224071255_4f105f38-1f97-4526-8437-9181b6393c92.sql

-- BEGIN MIGRATION: 20251224083144_b63b161f-6ac9-4f2a-b0ac-9dbbde2c184d.sql

-- Create admin_dlc_package_toggles table for storing admin DLC visibility preferences
CREATE TABLE IF NOT EXISTS public.admin_dlc_package_toggles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    package_id text NOT NULL,
    is_enabled boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, package_id)
);

-- Enable RLS
ALTER TABLE public.admin_dlc_package_toggles ENABLE ROW LEVEL SECURITY;

-- Users can view their own toggles
CREATE POLICY "Users can view own toggles"
ON public.admin_dlc_package_toggles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage their own toggles
CREATE POLICY "Admins can manage own toggles"
ON public.admin_dlc_package_toggles
FOR ALL
USING (auth.uid() = user_id AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_dlc_toggles_user_id ON public.admin_dlc_package_toggles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_dlc_toggles_package_id ON public.admin_dlc_package_toggles(package_id);

-- Add updated_at trigger
CREATE TRIGGER update_admin_dlc_package_toggles_updated_at
    BEFORE UPDATE ON public.admin_dlc_package_toggles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- END MIGRATION: 20251224083144_b63b161f-6ac9-4f2a-b0ac-9dbbde2c184d.sql

-- BEGIN MIGRATION: 20251224100000_nsfw_topics_seed_educational_library.sql

-- Migration: Seed educational Topics Library content (non-explicit)
-- Purpose:
-- - Provide real, non-explicit educational entries so Topic Packs have usable content immediately.
-- - Content remains 18+ gated by the existing age verification + DLC entitlements.
-- - Idempotent: keyed by source_import_key.

-- Ensure canonical topics exist (safe to re-run; aligns to 20251220120000 migration)
INSERT INTO public.nsfw_topics (topic_id, display_name, description, requires_feature_id, sort_order, is_active, content_rating)
VALUES
  ('power_dynamics', 'Power Dynamics', 'Consent-focused power dynamics, communication, and safety-first guidance.', 'topic_power_dynamics', 10, true, '18+'),
  ('tantric', 'Tantric & Mindful Intimacy', 'Mindfulness, breathwork, connection, and slow intimacy practices.', 'topic_tantric', 20, true, '18+'),
  ('kama_sutra', 'Classic Texts & Positions', 'Classic position reference and historical context (adult).', 'topic_kama_sutra', 30, true, '18+'),
  ('roleplay', 'Roleplay & Fantasy', 'Communication, boundaries, and scenarios for consensual roleplay.', 'topic_roleplay', 40, true, '18+'),
  ('male_pleasure', 'Male Pleasure & Pelvic Health', 'Adult techniques with anatomy/safety framing; pelvic floor and prostate education.', 'topic_male_pleasure', 50, true, '18+')
ON CONFLICT (topic_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  requires_feature_id = EXCLUDED.requires_feature_id,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  content_rating = EXCLUDED.content_rating,
  updated_at = now();

-- Seed a starter library of educational (non-explicit) items per topic
WITH items AS (
  SELECT * FROM (VALUES
    -- Power dynamics (consent-forward)
    ('power_dynamics', 'Consent & boundaries basics', 'A practical, non-judgmental checklist for negotiating boundaries.', 'Focus: clear consent, boundaries, and aftercare planning. Use it before any power-play scenarios: define limits, safe word/signals, and check-in cadence.', '[{"label":"Planned Parenthood — Consent","url":"https://www.plannedparenthood.org/learn/relationships/sexual-consent"},{"label":"RAINN — Consent","url":"https://www.rainn.org/articles/what-is-consent"}]'::jsonb, ARRAY['consent','boundaries','communication'], 'educational', 'topic_power_dynamics', true, true, 'seed:power_dynamics:consent-basics'),
    ('power_dynamics', 'Aftercare: what it is and why it matters', 'A short guide to aftercare and emotional safety.', 'Aftercare supports emotional regulation and trust. Agree on aftercare needs in advance (water, warmth, quiet time, reassurance) and revisit what worked after.', '[{"label":"Planned Parenthood — Healthy relationships","url":"https://www.plannedparenthood.org/learn/relationships"}]'::jsonb, ARRAY['aftercare','safety','trust'], 'educational', 'topic_power_dynamics', true, true, 'seed:power_dynamics:aftercare'),
    ('power_dynamics', 'Creating a check-in routine', 'How to build a simple pre/during/post check-in structure.', 'Use short check-ins: before (expectations), during (comfort), after (debrief). Track agreed signals and keep them consistent across sessions.', '[]'::jsonb, ARRAY['check-in','communication'], 'educational', 'topic_power_dynamics', true, true, 'seed:power_dynamics:checkins'),

    -- Tantric
    ('tantric', 'Breath & grounding for connection', 'A gentle routine to reduce anxiety and build presence.', 'Practice box breathing (4–4–4–4) for 2–3 minutes, then a body scan. Aim for calm, not performance.', '[{"label":"NHS — Breathing exercises","url":"https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/"}]'::jsonb, ARRAY['breathwork','mindfulness','connection'], 'educational', 'topic_tantric', true, true, 'seed:tantric:breath-grounding'),
    ('tantric', 'Slow touch: communication prompts', 'Non-explicit prompts to help partners communicate preferences.', 'Use “more / less / pause” prompts and ask “how does this feel?” frequently. Agree that pausing is always okay.', '[]'::jsonb, ARRAY['touch','communication','mindful'], 'educational', 'topic_tantric', true, true, 'seed:tantric:touch-prompts'),
    ('tantric', 'Building a distraction-free environment', 'Simple environment setup tips to support focus.', 'Reduce interruptions: lighting, temperature, water nearby, and a do-not-disturb window. Treat it like a calming ritual.', '[]'::jsonb, ARRAY['environment','ritual'], 'educational', 'topic_tantric', true, true, 'seed:tantric:environment'),

    -- Classic texts & positions (contextual, non-explicit)
    ('kama_sutra', 'Classic texts: historical context (overview)', 'A high-level overview of classic intimacy texts and their cultural context.', 'These texts are historical and cultural artifacts. Use them as inspiration for connection and communication; adapt everything to modern consent and comfort.', '[]'::jsonb, ARRAY['history','culture','context'], 'educational', 'topic_kama_sutra', true, true, 'seed:kama_sutra:context'),
    ('kama_sutra', 'Safety basics: comfort and pacing', 'Non-explicit safety basics for physical comfort.', 'Prioritize comfort: slow pacing, hydration, and stopping at discomfort. Talk about what feels supportive and what doesn’t.', '[]'::jsonb, ARRAY['safety','comfort','pacing'], 'educational', 'topic_kama_sutra', true, true, 'seed:kama_sutra:safety-basics'),

    -- Roleplay (consent-forward)
    ('roleplay', 'Consent scripts for roleplay', 'Example consent language to keep scenarios comfortable.', 'Use a quick consent script: “Are you okay with X? What’s off-limits? What’s your stop signal?” Confirm that you can pause anytime.', '[]'::jsonb, ARRAY['roleplay','consent','scripts'], 'educational', 'topic_roleplay', true, true, 'seed:roleplay:consent-scripts'),
    ('roleplay', 'Setting boundaries without killing the vibe', 'How to negotiate boundaries confidently and kindly.', 'Boundaries improve trust. State boundaries in simple language, then focus on what is allowed and desired.', '[]'::jsonb, ARRAY['boundaries','negotiation'], 'educational', 'topic_roleplay', true, true, 'seed:roleplay:boundaries'),
    ('roleplay', 'After-action debrief', 'A short, practical debrief structure.', 'Debrief: what worked, what didn’t, what to repeat, what to avoid. Keep it kind and specific.', '[]'::jsonb, ARRAY['debrief','communication'], 'educational', 'topic_roleplay', true, true, 'seed:roleplay:debrief'),

    -- Male pleasure & pelvic health (educational)
    ('male_pleasure', 'Pelvic floor basics (education)', 'What the pelvic floor is and why it matters for comfort and function.', 'Pelvic floor health supports urinary control, comfort, and sexual function. If you have pain, seek professional medical advice.', '[{"label":"NHS — Pelvic floor exercises","url":"https://www.nhs.uk/common-health-questions/womens-health/what-are-pelvic-floor-exercises/"},{"label":"Cleveland Clinic — Pelvic floor","url":"https://my.clevelandclinic.org/health/body/22283-pelvic-floor"}]'::jsonb, ARRAY['pelvic-floor','education','health'], 'educational', 'topic_male_pleasure', true, true, 'seed:male_pleasure:pelvic-floor'),
    ('male_pleasure', 'When to talk to a clinician', 'Red flags and when to get medical help.', 'Seek medical help for persistent pain, bleeding, urinary symptoms, or sudden dysfunction. This app is not a substitute for professional care.', '[]'::jsonb, ARRAY['health','safety','medical'], 'educational', 'topic_male_pleasure', true, true, 'seed:male_pleasure:clinician'),
    ('male_pleasure', 'Communication: preferences and comfort', 'Non-explicit communication prompts.', 'Use “I like / I don’t like / I’m curious about” language. Comfort-first communication reduces anxiety and increases satisfaction.', '[]'::jsonb, ARRAY['communication','comfort'], 'educational', 'topic_male_pleasure', true, true, 'seed:male_pleasure:communication')
  ) AS t(
    topic_id,
    title,
    summary,
    body,
    resources,
    tags,
    content_rating,
    requires_feature_id,
    requires_dlc,
    is_active,
    source_import_key
  )
)
INSERT INTO public.nsfw_topic_library_items (
  topic_id,
  source_import_key,
  title,
  summary,
  body,
  resources,
  tags,
  content_rating,
  requires_feature_id,
  requires_dlc,
  is_active
)
SELECT
  topic_id,
  source_import_key,
  title,
  summary,
  body,
  resources,
  tags,
  content_rating,
  requires_feature_id,
  requires_dlc,
  is_active
FROM items
ON CONFLICT (source_import_key) DO UPDATE SET
  topic_id = EXCLUDED.topic_id,
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  body = EXCLUDED.body,
  resources = EXCLUDED.resources,
  tags = EXCLUDED.tags,
  content_rating = EXCLUDED.content_rating,
  requires_feature_id = EXCLUDED.requires_feature_id,
  requires_dlc = EXCLUDED.requires_dlc,
  is_active = EXCLUDED.is_active,
  updated_at = now();



-- END MIGRATION: 20251224100000_nsfw_topics_seed_educational_library.sql

-- BEGIN MIGRATION: 20251224120000_stripe_webhook_event_claim_rpc.sql

-- Stripe Webhook Idempotency: atomic claim RPC
-- Purpose:
-- - Prevent concurrent Stripe retries from processing the same event twice.
-- - Allow safe retries when prior processing failed.
-- Notes:
-- - Idempotent: CREATE OR REPLACE
-- - Locked down: only service_role can execute.

CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
  _event_id TEXT,
  _event_type TEXT,
  _stripe_created_at TIMESTAMPTZ,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed BOOLEAN := FALSE;
BEGIN
  -- If the idempotency ledger isn't present (older env), allow processing.
  IF to_regclass('public.stripe_webhook_events') IS NULL THEN
    RETURN TRUE;
  END IF;

  -- First writer wins: insert "processing" row for this event_id.
  INSERT INTO public.stripe_webhook_events (
    event_id,
    event_type,
    stripe_created_at,
    received_at,
    status,
    metadata
  )
  VALUES (
    _event_id,
    _event_type,
    _stripe_created_at,
    NOW(),
    'processing',
    COALESCE(_metadata, '{}'::jsonb)
  )
  ON CONFLICT (event_id) DO NOTHING;

  GET DIAGNOSTICS claimed = ROW_COUNT > 0;
  IF claimed THEN
    RETURN TRUE;
  END IF;

  -- If it already exists, only allow re-claim when status indicates incomplete work.
  UPDATE public.stripe_webhook_events
    SET status = 'processing',
        processed_at = NULL,
        error_message = NULL
  WHERE event_id = _event_id
    AND status IN ('received', 'failed');

  GET DIAGNOSTICS claimed = ROW_COUNT > 0;
  RETURN claimed;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_stripe_webhook_event(TEXT, TEXT, TIMESTAMPTZ, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(TEXT, TEXT, TIMESTAMPTZ, JSONB) TO service_role;



-- END MIGRATION: 20251224120000_stripe_webhook_event_claim_rpc.sql

-- BEGIN MIGRATION: 20251224130000_beta_testers.sql

-- Beta testers allowlist (non-paid beta unlock)
-- Purpose:
-- - Enable "all features + all DLC" access for approved beta testers without Stripe.
-- - Keep access auditable, revocable, and optionally expiring.
-- Notes:
-- - Idempotent: CREATE TABLE IF NOT EXISTS + DROP/CREATE POLICIES.
-- - Access model:
--   - Users can read their own beta status.
--   - Admin/super_admin can manage rows.

CREATE TABLE IF NOT EXISTS public.beta_testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ NULL,
  granted_by UUID NULL REFERENCES auth.users(id),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT beta_testers_user_id_unique UNIQUE (user_id)
);

-- Keep email uniqueness case-insensitive (best-effort)
CREATE UNIQUE INDEX IF NOT EXISTS beta_testers_email_lower_unique
  ON public.beta_testers (LOWER(email));

CREATE INDEX IF NOT EXISTS beta_testers_enabled_idx
  ON public.beta_testers (enabled);

CREATE INDEX IF NOT EXISTS beta_testers_expires_at_idx
  ON public.beta_testers (expires_at);

ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "beta_testers_read_own" ON public.beta_testers;
CREATE POLICY "beta_testers_read_own"
ON public.beta_testers
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "beta_testers_admin_read_all" ON public.beta_testers;
CREATE POLICY "beta_testers_admin_read_all"
ON public.beta_testers
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "beta_testers_admin_insert" ON public.beta_testers;
CREATE POLICY "beta_testers_admin_insert"
ON public.beta_testers
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "beta_testers_admin_update" ON public.beta_testers;
CREATE POLICY "beta_testers_admin_update"
ON public.beta_testers
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "beta_testers_admin_delete" ON public.beta_testers;
CREATE POLICY "beta_testers_admin_delete"
ON public.beta_testers
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);



-- END MIGRATION: 20251224130000_beta_testers.sql

-- BEGIN MIGRATION: 20251225044316_ae2bc4d1-2925-4bf1-b03d-5b964e90b05a.sql

-- Create subscription_tiers table with proper tier structure
-- Tiers: Free, Pro, Premium, Infinity (everything unlocked)

CREATE TABLE IF NOT EXISTS public.subscription_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_id text UNIQUE NOT NULL,
    tier_name text NOT NULL,
    tier_description text,
    monthly_price numeric NOT NULL DEFAULT 0,
    annual_price numeric,
    lifetime_price numeric,
    annual_discount_percentage integer DEFAULT 20,
    lifetime_discount_percentage integer DEFAULT 50,
    stripe_monthly_price_id text,
    stripe_annual_price_id text,
    stripe_lifetime_price_id text,
    features jsonb NOT NULL DEFAULT '[]'::jsonb,
    limitations jsonb,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    is_popular boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    icon_url text,
    color_scheme text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Everyone can view active subscription tiers
CREATE POLICY "Anyone can view active tiers"
ON public.subscription_tiers
FOR SELECT
USING (is_active = true);

-- Admins can manage tiers
CREATE POLICY "Admins can manage tiers"
ON public.subscription_tiers
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create tier_comparison_features table
CREATE TABLE IF NOT EXISTS public.tier_comparison_features (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_name text NOT NULL,
    feature_description text,
    feature_category text,
    available_tiers text[] NOT NULL DEFAULT '{}',
    is_premium boolean DEFAULT false,
    is_core boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tier_comparison_features ENABLE ROW LEVEL SECURITY;

-- Everyone can view features
CREATE POLICY "Anyone can view tier features"
ON public.tier_comparison_features
FOR SELECT
USING (true);

-- Admins can manage features
CREATE POLICY "Admins can manage tier features"
ON public.tier_comparison_features
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Insert the subscription tiers
INSERT INTO public.subscription_tiers (tier_id, tier_name, tier_description, monthly_price, annual_price, lifetime_price, features, limitations, is_active, is_featured, is_popular, sort_order, color_scheme) VALUES
(
    'free',
    'Free',
    'Get started with essential features - perfect for beginners',
    0,
    0,
    0,
    '["Basic scanner functionality", "Health diary (5 entries/month)", "Community forum access", "Basic PE guide", "Limited AI chat (10 messages/day)", "Standard support"]'::jsonb,
    '["Limited scan history (30 days)", "No advanced analytics", "No premium content", "Basic positions gallery only", "No expert consultations"]'::jsonb,
    true,
    false,
    false,
    1,
    'gray'
),
(
    'pro',
    'Pro',
    'Enhanced features for serious progress tracking',
    9.99,
    95.90,
    299.99,
    '["Everything in Free", "Unlimited scanner usage", "Full health diary", "Advanced analytics dashboard", "Unlimited AI chat", "Custom routines builder", "Full positions gallery", "Priority email support", "Export/import data", "Basic integrations"]'::jsonb,
    '["No NSFW content", "No expert consultations", "No DLC packs", "Standard prediction models"]'::jsonb,
    true,
    false,
    true,
    2,
    'blue'
),
(
    'premium',
    'Premium',
    'Full-featured experience with advanced health tools',
    19.99,
    191.90,
    599.99,
    '["Everything in Pro", "AI-powered predictions", "Advanced reporting system", "Expert consultations (2/month)", "Health app integrations", "API access", "Mobile & wearable sync", "Priority live support", "Exclusive premium content", "Advanced privacy controls"]'::jsonb,
    '["NSFW content not included", "DLC packs sold separately"]'::jsonb,
    true,
    true,
    false,
    3,
    'purple'
),
(
    'infinity',
    'Infinity',
    'The ultimate experience - Everything unlocked forever, including all NSFW content and DLC',
    49.99,
    479.90,
    1499.99,
    '["Everything in Premium", "All DLC packs included", "All NSFW video content", "NSFW community forum access", "NSFW wellness analytics", "NSFW advanced features", "Unlimited expert consultations", "White-glove concierge support", "Early access to new features", "Exclusive Infinity member events", "Custom AI model training", "Lifetime updates included", "Priority feature requests", "Dedicated account manager"]'::jsonb,
    null,
    true,
    false,
    false,
    4,
    'gold'
);

-- Insert comparison features
INSERT INTO public.tier_comparison_features (feature_name, feature_description, feature_category, available_tiers, is_core, is_premium, sort_order) VALUES
('Scanner', 'Basic measurement scanner', 'Core', ARRAY['free', 'pro', 'premium', 'infinity'], true, false, 1),
('Health Diary', 'Track your health entries', 'Core', ARRAY['free', 'pro', 'premium', 'infinity'], true, false, 2),
('Community Forum', 'Access community discussions', 'Community', ARRAY['free', 'pro', 'premium', 'infinity'], true, false, 3),
('PE Guide', 'Basic exercise guide', 'Core', ARRAY['free', 'pro', 'premium', 'infinity'], true, false, 4),
('AI Chat', 'AI-powered health assistant', 'AI', ARRAY['free', 'pro', 'premium', 'infinity'], true, false, 5),
('Unlimited Scans', 'No limits on scanner usage', 'Core', ARRAY['pro', 'premium', 'infinity'], false, false, 6),
('Advanced Analytics', 'Detailed progress analytics', 'Analytics', ARRAY['pro', 'premium', 'infinity'], false, false, 7),
('Custom Routines', 'Build your own routines', 'Features', ARRAY['pro', 'premium', 'infinity'], false, false, 8),
('Full Positions Gallery', 'Access all positions', 'Content', ARRAY['pro', 'premium', 'infinity'], false, false, 9),
('Data Export', 'Export your data', 'Features', ARRAY['pro', 'premium', 'infinity'], false, false, 10),
('AI Predictions', 'AI-powered health predictions', 'AI', ARRAY['premium', 'infinity'], false, true, 11),
('Expert Consultations', 'Talk to health experts', 'Premium', ARRAY['premium', 'infinity'], false, true, 12),
('Health App Integrations', 'Connect to health apps', 'Integrations', ARRAY['premium', 'infinity'], false, true, 13),
('API Access', 'Developer API access', 'Integrations', ARRAY['premium', 'infinity'], false, true, 14),
('All DLC Packs', 'All downloadable content included', 'Content', ARRAY['infinity'], false, true, 15),
('NSFW Video Content', 'Adult educational videos', 'NSFW', ARRAY['infinity'], false, true, 16),
('NSFW Community', 'Adult community forums', 'NSFW', ARRAY['infinity'], false, true, 17),
('NSFW Analytics', 'Adult wellness tracking', 'NSFW', ARRAY['infinity'], false, true, 18),
('Unlimited Expert Consultations', 'No limits on expert calls', 'Premium', ARRAY['infinity'], false, true, 19),
('Concierge Support', 'Dedicated support team', 'Support', ARRAY['infinity'], false, true, 20);

-- Add triggers
CREATE TRIGGER update_subscription_tiers_updated_at
    BEFORE UPDATE ON public.subscription_tiers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tier_comparison_features_updated_at
    BEFORE UPDATE ON public.tier_comparison_features
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_tier_id ON public.subscription_tiers(tier_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_sort_order ON public.subscription_tiers(sort_order);
CREATE INDEX IF NOT EXISTS idx_tier_features_sort_order ON public.tier_comparison_features(sort_order);


-- END MIGRATION: 20251225044316_ae2bc4d1-2925-4bf1-b03d-5b964e90b05a.sql

-- BEGIN MIGRATION: 20251226000001_user_add_ons_payment_intent.sql

-- Migration: Track Stripe payment intent for add-ons
-- Enables reliable refund/chargeback revocation for one-time ("lifetime") add-ons.

ALTER TABLE IF EXISTS user_add_ons
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_add_ons_payment_intent_id
  ON user_add_ons(stripe_payment_intent_id);



-- END MIGRATION: 20251226000001_user_add_ons_payment_intent.sql

-- BEGIN MIGRATION: 20251226023338_289e405f-58d6-4fdb-a222-d7b50ab2f708.sql

-- Premium Add-Ons Catalog
CREATE TABLE IF NOT EXISTS premium_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_id TEXT NOT NULL UNIQUE,
  addon_name TEXT NOT NULL,
  addon_description TEXT NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL,
  annual_price DECIMAL(10, 2),
  lifetime_price DECIMAL(10, 2),
  annual_discount_percentage DECIMAL(5, 2) DEFAULT 0,
  stripe_monthly_price_id TEXT,
  stripe_annual_price_id TEXT,
  stripe_lifetime_price_id TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limitations JSONB,
  requires_tier TEXT[],
  incompatible_addons TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  category TEXT,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Add-On Subscriptions
CREATE TABLE IF NOT EXISTS user_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  addon_id TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual', 'lifetime')),
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  price_paid DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, addon_id)
);

-- Add-On Usage Tracking
CREATE TABLE IF NOT EXISTS addon_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  addon_id TEXT NOT NULL,
  usage_type TEXT NOT NULL,
  usage_value DECIMAL(15, 2) NOT NULL,
  usage_limit DECIMAL(15, 2),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  tracked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_premium_add_ons_active ON premium_add_ons(is_active);
CREATE INDEX IF NOT EXISTS idx_premium_add_ons_category ON premium_add_ons(category);
CREATE INDEX IF NOT EXISTS idx_user_add_ons_user_id ON user_add_ons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_add_ons_status ON user_add_ons(status);
CREATE INDEX IF NOT EXISTS idx_user_add_ons_payment_intent_id ON user_add_ons(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_addon_usage_tracking_user_id ON addon_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_addon_usage_tracking_period ON addon_usage_tracking(period_start, period_end);

-- RLS Policies
ALTER TABLE premium_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE addon_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Premium Add-Ons: All authenticated users can view active add-ons
CREATE POLICY "Anyone can view active premium add-ons"
  ON premium_add_ons FOR SELECT
  USING (is_active = true);

-- User Add-Ons: Users can manage their own
CREATE POLICY "Users can manage own add-ons"
  ON user_add_ons FOR ALL
  USING (auth.uid() = user_id);

-- Add-On Usage Tracking: Users can view their own
CREATE POLICY "Users can manage own add-on usage"
  ON addon_usage_tracking FOR ALL
  USING (auth.uid() = user_id);

-- Insert default premium add-ons
INSERT INTO premium_add_ons (addon_id, addon_name, addon_description, monthly_price, annual_price, lifetime_price, annual_discount_percentage, features, requires_tier, category, is_active, is_popular, sort_order) VALUES
('advanced_analytics', 'Advanced Analytics', 'Enhanced analytics and reporting tools', 9.99, 99.99, 249.99, 20.00,
 '["Custom Report Builder", "Advanced Charts", "Predictive Modeling", "Export to Excel/PDF"]'::jsonb,
 ARRAY['pro', 'premium', 'infinity'], 'analytics', true, true, 1),
('extended_storage', 'Extended Cloud Storage', 'Additional cloud storage for backups and data', 4.99, 49.99, 149.99, 20.00,
 '["500GB Cloud Storage", "Unlimited Backups", "Automatic Sync"]'::jsonb,
 ARRAY['pro', 'premium', 'infinity'], 'storage', true, false, 2),
('priority_support', 'Priority Support', 'Faster response times and dedicated support', 4.99, 49.99, 149.99, 20.00,
 '["24/7 Priority Support", "Email Response < 2 hours", "Phone Support", "Dedicated Support Agent"]'::jsonb,
 ARRAY['pro', 'premium', 'infinity'], 'support', true, false, 3),
('extended_history', 'Extended Health History', 'Keep health data for longer periods', 4.99, 49.99, 149.99, 20.00,
 '["10 Years Data Retention", "Unlimited Historical Data", "Advanced Search"]'::jsonb,
 ARRAY['pro', 'premium', 'infinity'], 'storage', true, false, 4),
('api_access', 'API Access', 'Programmatic access to your data', 14.99, 149.99, 399.99, 20.00,
 '["REST API Access", "Webhook Support", "Rate Limits", "API Documentation"]'::jsonb,
 ARRAY['premium', 'infinity'], 'api', true, false, 5)
ON CONFLICT (addon_id) DO NOTHING;

-- END MIGRATION: 20251226023338_289e405f-58d6-4fdb-a222-d7b50ab2f708.sql

-- BEGIN MIGRATION: 20251226030000_premium_position_collections_dlc.sql

-- Premium Position Collections DLC ($9.99/month)
-- Advanced pose library with 50+ positions

-- Create position collections table
CREATE TABLE IF NOT EXISTS public.position_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('basic', 'intermediate', 'advanced', 'expert', 'couples', 'solo')),
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  thumbnail_url TEXT,
  benefits TEXT[],
  prerequisites TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create positions table
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.position_collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  duration_minutes INTEGER,
  image_url TEXT,
  video_url TEXT,
  tags TEXT[],
  muscle_groups TEXT[],
  health_benefits TEXT[],
  safety_notes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user position favorites
CREATE TABLE IF NOT EXISTS public.user_position_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, position_id)
);

-- Create user custom collections
CREATE TABLE IF NOT EXISTS public.user_custom_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user custom collection positions
CREATE TABLE IF NOT EXISTS public.user_custom_collection_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.user_custom_collections(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, position_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_positions_collection_id ON public.positions(collection_id);
CREATE INDEX IF NOT EXISTS idx_positions_tags ON public.positions USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_user_position_favorites_user_id ON public.user_position_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_collections_user_id ON public.user_custom_collections(user_id);

-- Enable RLS
ALTER TABLE public.position_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_position_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_custom_collection_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can read position collections and positions
CREATE POLICY "Anyone can view position collections" ON public.position_collections FOR SELECT USING (true);
CREATE POLICY "Anyone can view positions" ON public.positions FOR SELECT USING (true);

-- Users can manage their own favorites
CREATE POLICY "Users can manage their favorites" ON public.user_position_favorites
  FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own custom collections
CREATE POLICY "Users can manage their custom collections" ON public.user_custom_collections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their custom collection positions" ON public.user_custom_collection_positions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_custom_collections
      WHERE id = user_custom_collection_positions.collection_id
      AND user_id = auth.uid()
    )
  );

-- Seed data: 50+ positions across different categories
INSERT INTO public.position_collections (name, description, category, difficulty_level) VALUES
  ('Essential Basics', 'Foundational positions for beginners', 'basic', 1),
  ('Intermediate Techniques', 'Build upon the basics with these intermediate moves', 'intermediate', 3),
  ('Advanced Mastery', 'Expert-level positions for experienced practitioners', 'advanced', 4),
  ('Couples Connection', 'Positions designed for partner work', 'couples', 2),
  ('Solo Practice', 'Individual exercises and stretches', 'solo', 1),
  ('Expert Challenge', 'The most challenging positions for peak performance', 'expert', 5);

COMMENT ON TABLE public.position_collections IS 'Premium DLC: Position collections for advanced pose library';
COMMENT ON TABLE public.positions IS 'Premium DLC: Individual positions within collections';
COMMENT ON TABLE public.user_position_favorites IS 'Premium DLC: User favorited positions';
COMMENT ON TABLE public.user_custom_collections IS 'Premium DLC: User created position collections';


-- END MIGRATION: 20251226030000_premium_position_collections_dlc.sql

-- BEGIN MIGRATION: 20251226030001_advanced_nsfw_detection_modes_dlc.sql

-- Advanced NSFW Detection Modes DLC ($14.99/month)
-- Multi-model ensemble detection with confidence scoring

-- Create detection models table
CREATE TABLE IF NOT EXISTS public.nsfw_detection_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  version TEXT NOT NULL,
  provider TEXT NOT NULL,
  model_type TEXT NOT NULL CHECK (model_type IN ('classification', 'object_detection', 'semantic_segmentation')),
  accuracy_score DECIMAL(5,4),
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create detection results table for multi-model comparison
CREATE TABLE IF NOT EXISTS public.nsfw_detection_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL,
  model_id UUID REFERENCES public.nsfw_detection_models(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_confidence DECIMAL(5,4) NOT NULL,
  predictions JSONB NOT NULL, -- Detailed category breakdowns
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ensemble results table
CREATE TABLE IF NOT EXISTS public.nsfw_ensemble_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  combined_confidence DECIMAL(5,4) NOT NULL,
  model_results JSONB NOT NULL, -- Array of individual model results
  final_classification TEXT NOT NULL,
  confidence_intervals JSONB, -- Statistical confidence ranges
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user detection preferences
CREATE TABLE IF NOT EXISTS public.user_detection_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  enabled_models UUID[], -- Array of model IDs
  ensemble_mode BOOLEAN DEFAULT TRUE,
  confidence_threshold DECIMAL(5,4) DEFAULT 0.5,
  show_detailed_breakdown BOOLEAN DEFAULT TRUE,
  enable_comparison_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nsfw_detection_results_scan_id ON public.nsfw_detection_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_detection_results_user_id ON public.nsfw_detection_results(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_ensemble_results_user_id ON public.nsfw_ensemble_results(user_id);

-- Enable RLS
ALTER TABLE public.nsfw_detection_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_detection_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nsfw_ensemble_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_detection_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active models" ON public.nsfw_detection_models
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own detection results" ON public.nsfw_detection_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own ensemble results" ON public.nsfw_ensemble_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their detection preferences" ON public.user_detection_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Seed data: Detection models
INSERT INTO public.nsfw_detection_models (name, version, provider, model_type, accuracy_score, config) VALUES
  ('NSFW-JS', '2.4.2', 'InfernoJS', 'classification', 0.9250, '{"categories": ["drawing", "neutral", "sexy", "porn", "hentai"]}'::jsonb),
  ('NudeNet', '2.1.0', 'NudeNet', 'object_detection', 0.9450, '{"categories": ["safe", "explicit"]}'::jsonb),
  ('DeepAI', '1.0.0', 'DeepAI', 'classification', 0.9100, '{"categories": ["safe", "questionable", "explicit"]}'::jsonb),
  ('Custom-Ensemble', '1.0.0', 'MorphoScan', 'classification', 0.9600, '{"models": ["nsfw-js", "nudenet"], "voting_strategy": "weighted_average"}'::jsonb);

COMMENT ON TABLE public.nsfw_detection_models IS 'Advanced NSFW DLC: Detection model configurations';
COMMENT ON TABLE public.nsfw_detection_results IS 'Advanced NSFW DLC: Individual model detection results';
COMMENT ON TABLE public.nsfw_ensemble_results IS 'Advanced NSFW DLC: Combined ensemble detection results';


-- END MIGRATION: 20251226030001_advanced_nsfw_detection_modes_dlc.sql

-- BEGIN MIGRATION: 20251226030002_wellness_coaching_ai_dlc.sql

-- Wellness Coaching AI DLC ($19.99/month)
-- AI-powered personalized coaching and insights

-- Create coaching sessions table
CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('initial_assessment', 'progress_review', 'goal_setting', 'weekly_checkin', 'monthly_review')),
  ai_insights JSONB NOT NULL, -- AI-generated insights
  user_feedback TEXT,
  goals_set JSONB,
  action_items TEXT[],
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user goals table
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('health', 'wellness', 'fitness', 'performance', 'lifestyle')),
  target_value DECIMAL,
  current_value DECIMAL,
  unit TEXT,
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create progress tracking table
CREATE TABLE IF NOT EXISTS public.goal_progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.user_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value DECIMAL NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create coaching reports table
CREATE TABLE IF NOT EXISTS public.coaching_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'quarterly', 'annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary TEXT NOT NULL,
  key_insights JSONB NOT NULL,
  recommendations TEXT[],
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create personalized insights table
CREATE TABLE IF NOT EXISTS public.personalized_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern', 'trend', 'recommendation', 'alert', 'achievement')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  data_source JSONB, -- Reference to scan history, wellness scores, etc.
  action_required BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_user_id ON public.coaching_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_created_at ON public.coaching_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON public.user_goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_progress_tracking_goal_id ON public.goal_progress_tracking(goal_id);
CREATE INDEX IF NOT EXISTS idx_coaching_reports_user_id ON public.coaching_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_insights_user_id ON public.personalized_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_insights_dismissed ON public.personalized_insights(dismissed);

-- Enable RLS
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalized_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their coaching sessions" ON public.coaching_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their goals" ON public.user_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their goal progress" ON public.goal_progress_tracking
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their coaching reports" ON public.coaching_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their insights" ON public.personalized_insights
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.coaching_sessions IS 'Wellness Coaching AI DLC: AI-powered coaching sessions';
COMMENT ON TABLE public.user_goals IS 'Wellness Coaching AI DLC: User health and wellness goals';
COMMENT ON TABLE public.coaching_reports IS 'Wellness Coaching AI DLC: Periodic coaching reports';
COMMENT ON TABLE public.personalized_insights IS 'Wellness Coaching AI DLC: AI-generated personalized insights';


-- END MIGRATION: 20251226030002_wellness_coaching_ai_dlc.sql

-- BEGIN MIGRATION: 20251226030003_partner_sync_dlc.sql

-- Partner Sync DLC ($24.99/month)
-- Collaborative tracking and shared dashboards for couples

-- Create partner connections table
CREATE TABLE IF NOT EXISTS public.partner_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  invitation_code TEXT UNIQUE,
  invitation_expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, partner_id),
  CHECK (user_id != partner_id)
);

-- Create shared data permissions table
CREATE TABLE IF NOT EXISTS public.partner_data_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('scans', 'wellness_scores', 'diary_entries', 'goals', 'progress_photos', 'all')),
  can_view BOOLEAN DEFAULT FALSE,
  can_comment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, user_id, data_type)
);

-- Create shared activities table
CREATE TABLE IF NOT EXISTS public.partner_shared_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('scan', 'diary_entry', 'goal_update', 'wellness_score', 'achievement')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_reference UUID, -- Reference to the actual data (scan_id, diary_id, etc.)
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner comments table
CREATE TABLE IF NOT EXISTS public.partner_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.partner_shared_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner comparison data table
CREATE TABLE IF NOT EXISTS public.partner_comparison_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('wellness_score', 'scan_measurement', 'goal_progress', 'activity_frequency')),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user1_value DECIMAL,
  user2_value DECIMAL,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner sync settings table
CREATE TABLE IF NOT EXISTS public.partner_sync_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE UNIQUE,
  real_time_sync BOOLEAN DEFAULT TRUE,
  notification_preferences JSONB DEFAULT '{"new_activity": true, "comments": true, "achievements": true}'::jsonb,
  privacy_mode TEXT DEFAULT 'selective' CHECK (privacy_mode IN ('open', 'selective', 'minimal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_connections_user_id ON public.partner_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_connections_partner_id ON public.partner_connections(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_connections_status ON public.partner_connections(status);
CREATE INDEX IF NOT EXISTS idx_partner_data_permissions_connection_id ON public.partner_data_permissions(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_shared_activities_connection_id ON public.partner_shared_activities(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_shared_activities_created_at ON public.partner_shared_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_comments_activity_id ON public.partner_comments(activity_id);

-- Enable RLS
ALTER TABLE public.partner_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_data_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_shared_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_comparison_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sync_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their partner connections" ON public.partner_connections
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can manage permissions for their connections" ON public.partner_data_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_connections
      WHERE id = partner_data_permissions.connection_id
      AND (user_id = auth.uid() OR partner_id = auth.uid())
    )
  );

CREATE POLICY "Users can view shared activities" ON public.partner_shared_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_connections
      WHERE id = partner_shared_activities.connection_id
      AND (user_id = auth.uid() OR partner_id = auth.uid())
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can add comments to shared activities" ON public.partner_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_connections pc
      JOIN public.partner_shared_activities psa ON pc.id = psa.connection_id
      WHERE psa.id = partner_comments.activity_id
      AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
      AND pc.status = 'accepted'
    )
  );

CREATE POLICY "Users can view comparison data" ON public.partner_comparison_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_connections
      WHERE id = partner_comparison_data.connection_id
      AND (user_id = auth.uid() OR partner_id = auth.uid())
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can manage sync settings for their connections" ON public.partner_sync_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_connections
      WHERE id = partner_sync_settings.connection_id
      AND (user_id = auth.uid() OR partner_id = auth.uid())
    )
  );

COMMENT ON TABLE public.partner_connections IS 'Partner Sync DLC: Partner connection management';
COMMENT ON TABLE public.partner_data_permissions IS 'Partner Sync DLC: Data sharing permissions';
COMMENT ON TABLE public.partner_shared_activities IS 'Partner Sync DLC: Shared activity feed';
COMMENT ON TABLE public.partner_comparison_data IS 'Partner Sync DLC: Comparative analytics';


-- END MIGRATION: 20251226030003_partner_sync_dlc.sql

-- BEGIN MIGRATION: 20251226030004_medical_export_dlc.sql

-- Medical Export DLC ($29.99/month)
-- HIPAA-compliant data export and medical reporting

-- Create medical export requests table
CREATE TABLE IF NOT EXISTS public.medical_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf_report', 'json_data', 'csv_data', 'hl7_fhir', 'medical_summary')),
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  include_scans BOOLEAN DEFAULT TRUE,
  include_wellness_scores BOOLEAN DEFAULT TRUE,
  include_diary_entries BOOLEAN DEFAULT FALSE,
  include_photos BOOLEAN DEFAULT FALSE,
  anonymize_data BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  file_size_bytes BIGINT,
  export_password TEXT, -- Encrypted
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create provider sharing table
CREATE TABLE IF NOT EXISTS public.provider_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_id UUID REFERENCES public.medical_export_requests(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  provider_email TEXT NOT NULL,
  provider_npi TEXT, -- National Provider Identifier
  sharing_code TEXT UNIQUE NOT NULL,
  access_granted_at TIMESTAMPTZ,
  access_expires_at TIMESTAMPTZ NOT NULL,
  access_revoked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create export audit trail
CREATE TABLE IF NOT EXISTS public.export_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id UUID NOT NULL REFERENCES public.medical_export_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'downloaded', 'shared', 'viewed', 'revoked', 'expired')),
  actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'provider', 'system')),
  actor_identifier TEXT, -- Email or system identifier
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medical report templates table
CREATE TABLE IF NOT EXISTS public.medical_report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('general', 'specialist', 'insurance', 'research')),
  sections JSONB NOT NULL, -- Define which sections to include
  formatting_options JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create anonymization rules table
CREATE TABLE IF NOT EXISTS public.anonymization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL,
  anonymization_method TEXT NOT NULL CHECK (anonymization_method IN ('redact', 'hash', 'generalize', 'perturb', 'encrypt')),
  applies_to TEXT[] NOT NULL, -- Table names
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_medical_export_requests_user_id ON public.medical_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_export_requests_status ON public.medical_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_medical_export_requests_created_at ON public.medical_export_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_sharing_user_id ON public.provider_sharing(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_sharing_sharing_code ON public.provider_sharing(sharing_code);
CREATE INDEX IF NOT EXISTS idx_export_audit_trail_export_id ON public.export_audit_trail(export_id);
CREATE INDEX IF NOT EXISTS idx_export_audit_trail_created_at ON public.export_audit_trail(created_at DESC);

-- Enable RLS
ALTER TABLE public.medical_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_sharing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymization_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their export requests" ON public.medical_export_requests
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage provider sharing" ON public.provider_sharing
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their export audit trail" ON public.export_audit_trail
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active report templates" ON public.medical_report_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active anonymization rules" ON public.anonymization_rules
  FOR SELECT USING (is_active = true);

-- Seed data: Default templates
INSERT INTO public.medical_report_templates (name, description, template_type, sections, is_default) VALUES
  ('General Health Report', 'Comprehensive health overview', 'general', 
   '{"sections": ["patient_info", "scan_history", "wellness_trends", "measurements", "recommendations"]}'::jsonb, true),
  ('Specialist Referral', 'Focused report for specialist referral', 'specialist',
   '{"sections": ["patient_info", "chief_complaint", "relevant_scans", "current_medications"]}'::jsonb, false),
  ('Insurance Documentation', 'Medical necessity documentation', 'insurance',
   '{"sections": ["patient_info", "diagnosis", "treatment_plan", "supporting_data"]}'::jsonb, false);

-- Seed data: Anonymization rules
INSERT INTO public.anonymization_rules (field_name, anonymization_method, applies_to) VALUES
  ('email', 'hash', ARRAY['users', 'profiles']),
  ('phone_number', 'redact', ARRAY['profiles']),
  ('date_of_birth', 'generalize', ARRAY['profiles']),
  ('full_name', 'hash', ARRAY['users', 'profiles']),
  ('address', 'redact', ARRAY['profiles']);

COMMENT ON TABLE public.medical_export_requests IS 'Medical Export DLC: HIPAA-compliant export requests';
COMMENT ON TABLE public.provider_sharing IS 'Medical Export DLC: Secure provider data sharing';
COMMENT ON TABLE public.export_audit_trail IS 'Medical Export DLC: HIPAA audit trail for exports';
COMMENT ON TABLE public.medical_report_templates IS 'Medical Export DLC: Customizable report templates';


-- END MIGRATION: 20251226030004_medical_export_dlc.sql

-- BEGIN MIGRATION: 20251226030005_research_participation_dlc.sql

-- Research Participation DLC (Free + rewards)
-- Anonymized data contribution for research with rewards system

-- Create research programs table
CREATE TABLE IF NOT EXISTS public.research_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  institution TEXT NOT NULL,
  principal_investigator TEXT,
  irb_approval_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('planned', 'active', 'completed', 'suspended')),
  data_requirements JSONB NOT NULL, -- What data is needed
  inclusion_criteria JSONB, -- Who can participate
  compensation_points INTEGER DEFAULT 100,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create research participation table
CREATE TABLE IF NOT EXISTS public.research_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.research_programs(id) ON DELETE CASCADE,
  opted_in BOOLEAN DEFAULT FALSE,
  consent_given_at TIMESTAMPTZ,
  consent_version TEXT,
  data_sharing_preferences JSONB DEFAULT '{"scans": true, "wellness_scores": true, "diary_entries": false, "demographics": true}'::jsonb,
  anonymization_level TEXT DEFAULT 'full' CHECK (anonymization_level IN ('full', 'partial', 'minimal')),
  withdrawal_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

-- Create anonymized contributions table
CREATE TABLE IF NOT EXISTS public.anonymized_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participation_id UUID NOT NULL REFERENCES public.research_participation(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.research_programs(id) ON DELETE CASCADE,
  anonymous_user_id UUID NOT NULL DEFAULT gen_random_uuid(), -- Permanent anonymous ID
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('scan_data', 'wellness_score', 'diary_entry', 'survey_response', 'demographic_data')),
  data JSONB NOT NULL, -- Anonymized data payload
  data_hash TEXT NOT NULL, -- For deduplication
  contributed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data_hash)
);

-- Create rewards system table
CREATE TABLE IF NOT EXISTS public.research_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create rewards transactions table
CREATE TABLE IF NOT EXISTS public.rewards_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'bonus', 'expired', 'reversed')),
  points INTEGER NOT NULL,
  source TEXT NOT NULL, -- program_id, redemption_id, etc.
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create research dashboard stats table
CREATE TABLE IF NOT EXISTS public.research_contribution_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_contributions INTEGER DEFAULT 0,
  contributions_by_type JSONB DEFAULT '{}'::jsonb,
  impact_score INTEGER DEFAULT 0, -- Based on contribution quality and quantity
  last_contribution_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create data usage transparency table
CREATE TABLE IF NOT EXISTS public.data_usage_transparency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.research_programs(id) ON DELETE CASCADE,
  publication_title TEXT,
  publication_date DATE,
  publication_url TEXT,
  findings_summary TEXT,
  data_points_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_research_programs_status ON public.research_programs(status);
CREATE INDEX IF NOT EXISTS idx_research_participation_user_id ON public.research_participation(user_id);
CREATE INDEX IF NOT EXISTS idx_research_participation_program_id ON public.research_participation(program_id);
CREATE INDEX IF NOT EXISTS idx_anonymized_contributions_program_id ON public.anonymized_contributions(program_id);
CREATE INDEX IF NOT EXISTS idx_research_rewards_user_id ON public.research_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_transactions_user_id ON public.rewards_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_contribution_stats_user_id ON public.research_contribution_stats(user_id);

-- Enable RLS
ALTER TABLE public.research_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymized_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_contribution_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_usage_transparency ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active research programs" ON public.research_programs
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their research participation" ON public.research_participation
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users cannot view anonymized contributions" ON public.anonymized_contributions
  FOR SELECT USING (false); -- Strict privacy: no one can view

CREATE POLICY "Users can view their rewards" ON public.research_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their rewards transactions" ON public.rewards_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their contribution stats" ON public.research_contribution_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view data usage transparency" ON public.data_usage_transparency
  FOR SELECT USING (true);

-- Seed data: Sample research programs
INSERT INTO public.research_programs (
  name, 
  description, 
  institution, 
  principal_investigator, 
  irb_approval_number,
  start_date, 
  end_date,
  status, 
  data_requirements,
  compensation_points,
  max_participants
) VALUES
  (
    'Men''s Health Longitudinal Study',
    'A multi-year study tracking men''s health metrics and outcomes',
    'Johns Hopkins University',
    'Dr. Michael Chen, MD, PhD',
    'IRB-2024-001234',
    '2025-01-01',
    '2027-12-31',
    'active',
    '{"required": ["scan_data", "wellness_scores"], "optional": ["diary_entries"]}'::jsonb,
    500,
    10000
  ),
  (
    'Wellness Intervention Efficacy Study',
    'Evaluating the effectiveness of wellness interventions',
    'Stanford Medicine',
    'Dr. Sarah Johnson, PhD',
    'IRB-2024-005678',
    '2025-02-01',
    '2026-12-31',
    'active',
    '{"required": ["wellness_scores", "goal_tracking"], "optional": ["demographics"]}'::jsonb,
    300,
    5000
  );

COMMENT ON TABLE public.research_programs IS 'Research Participation DLC: Active research programs';
COMMENT ON TABLE public.research_participation IS 'Research Participation DLC: User participation records';
COMMENT ON TABLE public.anonymized_contributions IS 'Research Participation DLC: Anonymized data contributions';
COMMENT ON TABLE public.research_rewards IS 'Research Participation DLC: User rewards balances';
COMMENT ON TABLE public.data_usage_transparency IS 'Research Participation DLC: Published research transparency';


-- END MIGRATION: 20251226030005_research_participation_dlc.sql

-- BEGIN MIGRATION: 20251227090000_nsfw_dlc_addons_catalog.sql

-- Migration: Expand NSFW DLC add-ons catalog (store + entitlements)
-- Purpose:
-- - Add additional NSFW DLC add-ons to dlc_packages (beyond the original 7-package baseline)
-- - Keep idempotent behavior (safe to re-run)
-- Notes:
-- - Does not delete or deactivate existing packages
-- - Stripe IDs are configured separately via admin UI (stripe_price_id/stripe_product_id columns already exist)

WITH catalog AS (
  SELECT * FROM (VALUES
    (
      'dlc-analytics',
      'Wellness Analytics',
      'individual',
      'Adult wellness analytics, reports, and partner-aware insights.',
      'Unlock wellness analytics: trend analysis, reports, partner sync insights, and richer dashboards. Designed for adult wellness tracking with privacy-first defaults.',
      'See patterns. Improve outcomes.',
      9.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":8.99,"GBP":7.99,"CAD":12.99}'::jsonb,
      '[
        {"id":"wellness_analytics","name":"Wellness Analytics","description":"Detailed intimate wellness tracking","icon":"BarChart","category":"analytics"},
        {"id":"partner_sync","name":"Partner Sync","description":"Sync data with your partner","icon":"Users","category":"analytics"},
        {"id":"intimate_reports","name":"Intimate Reports","description":"Generate detailed wellness reports","icon":"FileText","category":"analytics"},
        {"id":"trend_analysis","name":"Trend Analysis","description":"Analyze patterns and trends","icon":"TrendingUp","category":"analytics"},
        {"id":"relationship_insights","name":"Relationship Insights","description":"AI-powered relationship insights","icon":"Lightbulb","category":"analytics"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.27',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      8,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-community',
      'Private Community',
      'individual',
      'Private adult community forum, groups, and expert Q&A.',
      'Unlock community features: private forum, support groups, expert Q&A, and member-only content. Built with anonymity controls, redaction options, and moderation workflows.',
      'Connect safely, learn faster',
      9.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":8.99,"GBP":7.99,"CAD":12.99}'::jsonb,
      '[
        {"id":"private_forum","name":"Private Forum","description":"Access to private adult community forum","icon":"MessageCircle","category":"community"},
        {"id":"private_groups","name":"Private Groups","description":"Join or create private discussion groups","icon":"Users","category":"community"},
        {"id":"expert_qa","name":"Expert Q&A","description":"Ask questions to verified experts","icon":"HelpCircle","category":"community"},
        {"id":"creator_marketplace","name":"Creator Marketplace","description":"Access premium content from creators","icon":"ShoppingBag","category":"marketplace"},
        {"id":"exclusive_content","name":"Exclusive Content","description":"Members-only exclusive content","icon":"Lock","category":"community"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.27',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      9,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-topics-library',
      'Topics Library',
      'individual',
      'Adult educational topics library with privacy-safe presentation.',
      'Unlock the Topics Library module. Topic packs add specific content gates (Power Dynamics, Tantric, Roleplay, etc.).',
      'Education-first library',
      2.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":2.49,"GBP":2.29,"CAD":3.99}'::jsonb,
      '[
        {"id":"topics_library","name":"Topics Library","description":"Access the Topics Library module","icon":"BookOpen","category":"topics"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.27',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      10,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-nsfw-scanner',
      'NSFW Scanner Mode',
      'individual',
      'Adult-only scanning mode with explicit-content detection controls.',
      'Unlock NSFW Scanner Mode: on-device explicit-content detection controls, thresholds, and safety policy options. Disabled by default; you must enable it in Settings after age verification.',
      'Adult-only scanning mode',
      6.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":5.99,"GBP":5.49,"CAD":8.99}'::jsonb,
      '[
        {"id":"nsfw_scanner_mode","name":"NSFW Scanner Mode","description":"Enable adult-only scanning mode and policy controls","icon":"Shield","category":"advanced"},
        {"id":"explicit_content_detection","name":"Explicit Content Detection","description":"On-device explicit content detection (NSFWJS + TFJS)","icon":"Eye","category":"advanced"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.27',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      11,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-advanced-nsfw-detection',
      'Advanced NSFW Detection Modes',
      'subscription',
      'Advanced detection, ensemble scoring, and detailed breakdowns (adult).',
      'Unlock advanced NSFW detection modes: configurable model selection, ensemble scoring, and opt-in detection history (no image content stored).',
      'More control. More confidence.',
      14.99::DECIMAL(10,2),
      'subscription',
      'monthly',
      '{"EUR":13.99,"GBP":12.99,"CAD":19.99}'::jsonb,
      '[
        {"id":"advanced_nsfw_detection","name":"Advanced NSFW Detection Modes","description":"Multi-model detection, ensemble scoring, and detailed breakdowns","icon":"Sparkles","category":"advanced"},
        {"id":"nsfw_detection_history","name":"Detection History","description":"Store and review past detection results (opt-in; no image content stored)","icon":"BarChart","category":"advanced"},
        {"id":"nsfw_comparison_mode","name":"Comparison Mode","description":"Compare results across enabled models and thresholds","icon":"Columns","category":"advanced"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.27',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      12,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    )
  ) AS t(
    package_id,
    package_name,
    package_type,
    safe_description,
    full_description,
    marketing_tagline,
    price_usd,
    price_type,
    subscription_interval,
    regional_pricing,
    features,
    included_packages,
    version,
    content_version,
    min_app_version,
    max_app_version,
    content_changelog,
    is_active,
    is_featured,
    display_order,
    content_rating,
    preview_images,
    preview_video_url,
    localized_names,
    localized_descriptions
  )
)
INSERT INTO public.dlc_packages (
  package_id,
  package_name,
  package_type,
  safe_description,
  full_description,
  marketing_tagline,
  price_usd,
  price_type,
  subscription_interval,
  regional_pricing,
  features,
  included_packages,
  version,
  content_version,
  min_app_version,
  max_app_version,
  content_changelog,
  is_active,
  is_featured,
  display_order,
  content_rating,
  preview_images,
  preview_video_url,
  localized_names,
  localized_descriptions
)
SELECT
  package_id,
  package_name,
  package_type,
  safe_description,
  full_description,
  marketing_tagline,
  price_usd,
  price_type,
  subscription_interval,
  regional_pricing,
  features,
  included_packages,
  version,
  content_version,
  min_app_version,
  max_app_version,
  content_changelog,
  is_active,
  is_featured,
  display_order,
  content_rating,
  preview_images,
  preview_video_url,
  localized_names,
  localized_descriptions
FROM catalog
ON CONFLICT (package_id) DO UPDATE SET
  package_name = EXCLUDED.package_name,
  package_type = EXCLUDED.package_type,
  safe_description = EXCLUDED.safe_description,
  full_description = EXCLUDED.full_description,
  marketing_tagline = EXCLUDED.marketing_tagline,
  price_usd = EXCLUDED.price_usd,
  price_type = EXCLUDED.price_type,
  subscription_interval = EXCLUDED.subscription_interval,
  regional_pricing = EXCLUDED.regional_pricing,
  features = EXCLUDED.features,
  included_packages = EXCLUDED.included_packages,
  version = EXCLUDED.version,
  content_version = EXCLUDED.content_version,
  min_app_version = EXCLUDED.min_app_version,
  max_app_version = EXCLUDED.max_app_version,
  content_changelog = EXCLUDED.content_changelog,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order,
  content_rating = EXCLUDED.content_rating,
  preview_images = EXCLUDED.preview_images,
  preview_video_url = EXCLUDED.preview_video_url,
  localized_names = EXCLUDED.localized_names,
  localized_descriptions = EXCLUDED.localized_descriptions,
  updated_at = now();



-- END MIGRATION: 20251227090000_nsfw_dlc_addons_catalog.sql

-- BEGIN MIGRATION: 20251228090000_cock_worshiping_addon.sql

-- Migration: Add Cock Worshiping educational add-on
-- Purpose:
-- - Register an education-first NSFW DLC add-on in `public.dlc_packages`
-- - Provide a stable feature-id gate: `cock_worshiping_education`
-- Notes:
-- - Idempotent (safe to re-run)
-- - Non-graphic educational framing; content delivered via app UI

WITH catalog AS (
  SELECT * FROM (VALUES
    (
      'dlc-cock-worshiping',
      'Cock Worshiping (Education)',
      'individual',
      'Consent-first educational guide focused on communication and emotional safety.',
      'Educational module: consent, communication frameworks, boundaries, examples, and aftercare. Non-graphic by design.',
      'Connection-first education',
      2.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":2.49,"GBP":2.29,"CAD":3.99}'::jsonb,
      '[
        {"id":"cock_worshiping_education","name":"Cock Worshiping (Education)","description":"Access the Cock Worshiping educational module","icon":"BookOpen","category":"topics"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.28',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      13,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    )
  ) AS t(
    package_id,
    package_name,
    package_type,
    safe_description,
    full_description,
    marketing_tagline,
    price_usd,
    price_type,
    subscription_interval,
    regional_pricing,
    features,
    included_packages,
    version,
    content_version,
    min_app_version,
    max_app_version,
    content_changelog,
    is_active,
    is_featured,
    display_order,
    content_rating,
    preview_images,
    preview_video_url,
    localized_names,
    localized_descriptions
  )
)
INSERT INTO public.dlc_packages (
  package_id,
  package_name,
  package_type,
  safe_description,
  full_description,
  marketing_tagline,
  price_usd,
  price_type,
  subscription_interval,
  regional_pricing,
  features,
  included_packages,
  version,
  content_version,
  min_app_version,
  max_app_version,
  content_changelog,
  is_active,
  is_featured,
  display_order,
  content_rating,
  preview_images,
  preview_video_url,
  localized_names,
  localized_descriptions
)
SELECT
  package_id,
  package_name,
  package_type,
  safe_description,
  full_description,
  marketing_tagline,
  price_usd,
  price_type,
  subscription_interval,
  regional_pricing,
  features,
  included_packages,
  version,
  content_version,
  min_app_version,
  max_app_version,
  content_changelog,
  is_active,
  is_featured,
  display_order,
  content_rating,
  preview_images,
  preview_video_url,
  localized_names,
  localized_descriptions
FROM catalog
ON CONFLICT (package_id) DO UPDATE SET
  package_name = EXCLUDED.package_name,
  package_type = EXCLUDED.package_type,
  safe_description = EXCLUDED.safe_description,
  full_description = EXCLUDED.full_description,
  marketing_tagline = EXCLUDED.marketing_tagline,
  price_usd = EXCLUDED.price_usd,
  price_type = EXCLUDED.price_type,
  subscription_interval = EXCLUDED.subscription_interval,
  regional_pricing = EXCLUDED.regional_pricing,
  features = EXCLUDED.features,
  included_packages = EXCLUDED.included_packages,
  version = EXCLUDED.version,
  content_version = EXCLUDED.content_version,
  min_app_version = EXCLUDED.min_app_version,
  max_app_version = EXCLUDED.max_app_version,
  content_changelog = EXCLUDED.content_changelog,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order,
  content_rating = EXCLUDED.content_rating,
  preview_images = EXCLUDED.preview_images,
  preview_video_url = EXCLUDED.preview_video_url,
  localized_names = EXCLUDED.localized_names,
  localized_descriptions = EXCLUDED.localized_descriptions,
  updated_at = now();



-- END MIGRATION: 20251228090000_cock_worshiping_addon.sql

-- BEGIN MIGRATION: 20251228090000_enabled_packages_catalog_expansion.sql

-- Migration: Enabled packages catalog expansion (requested list)
-- Purpose:
-- - Add missing "enabled packages" into dlc_packages
-- - Align naming for dlc-complete to "Complete DLC Bundle"
-- Notes:
-- - Idempotent (safe to re-run)
-- - Does not delete existing data

WITH catalog AS (
  SELECT * FROM (VALUES
    -- Rename/align: Complete DLC Bundle (existing id)
    (
      'dlc-complete',
      'Complete DLC Bundle',
      'bundle',
      'Everything unlocked with lifetime access and updates (adult).',
      'Every feature, every piece of content, lifetime access. Includes all current and future content updates. The best value for the complete experience.',
      'The complete bundle',
      39.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":35.99,"GBP":31.99,"CAD":49.99}'::jsonb,
      NULL::jsonb,
      ARRAY['dlc-positions','dlc-videos','dlc-intimate','dlc-creator','dlc-advanced']::TEXT[],
      '1.0.0',
      '2025.12.28',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      true,
      6,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),

    -- Standalone: AI Intimacy Coach (reuses ai_companion feature)
    (
      'dlc-ai-intimacy-coach',
      'AI Intimacy Coach',
      'individual',
      'AI-powered intimacy coaching and relationship guidance for adults.',
      'Unlock AI Intimacy Coach: private coaching sessions, conversation prompts, and relationship guidance. Includes session history and user-controlled privacy settings.',
      'Private, judgment-free coaching',
      7.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":6.99,"GBP":6.49,"CAD":9.99}'::jsonb,
      '[
        {"id":"ai_companion","name":"AI Companion Chat","description":"Chat with an AI companion for suggestions","icon":"MessageSquare","category":"advanced"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.28',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      13,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),

    -- Standalone: Intimate Date Ideas (reuses intimate_dates feature)
    (
      'dlc-intimate-date-ideas',
      'Intimate Date Ideas',
      'individual',
      'Plan and coordinate intimate dates with proposals and partner responses (adult).',
      'Unlock Intimate Date Ideas: date proposals, planning, partner response flow, and a private history of plans. Requires a real partner user id for coordination.',
      'Plan better nights',
      5.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":5.49,"GBP":4.99,"CAD":7.99}'::jsonb,
      '[
        {"id":"intimate_dates","name":"Intimate Date Ideas","description":"Plan and schedule intimate dates","icon":"Calendar","category":"advanced"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.28',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      14,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),

    -- PE Routines tiers (non-image content; still adult wellness context)
    (
      'dlc-pe-routines-beginner',
      'PE Routines - Beginner',
      'individual',
      'Beginner PE routine templates with safety-first guidance.',
      'Unlock the PE Routine Builder with beginner templates and progression. Includes exercise library and session tracking.',
      'Start safely',
      4.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":4.49,"GBP":3.99,"CAD":6.49}'::jsonb,
      '[
        {"id":"pe_routines","name":"PE Routines","description":"Unlock the PE Routine Builder experience","icon":"Dumbbell","category":"advanced"},
        {"id":"pe_routines_beginner","name":"PE Routines - Beginner","description":"Beginner routine templates and guided progression","icon":"Sparkles","category":"advanced"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.28',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      15,
      'adult',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-pe-routines-intermediate',
      'PE Routines - Intermediate',
      'individual',
      'Intermediate PE routines with enhanced progression options.',
      'Unlock intermediate routines and progression controls in the PE Routine Builder. Includes all beginner content.',
      'Build consistency',
      6.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":6.49,"GBP":5.99,"CAD":8.99}'::jsonb,
      '[
        {"id":"pe_routines","name":"PE Routines","description":"Unlock the PE Routine Builder experience","icon":"Dumbbell","category":"advanced"},
        {"id":"pe_routines_intermediate","name":"PE Routines - Intermediate","description":"Intermediate routine templates and progression options","icon":"TrendingUp","category":"advanced"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.28',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      16,
      'adult',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-pe-routines-advanced',
      'PE Routines - Advanced',
      'individual',
      'Advanced PE routines (including pumping-focused options) for experienced users.',
      'Unlock advanced routines and progression controls in the PE Routine Builder. Includes beginner + intermediate content.',
      'Train like a pro',
      9.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":8.99,"GBP":7.99,"CAD":12.99}'::jsonb,
      '[
        {"id":"pe_routines","name":"PE Routines","description":"Unlock the PE Routine Builder experience","icon":"Dumbbell","category":"advanced"},
        {"id":"pe_routines_advanced","name":"PE Routines - Advanced","description":"Advanced routines and progression controls","icon":"Zap","category":"advanced"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.28',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      17,
      'adult',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-pe-routines',
      'PE Routines',
      'bundle',
      'Full PE routine library (beginner → advanced).',
      'Unlock all PE routine tiers: beginner, intermediate, and advanced, plus progression controls and full routine browsing.',
      'All routine tiers',
      14.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":13.99,"GBP":12.99,"CAD":18.99}'::jsonb,
      '[
        {"id":"pe_routines","name":"PE Routines","description":"Unlock the PE Routine Builder experience","icon":"Dumbbell","category":"advanced"},
        {"id":"pe_routines_advanced","name":"PE Routines - Advanced","description":"Advanced routines and progression controls","icon":"Zap","category":"advanced"}
      ]'::jsonb,
      ARRAY['dlc-pe-routines-beginner','dlc-pe-routines-intermediate','dlc-pe-routines-advanced']::TEXT[],
      '1.0.0',
      '2025.12.28',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      true,
      18,
      'adult',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),

    -- Positions Gallery tiers (curation flags used by UI)
    (
      'dlc-positions-gallery-beginner',
      'Positions Gallery - Beginner',
      'individual',
      'Beginner-friendly positions curation and simplified navigation (adult).',
      'Unlock Positions Gallery with beginner curation and simplified navigation. Includes core gallery features and safety-first guidance.',
      'Beginner-friendly curation',
      4.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":4.49,"GBP":3.99,"CAD":6.49}'::jsonb,
      '[
        {"id":"positions_gallery","name":"Positions Gallery","description":"100+ positions with visual guides","icon":"Heart","category":"positions"},
        {"id":"position_details","name":"Position Details","description":"Detailed instructions and tips for each position","icon":"Info","category":"positions"},
        {"id":"position_favorites","name":"Favorites","description":"Save and organize your favorite positions","icon":"Star","category":"positions"},
        {"id":"position_filters","name":"Advanced Filters","description":"Filter by difficulty, category, and more","icon":"Filter","category":"positions"},
        {"id":"position_playlists","name":"Position Playlists","description":"Create custom position playlists","icon":"List","category":"positions"},
        {"id":"positions_gallery_beginner","name":"Positions Gallery - Beginner","description":"Beginner-friendly positions curation","icon":"Sparkles","category":"positions"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.28',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      19,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-positions-gallery-intermediate',
      'Positions Gallery - Intermediate',
      'individual',
      'Intermediate positions curation with enhanced filters (adult).',
      'Unlock Positions Gallery with intermediate curation and enhanced filtering. Includes all beginner curation.',
      'Enhanced filters + curation',
      6.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":6.49,"GBP":5.99,"CAD":8.99}'::jsonb,
      '[
        {"id":"positions_gallery","name":"Positions Gallery","description":"100+ positions with visual guides","icon":"Heart","category":"positions"},
        {"id":"position_details","name":"Position Details","description":"Detailed instructions and tips for each position","icon":"Info","category":"positions"},
        {"id":"position_favorites","name":"Favorites","description":"Save and organize your favorite positions","icon":"Star","category":"positions"},
        {"id":"position_filters","name":"Advanced Filters","description":"Filter by difficulty, category, and more","icon":"Filter","category":"positions"},
        {"id":"position_playlists","name":"Position Playlists","description":"Create custom position playlists","icon":"List","category":"positions"},
        {"id":"positions_gallery_intermediate","name":"Positions Gallery - Intermediate","description":"Intermediate positions curation","icon":"TrendingUp","category":"positions"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.28',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      20,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    ),
    (
      'dlc-positions-gallery-advanced',
      'Positions Gallery - Advanced',
      'individual',
      'Advanced positions curation including expert-level entries (adult).',
      'Unlock Positions Gallery with advanced curation, expert-level entries, and the richest filtering experience. Includes all beginner + intermediate curation.',
      'Advanced curation',
      9.99::DECIMAL(10,2),
      'one_time',
      NULL::TEXT,
      '{"EUR":8.99,"GBP":7.99,"CAD":12.99}'::jsonb,
      '[
        {"id":"positions_gallery","name":"Positions Gallery","description":"100+ positions with visual guides","icon":"Heart","category":"positions"},
        {"id":"position_details","name":"Position Details","description":"Detailed instructions and tips for each position","icon":"Info","category":"positions"},
        {"id":"position_favorites","name":"Favorites","description":"Save and organize your favorite positions","icon":"Star","category":"positions"},
        {"id":"position_filters","name":"Advanced Filters","description":"Filter by difficulty, category, and more","icon":"Filter","category":"positions"},
        {"id":"position_playlists","name":"Position Playlists","description":"Create custom position playlists","icon":"List","category":"positions"},
        {"id":"positions_gallery_advanced","name":"Positions Gallery - Advanced","description":"Advanced positions curation","icon":"Flame","category":"positions"}
      ]'::jsonb,
      NULL::TEXT[],
      '1.0.0',
      '2025.12.28',
      '1.0.0',
      NULL::TEXT,
      '[]'::jsonb,
      true,
      false,
      21,
      '18+',
      NULL::TEXT[],
      NULL::TEXT,
      '{}'::jsonb,
      '{}'::jsonb
    )
  ) AS t(
    package_id,
    package_name,
    package_type,
    safe_description,
    full_description,
    marketing_tagline,
    price_usd,
    price_type,
    subscription_interval,
    regional_pricing,
    features,
    included_packages,
    version,
    content_version,
    min_app_version,
    max_app_version,
    content_changelog,
    is_active,
    is_featured,
    display_order,
    content_rating,
    preview_images,
    preview_video_url,
    localized_names,
    localized_descriptions
  )
)
INSERT INTO public.dlc_packages (
  package_id,
  package_name,
  package_type,
  safe_description,
  full_description,
  marketing_tagline,
  price_usd,
  price_type,
  subscription_interval,
  regional_pricing,
  features,
  included_packages,
  version,
  content_version,
  min_app_version,
  max_app_version,
  content_changelog,
  is_active,
  is_featured,
  display_order,
  content_rating,
  preview_images,
  preview_video_url,
  localized_names,
  localized_descriptions
)
SELECT
  package_id,
  package_name,
  package_type,
  safe_description,
  full_description,
  marketing_tagline,
  price_usd,
  price_type,
  subscription_interval,
  regional_pricing,
  -- If a row provides NULL features, keep existing DB features (don’t wipe).
  features,
  included_packages,
  version,
  content_version,
  min_app_version,
  max_app_version,
  content_changelog,
  is_active,
  is_featured,
  display_order,
  content_rating,
  preview_images,
  preview_video_url,
  localized_names,
  localized_descriptions
FROM catalog
ON CONFLICT (package_id) DO UPDATE SET
  package_name = EXCLUDED.package_name,
  package_type = EXCLUDED.package_type,
  safe_description = EXCLUDED.safe_description,
  full_description = EXCLUDED.full_description,
  marketing_tagline = EXCLUDED.marketing_tagline,
  price_usd = EXCLUDED.price_usd,
  price_type = EXCLUDED.price_type,
  subscription_interval = EXCLUDED.subscription_interval,
  regional_pricing = EXCLUDED.regional_pricing,
  features = COALESCE(EXCLUDED.features, public.dlc_packages.features),
  included_packages = EXCLUDED.included_packages,
  version = EXCLUDED.version,
  content_version = EXCLUDED.content_version,
  min_app_version = EXCLUDED.min_app_version,
  max_app_version = EXCLUDED.max_app_version,
  content_changelog = EXCLUDED.content_changelog,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order,
  content_rating = EXCLUDED.content_rating,
  preview_images = EXCLUDED.preview_images,
  preview_video_url = EXCLUDED.preview_video_url,
  localized_names = EXCLUDED.localized_names,
  localized_descriptions = EXCLUDED.localized_descriptions,
  updated_at = now();



-- END MIGRATION: 20251228090000_enabled_packages_catalog_expansion.sql

-- BEGIN MIGRATION: 20251228093000_super_admin_email_bypass_has_role.sql

-- Super admin email-based bypass for role checks
-- This ensures the owner account (n8ter8@gmail.com) has full admin/super_admin DB privileges
-- even if the user_roles row has not yet been created (e.g., fresh environments).
--
-- Idempotent: CREATE OR REPLACE

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Email-based super admin bypass (only for the current authenticated user)
    (
      _user_id = auth.uid()
      AND lower(coalesce((auth.jwt() ->> 'email')::text, '')) = 'n8ter8@gmail.com'
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
$$;



-- END MIGRATION: 20251228093000_super_admin_email_bypass_has_role.sql

-- BEGIN MIGRATION: 20251228093500_positions_super_admin_policies.sql

-- Positions Gallery: admin/super_admin full access policies
-- Ensures super_admin (including email-bypass in public.has_role) can view/manage all rows,
-- including moderation fields (e.g., unapproved reviews).
--
-- Idempotent: DROP POLICY IF EXISTS + recreate, guarded for missing tables.

DO $$
BEGIN
  -- position_difficulty_ratings
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position difficulty ratings" ON public.position_difficulty_ratings;
    CREATE POLICY "Admins can manage all position difficulty ratings"
      ON public.position_difficulty_ratings
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_effectiveness_tracking
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position effectiveness tracking" ON public.position_effectiveness_tracking;
    CREATE POLICY "Admins can manage all position effectiveness tracking"
      ON public.position_effectiveness_tracking
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_reviews (moderation)
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position reviews" ON public.position_reviews;
    CREATE POLICY "Admins can manage all position reviews"
      ON public.position_reviews
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_playlists
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position playlists" ON public.position_playlists;
    CREATE POLICY "Admins can manage all position playlists"
      ON public.position_playlists
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_recommendations
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position recommendations" ON public.position_recommendations;
    CREATE POLICY "Admins can manage all position recommendations"
      ON public.position_recommendations
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_viewing_analytics
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position viewing analytics" ON public.position_viewing_analytics;
    CREATE POLICY "Admins can manage all position viewing analytics"
      ON public.position_viewing_analytics
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_comparisons
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position comparisons" ON public.position_comparisons;
    CREATE POLICY "Admins can manage all position comparisons"
      ON public.position_comparisons
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_variations
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position variations" ON public.position_variations;
    CREATE POLICY "Admins can manage all position variations"
      ON public.position_variations
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
END $$;



-- END MIGRATION: 20251228093500_positions_super_admin_policies.sql

-- BEGIN MIGRATION: 20260110193116_9ba25dae-c577-4655-92d8-c632806c345c.sql

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

-- END MIGRATION: 20260110193116_9ba25dae-c577-4655-92d8-c632806c345c.sql

-- BEGIN MIGRATION: 20260112032559_b9a47b16-d7bd-4fb9-a4d6-a3171f6c4763.sql

-- Create webhooks table with proper structure
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  webhook_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT NOT NULL,
  subscribed_events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  max_retries INTEGER NOT NULL DEFAULT 3,
  retry_delay_seconds INTEGER NOT NULL DEFAULT 60,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  successful_deliveries INTEGER NOT NULL DEFAULT 0,
  failed_deliveries INTEGER NOT NULL DEFAULT 0,
  last_delivery_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on webhooks table
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Users can only view their own webhooks
CREATE POLICY "Users can view their own webhooks"
ON public.webhooks
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert webhooks for themselves
CREATE POLICY "Users can create their own webhooks"
ON public.webhooks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own webhooks
CREATE POLICY "Users can update their own webhooks"
ON public.webhooks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own webhooks
CREATE POLICY "Users can delete their own webhooks"
ON public.webhooks
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON public.webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- END MIGRATION: 20260112032559_b9a47b16-d7bd-4fb9-a4d6-a3171f6c4763.sql

-- BEGIN MIGRATION: 20260128210431_92adba8d-8993-4f9e-8ae1-7fba9ea73cb7.sql

-- Create a secure view for public leaderboard access that excludes user_id
-- This prevents user activity tracking while maintaining leaderboard functionality

-- Create a materialized view for public leaderboard data without user_id
CREATE OR REPLACE VIEW public.leaderboards_public AS
SELECT 
    id,
    leaderboard_type,
    period,
    score,
    rank,
    display_name,
    is_anonymous,
    created_at,
    updated_at
FROM public.leaderboards;

-- Grant SELECT on the view to authenticated and anon users
GRANT SELECT ON public.leaderboards_public TO authenticated, anon;

-- Drop the overly permissive SELECT policy on leaderboards
DROP POLICY IF EXISTS "Anyone can view leaderboards" ON public.leaderboards;

-- Create a new policy that only allows users to view their own entries
CREATE POLICY "Users can view their own leaderboard entries"
ON public.leaderboards
FOR SELECT
USING (auth.uid() = user_id);

-- Add a comment explaining the security model
COMMENT ON VIEW public.leaderboards_public IS 'Secure public view of leaderboards that excludes user_id to prevent activity tracking. Use this view for public leaderboard displays.';
COMMENT ON TABLE public.leaderboards IS 'Private leaderboard data with user_id. Direct access restricted to own entries only. Use leaderboards_public view for anonymous public access.';

-- END MIGRATION: 20260128210431_92adba8d-8993-4f9e-8ae1-7fba9ea73cb7.sql

-- BEGIN MIGRATION: 20260128210452_759f111f-df26-416c-a6da-43b03aea04c5.sql

-- Fix the security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboards_public;

-- Recreate view with explicit SECURITY INVOKER (default, but being explicit)
CREATE VIEW public.leaderboards_public 
WITH (security_invoker = true)
AS
SELECT 
    id,
    leaderboard_type,
    period,
    score,
    rank,
    display_name,
    is_anonymous,
    created_at,
    updated_at
FROM public.leaderboards;

-- Re-grant SELECT on the view
GRANT SELECT ON public.leaderboards_public TO authenticated, anon;

-- Add comments
COMMENT ON VIEW public.leaderboards_public IS 'Secure public view of leaderboards that excludes user_id to prevent activity tracking. Uses SECURITY INVOKER for proper RLS enforcement.';

-- END MIGRATION: 20260128210452_759f111f-df26-416c-a6da-43b03aea04c5.sql

-- BEGIN MIGRATION: 20260128210510_ec030537-e465-477e-b22b-534e4986bdd4.sql

-- The issue is that with SECURITY INVOKER, anonymous users can't access the base table
-- We need a different approach: create a function that returns the public data

-- Drop the view
DROP VIEW IF EXISTS public.leaderboards_public;

-- Create a SECURITY DEFINER function with proper restrictions to fetch public leaderboard data
-- This is the recommended pattern when we need to expose data publicly but restrict columns
CREATE OR REPLACE FUNCTION public.get_public_leaderboards(
    p_leaderboard_type text DEFAULT NULL,
    p_period text DEFAULT NULL,
    p_limit integer DEFAULT 100
)
RETURNS TABLE (
    id uuid,
    leaderboard_type text,
    period text,
    score integer,
    rank integer,
    display_name text,
    is_anonymous boolean,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        l.id,
        l.leaderboard_type,
        l.period,
        l.score,
        l.rank,
        l.display_name,
        l.is_anonymous,
        l.created_at,
        l.updated_at
    FROM public.leaderboards l
    WHERE 
        (p_leaderboard_type IS NULL OR l.leaderboard_type = p_leaderboard_type)
        AND (p_period IS NULL OR l.period = p_period)
    ORDER BY l.rank ASC NULLS LAST, l.score DESC
    LIMIT LEAST(p_limit, 100);
$$;

-- Grant execute to all users
GRANT EXECUTE ON FUNCTION public.get_public_leaderboards(text, text, integer) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION public.get_public_leaderboards IS 'Secure function to get public leaderboard data without exposing user_id. Prevents user activity tracking while maintaining leaderboard functionality.';

-- END MIGRATION: 20260128210510_ec030537-e465-477e-b22b-534e4986bdd4.sql

-- BEGIN MIGRATION: 20260130123000_partner_sync_intimacy_features.sql

-- Migration: Partner Sync Intimacy Features
-- Adds thought pings and partner position selections with RLS.

-- ==================== Partner Thought Pings ====================
CREATE TABLE IF NOT EXISTS public.partner_thought_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tone_tags TEXT[] DEFAULT '{}'::text[],
  intensity TEXT DEFAULT 'medium' CHECK (intensity IN ('soft', 'playful', 'medium', 'intense', 'wild')),
  theme TEXT,
  message TEXT NOT NULL,
  detailed_message TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'read', 'archived', 'responded')),
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_connection_id
  ON public.partner_thought_pings(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_recipient_id
  ON public.partner_thought_pings(recipient_id);
CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_status
  ON public.partner_thought_pings(status);
CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_created_at
  ON public.partner_thought_pings(created_at DESC);

ALTER TABLE public.partner_thought_pings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_thought_pings'
      AND policyname = 'Partner pings select'
  ) THEN
    CREATE POLICY "Partner pings select"
      ON public.partner_thought_pings
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_thought_pings.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_thought_pings'
      AND policyname = 'Partner pings insert'
  ) THEN
    CREATE POLICY "Partner pings insert"
      ON public.partner_thought_pings
      FOR INSERT
      WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_thought_pings.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_thought_pings'
      AND policyname = 'Partner pings update'
  ) THEN
    CREATE POLICY "Partner pings update"
      ON public.partner_thought_pings
      FOR UPDATE
      USING (
        (sender_id = auth.uid() OR recipient_id = auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_thought_pings.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      )
      WITH CHECK (
        (sender_id = auth.uid() OR recipient_id = auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_thought_pings.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_thought_pings'
      AND policyname = 'Partner pings delete'
  ) THEN
    CREATE POLICY "Partner pings delete"
      ON public.partner_thought_pings
      FOR DELETE
      USING (
        sender_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_thought_pings.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;
END $$;

-- ==================== Partner Position Selections ====================
CREATE TABLE IF NOT EXISTS public.partner_position_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.nsfw_positions_gallery(id) ON DELETE SET NULL,
  custom_position_name TEXT,
  custom_description TEXT,
  suggested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_for UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selection_status TEXT DEFAULT 'pending' CHECK (selection_status IN ('pending', 'accepted', 'declined', 'tried', 'archived')),
  theme_tags TEXT[] DEFAULT '{}'::text[],
  intensity TEXT DEFAULT 'medium' CHECK (intensity IN ('soft', 'playful', 'medium', 'intense', 'wild')),
  note TEXT,
  partner_note TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (position_id IS NOT NULL OR custom_position_name IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_partner_position_selections_connection_id
  ON public.partner_position_selections(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_position_selections_suggested_by
  ON public.partner_position_selections(suggested_by);
CREATE INDEX IF NOT EXISTS idx_partner_position_selections_suggested_for
  ON public.partner_position_selections(suggested_for);
CREATE INDEX IF NOT EXISTS idx_partner_position_selections_status
  ON public.partner_position_selections(selection_status);
CREATE INDEX IF NOT EXISTS idx_partner_position_selections_created_at
  ON public.partner_position_selections(created_at DESC);

ALTER TABLE public.partner_position_selections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_position_selections'
      AND policyname = 'Partner position selections select'
  ) THEN
    CREATE POLICY "Partner position selections select"
      ON public.partner_position_selections
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_position_selections.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_position_selections'
      AND policyname = 'Partner position selections insert'
  ) THEN
    CREATE POLICY "Partner position selections insert"
      ON public.partner_position_selections
      FOR INSERT
      WITH CHECK (
        suggested_by = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_position_selections.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_position_selections'
      AND policyname = 'Partner position selections update'
  ) THEN
    CREATE POLICY "Partner position selections update"
      ON public.partner_position_selections
      FOR UPDATE
      USING (
        (suggested_by = auth.uid() OR suggested_for = auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_position_selections.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      )
      WITH CHECK (
        (suggested_by = auth.uid() OR suggested_for = auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_position_selections.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_position_selections'
      AND policyname = 'Partner position selections delete'
  ) THEN
    CREATE POLICY "Partner position selections delete"
      ON public.partner_position_selections
      FOR DELETE
      USING (
        suggested_by = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_position_selections.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;
END $$;


-- END MIGRATION: 20260130123000_partner_sync_intimacy_features.sql

-- BEGIN MIGRATION: 20260130160000_partner_sync_enhancements.sql

-- Partner Sync Enhancements: preferences, templates, audit, retention, date plan items

-- ==================== Partner Thought Ping Enhancements ====================
ALTER TABLE public.partner_thought_pings
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_state TEXT DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_receipt_requested BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS private_note_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS images_urls TEXT[],
  ADD COLUMN IF NOT EXISTS gifs_urls TEXT[],
  ADD COLUMN IF NOT EXISTS voice_message_url TEXT,
  ADD COLUMN IF NOT EXISTS quick_reply_used TEXT,
  ADD COLUMN IF NOT EXISTS reaction_summary JSONB DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'partner_thought_pings_status_check'
  ) THEN
    ALTER TABLE public.partner_thought_pings DROP CONSTRAINT partner_thought_pings_status_check;
  END IF;
END $$;

ALTER TABLE public.partner_thought_pings
  ADD CONSTRAINT partner_thought_pings_status_check
  CHECK (status IN ('sent', 'read', 'archived', 'responded', 'scheduled'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_thought_pings_priority_check'
  ) THEN
    ALTER TABLE public.partner_thought_pings
      ADD CONSTRAINT partner_thought_pings_priority_check
      CHECK (priority IN ('normal', 'high'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_thought_pings_delivery_state_check'
  ) THEN
    ALTER TABLE public.partner_thought_pings
      ADD CONSTRAINT partner_thought_pings_delivery_state_check
      CHECK (delivery_state IN ('queued', 'delivered', 'failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_scheduled_at
  ON public.partner_thought_pings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_delivery_state
  ON public.partner_thought_pings(delivery_state);
CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_priority
  ON public.partner_thought_pings(priority);

-- Reactions
CREATE TABLE IF NOT EXISTS public.partner_thought_ping_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ping_id UUID NOT NULL REFERENCES public.partner_thought_pings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ping_id, user_id, emoji)
);

ALTER TABLE public.partner_thought_ping_reactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_thought_ping_reactions'
      AND policyname = 'Partner ping reactions access'
  ) THEN
    CREATE POLICY "Partner ping reactions access"
      ON public.partner_thought_ping_reactions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_thought_pings ptp
          JOIN public.partner_connections pc ON pc.id = ptp.connection_id
          WHERE ptp.id = partner_thought_ping_reactions.ping_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.partner_thought_pings ptp
          JOIN public.partner_connections pc ON pc.id = ptp.connection_id
          WHERE ptp.id = partner_thought_ping_reactions.ping_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;
END $$;

-- Thought ping templates
CREATE TABLE IF NOT EXISTS public.partner_thought_ping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  detailed_message TEXT,
  tone_tags TEXT[] DEFAULT '{}'::text[],
  intensity TEXT DEFAULT 'medium' CHECK (intensity IN ('soft', 'playful', 'medium', 'intense', 'wild')),
  theme TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_thought_ping_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_thought_ping_templates'
      AND policyname = 'Users manage own ping templates'
  ) THEN
    CREATE POLICY "Users manage own ping templates"
      ON public.partner_thought_ping_templates
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Quick reply templates
CREATE TABLE IF NOT EXISTS public.partner_quick_reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  message TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_quick_reply_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_quick_reply_templates'
      AND policyname = 'Users manage own quick replies'
  ) THEN
    CREATE POLICY "Users manage own quick replies"
      ON public.partner_quick_reply_templates
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ==================== Partner Sync Preferences ====================
CREATE TABLE IF NOT EXISTS public.partner_sync_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  timezone TEXT DEFAULT 'UTC',
  rate_limit_per_hour INTEGER DEFAULT 12,
  allow_push_notifications BOOLEAN DEFAULT true,
  allow_scheduled_pings BOOLEAN DEFAULT true,
  allow_media BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_sync_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_preferences'
      AND policyname = 'Users manage own sync preferences'
  ) THEN
    CREATE POLICY "Users manage own sync preferences"
      ON public.partner_sync_preferences
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ==================== Partner Sync Consent ====================
CREATE TABLE IF NOT EXISTS public.partner_sync_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, user_id, consent_version)
);

ALTER TABLE public.partner_sync_consent ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_consent'
      AND policyname = 'Partner consent access'
  ) THEN
    CREATE POLICY "Partner consent access"
      ON public.partner_sync_consent
      FOR ALL
      USING (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_sync_consent.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
        )
      )
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ==================== Partner Sync Events & Audit ====================
CREATE TABLE IF NOT EXISTS public.partner_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_sync_events_connection_id
  ON public.partner_sync_events(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_sync_events_actor_id
  ON public.partner_sync_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_partner_sync_events_created_at
  ON public.partner_sync_events(created_at DESC);

CREATE TABLE IF NOT EXISTS public.partner_sync_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_sync_audit_connection_id
  ON public.partner_sync_audit_log(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_sync_audit_actor_id
  ON public.partner_sync_audit_log(actor_id);

ALTER TABLE public.partner_sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sync_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_events'
      AND policyname = 'Partner sync events access'
  ) THEN
    CREATE POLICY "Partner sync events access"
      ON public.partner_sync_events
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_sync_events.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_events'
      AND policyname = 'Partner sync events insert'
  ) THEN
    CREATE POLICY "Partner sync events insert"
      ON public.partner_sync_events
      FOR INSERT
      WITH CHECK (actor_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_audit_log'
      AND policyname = 'Partner audit log access'
  ) THEN
    CREATE POLICY "Partner audit log access"
      ON public.partner_sync_audit_log
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_sync_audit_log.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
        )
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'super_admin')
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_audit_log'
      AND policyname = 'Partner audit log insert'
  ) THEN
    CREATE POLICY "Partner audit log insert"
      ON public.partner_sync_audit_log
      FOR INSERT
      WITH CHECK (actor_id = auth.uid());
  END IF;
END $$;

-- ==================== Partner Sync Abuse Signals ====================
CREATE TABLE IF NOT EXISTS public.partner_sync_abuse_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.partner_connections(id) ON DELETE SET NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_sync_abuse_signals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_abuse_signals'
      AND policyname = 'Partner abuse signals access'
  ) THEN
    CREATE POLICY "Partner abuse signals access"
      ON public.partner_sync_abuse_signals
      FOR SELECT
      USING (
        auth.uid() = actor_id
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'super_admin')
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_abuse_signals'
      AND policyname = 'Partner abuse signals insert'
  ) THEN
    CREATE POLICY "Partner abuse signals insert"
      ON public.partner_sync_abuse_signals
      FOR INSERT
      WITH CHECK (actor_id = auth.uid());
  END IF;
END $$;

-- ==================== Partner Sync Retention Policies ====================
CREATE TABLE IF NOT EXISTS public.partner_sync_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  set_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retention_days_pings INTEGER DEFAULT 180,
  retention_days_selections INTEGER DEFAULT 365,
  retention_days_plans INTEGER DEFAULT 365,
  retention_days_events INTEGER DEFAULT 365,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id)
);

ALTER TABLE public.partner_sync_retention_policies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_retention_policies'
      AND policyname = 'Partner retention policies access'
  ) THEN
    CREATE POLICY "Partner retention policies access"
      ON public.partner_sync_retention_policies
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_sync_retention_policies.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_sync_retention_policies.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
        )
      );
  END IF;
END $$;

-- ==================== Partner Position Selection Enhancements ====================
ALTER TABLE public.partner_position_selections
  ADD COLUMN IF NOT EXISTS safety_checklist JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS constraints JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS availability_tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS boundary_tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS try_later BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS favorite_together BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tried_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS success_notes TEXT,
  ADD COLUMN IF NOT EXISTS success_tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS swap_group_id UUID,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS rating INTEGER,
  ADD COLUMN IF NOT EXISTS private_note_encrypted TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_position_priority_check'
  ) THEN
    ALTER TABLE public.partner_position_selections
      ADD CONSTRAINT partner_position_priority_check
      CHECK (priority IN ('normal', 'high'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_position_privacy_check'
  ) THEN
    ALTER TABLE public.partner_position_selections
      ADD CONSTRAINT partner_position_privacy_check
      CHECK (privacy_level IN ('private', 'shared', 'public'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'partner_position_selections_swap_group_id_fkey'
  ) THEN
    ALTER TABLE public.partner_position_selections
      ADD CONSTRAINT partner_position_selections_swap_group_id_fkey
      FOREIGN KEY (swap_group_id)
      REFERENCES public.partner_position_selections(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.partner_position_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.nsfw_positions_gallery(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('suggested', 'accepted', 'declined', 'tried', 'swap_requested', 'swap_accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_position_activity_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_position_activity_log'
      AND policyname = 'Partner position activity access'
  ) THEN
    CREATE POLICY "Partner position activity access"
      ON public.partner_position_activity_log
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_position_activity_log.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_position_activity_log'
      AND policyname = 'Partner position activity insert'
  ) THEN
    CREATE POLICY "Partner position activity insert"
      ON public.partner_position_activity_log
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ==================== Date Night Plan Items ====================
CREATE TABLE IF NOT EXISTS public.intimate_date_itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  segment TEXT NOT NULL CHECK (segment IN ('night_out', 'dinner', 'night_in')),
  title TEXT NOT NULL,
  time TEXT,
  location TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_itinerary_proposal
  ON public.intimate_date_itinerary_items(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  category TEXT DEFAULT 'prep' CHECK (category IN ('prep', 'during', 'aftercare')),
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_checklist_proposal
  ON public.intimate_date_checklist_items(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_packing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_packing_proposal
  ON public.intimate_date_packing_items(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_distractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_distractions_proposal
  ON public.intimate_date_distractions(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.nsfw_positions_gallery(id) ON DELETE SET NULL,
  position_label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_positions_proposal
  ON public.intimate_date_positions(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('reservation', 'travel', 'checkin', 'custom')),
  remind_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_reminders_proposal
  ON public.intimate_date_reminders(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_aftercare_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_aftercare_proposal
  ON public.intimate_date_aftercare_items(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_reflections_proposal
  ON public.intimate_date_reflections(proposal_id);

ALTER TABLE public.intimate_date_itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_distractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_aftercare_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_reflections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_itinerary_items'
      AND policyname = 'Partner date items access'
  ) THEN
    CREATE POLICY "Partner date items access"
      ON public.intimate_date_itinerary_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_itinerary_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_itinerary_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_checklist_items'
      AND policyname = 'Partner date checklist access'
  ) THEN
    CREATE POLICY "Partner date checklist access"
      ON public.intimate_date_checklist_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_checklist_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_checklist_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_packing_items'
      AND policyname = 'Partner date packing access'
  ) THEN
    CREATE POLICY "Partner date packing access"
      ON public.intimate_date_packing_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_packing_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_packing_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_distractions'
      AND policyname = 'Partner date distractions access'
  ) THEN
    CREATE POLICY "Partner date distractions access"
      ON public.intimate_date_distractions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_distractions.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_distractions.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_positions'
      AND policyname = 'Partner date positions access'
  ) THEN
    CREATE POLICY "Partner date positions access"
      ON public.intimate_date_positions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_positions.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_positions.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_reminders'
      AND policyname = 'Partner date reminders access'
  ) THEN
    CREATE POLICY "Partner date reminders access"
      ON public.intimate_date_reminders
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_reminders.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_reminders.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_aftercare_items'
      AND policyname = 'Partner date aftercare access'
  ) THEN
    CREATE POLICY "Partner date aftercare access"
      ON public.intimate_date_aftercare_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_aftercare_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_aftercare_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_reflections'
      AND policyname = 'Partner date reflections access'
  ) THEN
    CREATE POLICY "Partner date reflections access"
      ON public.intimate_date_reflections
      FOR ALL
      USING (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_reflections.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ==================== Updated_at Triggers ====================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_thought_pings_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_thought_pings_updated_at
      BEFORE UPDATE ON public.partner_thought_pings
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_position_selections_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_position_selections_updated_at
      BEFORE UPDATE ON public.partner_position_selections
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_sync_preferences_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_sync_preferences_updated_at
      BEFORE UPDATE ON public.partner_sync_preferences
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_thought_ping_templates_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_thought_ping_templates_updated_at
      BEFORE UPDATE ON public.partner_thought_ping_templates
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_quick_reply_templates_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_quick_reply_templates_updated_at
      BEFORE UPDATE ON public.partner_quick_reply_templates
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_sync_consent_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_sync_consent_updated_at
      BEFORE UPDATE ON public.partner_sync_consent
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_sync_retention_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_sync_retention_updated_at
      BEFORE UPDATE ON public.partner_sync_retention_policies
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_date_itinerary_updated_at'
  ) THEN
    CREATE TRIGGER trg_date_itinerary_updated_at
      BEFORE UPDATE ON public.intimate_date_itinerary_items
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_date_checklist_updated_at'
  ) THEN
    CREATE TRIGGER trg_date_checklist_updated_at
      BEFORE UPDATE ON public.intimate_date_checklist_items
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ==================== Stored Procedures ====================
CREATE OR REPLACE FUNCTION public.partner_sync_create_thought_ping(
  p_connection_id UUID,
  p_recipient_id UUID,
  p_message TEXT,
  p_detailed_message TEXT DEFAULT NULL,
  p_tone_tags TEXT[] DEFAULT '{}'::text[],
  p_intensity TEXT DEFAULT 'medium',
  p_theme TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_is_pinned BOOLEAN DEFAULT false,
  p_read_receipt_requested BOOLEAN DEFAULT true,
  p_private_note_encrypted TEXT DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
  p_remind_at TIMESTAMPTZ DEFAULT NULL,
  p_images_urls TEXT[] DEFAULT NULL,
  p_gifs_urls TEXT[] DEFAULT NULL,
  p_voice_message_url TEXT DEFAULT NULL
) RETURNS public.partner_thought_pings
-- Stripe webhook events
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User add-ons
CREATE TABLE IF NOT EXISTS public.user_add_ons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  add_on_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT,
  stripe_payment_intent_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Addon usage tracking
CREATE TABLE IF NOT EXISTS public.addon_usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addon_id TEXT NOT NULL,
  usage_type TEXT NOT NULL,
  usage_value INTEGER NOT NULL,
  usage_limit INTEGER,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  tracked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- SECTION 6: DLC System
-- =============================================

-- DLC Packages
CREATE TABLE IF NOT EXISTS public.dlc_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  pack_type TEXT NOT NULL DEFAULT 'addon',
  description TEXT,
  category TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  version TEXT NOT NULL DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  requires_base_pack BOOLEAN DEFAULT false,
  base_pack_id UUID REFERENCES public.dlc_packages(id),
  features JSONB,
  content_items JSONB,
  preview_images TEXT[],
  preview_video_url TEXT,
  tags TEXT[],
  included_packages TEXT[],
  item_count INTEGER,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Packs (alternate structure)
CREATE TABLE IF NOT EXISTS public.dlc_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_name TEXT NOT NULL,
  pack_type TEXT NOT NULL,
  description TEXT NOT NULL,
  preview_description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  item_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_standalone BOOLEAN DEFAULT true,
  is_subscription BOOLEAN DEFAULT false,
  subscription_duration_days INTEGER,
  requires_base_pack BOOLEAN DEFAULT false,
  base_pack_id UUID REFERENCES public.dlc_packs(id),
  category TEXT,
  tags TEXT[],
  content_rating TEXT,
  difficulty_level TEXT,
  preview_images TEXT[],
  preview_video_url TEXT,
  content_items JSONB,
  release_date TIMESTAMP WITH TIME ZONE,
  sales_count INTEGER DEFAULT 0,
  revenue_total DECIMAL(12,2) DEFAULT 0,
  average_rating DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Bundles
CREATE TABLE IF NOT EXISTS public.dlc_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_name TEXT NOT NULL,
  description TEXT NOT NULL,
  preview_description TEXT,
  preview_image_url TEXT,
  bundle_price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  discount_percentage DECIMAL(5,2),
  pack_ids TEXT[] NOT NULL DEFAULT '{}',
  pack_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_limited_time BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  sales_count INTEGER DEFAULT 0,
  revenue_total DECIMAL(12,2) DEFAULT 0,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Content Items
CREATE TABLE IF NOT EXISTS public.dlc_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.dlc_packs(id) ON DELETE CASCADE,
  content_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_description TEXT,
  file_url TEXT,
  preview_url TEXT,
  thumbnail_url TEXT,
  file_size_bytes BIGINT,
  is_active BOOLEAN DEFAULT true,
  is_preview_available BOOLEAN DEFAULT false,
  is_downloadable BOOLEAN DEFAULT true,
  is_streamable BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Licenses
CREATE TABLE IF NOT EXISTS public.dlc_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_key TEXT UNIQUE NOT NULL,
  purchase_id UUID,
  device_id TEXT,
  content_version TEXT,
  signature TEXT,
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC License Devices
CREATE TABLE IF NOT EXISTS public.dlc_license_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.dlc_licenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,
  platform TEXT,
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE
);

-- DLC Purchases
CREATE TABLE IF NOT EXISTS public.dlc_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES public.dlc_packs(id),
  bundle_id UUID REFERENCES public.dlc_bundles(id),
  purchase_type TEXT NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  is_active BOOLEAN DEFAULT true,
  access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  access_expires_at TIMESTAMP WITH TIME ZONE,
  download_enabled BOOLEAN DEFAULT true,
  stream_enabled BOOLEAN DEFAULT true,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Installations
CREATE TABLE IF NOT EXISTS public.dlc_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.dlc_packages(id),
  purchase_id UUID REFERENCES public.dlc_purchases(id),
  license_id UUID REFERENCES public.dlc_licenses(id),
  installed_version TEXT NOT NULL,
  content_version TEXT,
  device_id TEXT,
  device_platform TEXT,
  app_version TEXT,
  install_path TEXT,
  install_source TEXT,
  install_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  file_size_bytes BIGINT,
  checksum TEXT,
  is_installed BOOLEAN DEFAULT true,
  is_valid BOOLEAN DEFAULT true,
  is_corrupted BOOLEAN DEFAULT false,
  last_integrity_check TIMESTAMP WITH TIME ZONE,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Installed Content
CREATE TABLE IF NOT EXISTS public.dlc_installed_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES public.dlc_packs(id),
  purchase_id UUID NOT NULL REFERENCES public.dlc_purchases(id),
  content_item_id UUID REFERENCES public.dlc_content_items(id),
  installed_version TEXT NOT NULL,
  file_path TEXT,
  file_size_bytes BIGINT,
  checksum TEXT,
  is_valid BOOLEAN DEFAULT true,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Download Queue
CREATE TABLE IF NOT EXISTS public.dlc_download_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES public.dlc_purchases(id),
  content_item_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  downloaded_bytes BIGINT DEFAULT 0,
  download_status TEXT DEFAULT 'pending',
  download_progress DECIMAL(5,2) DEFAULT 0,
  download_speed_bytes_per_sec BIGINT,
  estimated_time_remaining_seconds INTEGER,
  download_priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Promo Codes
CREATE TABLE IF NOT EXISTS public.dlc_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  applies_to_all BOOLEAN DEFAULT false,
  applicable_pack_ids TEXT[],
  applicable_bundle_ids TEXT[],
  max_uses INTEGER,
  max_uses_per_user INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  min_purchase_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Promo Code Usage
CREATE TABLE IF NOT EXISTS public.dlc_promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.dlc_promo_codes(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES public.dlc_purchases(id),
  discount_applied DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Gift Codes
CREATE TABLE IF NOT EXISTS public.dlc_gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  pack_id UUID REFERENCES public.dlc_packs(id),
  bundle_id UUID REFERENCES public.dlc_bundles(id),
  sender_id UUID,
  sender_name TEXT,
  sender_email TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  gift_message TEXT,
  value_amount DECIMAL(10,2),
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_by UUID,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Age Verifications
CREATE TABLE IF NOT EXISTS public.dlc_age_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_method TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  terms_accepted BOOLEAN DEFAULT false,
  adult_content_consent BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- DLC Ratings
CREATE TABLE IF NOT EXISTS public.dlc_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES public.dlc_packs(id),
  bundle_id UUID REFERENCES public.dlc_bundles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT,
  review_text TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Updates
CREATE TABLE IF NOT EXISTS public.dlc_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES public.dlc_packs(id),
  version_number TEXT NOT NULL,
  update_type TEXT,
  changelog TEXT[],
  new_content_items JSONB,
  modified_content_items JSONB,
  removed_content_items TEXT[],
  update_file_url TEXT,
  update_file_size_bytes BIGINT,
  checksum TEXT,
  is_required BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  release_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- DLC Wishlist
CREATE TABLE IF NOT EXISTS public.dlc_wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES public.dlc_packs(id),
  bundle_id UUID REFERENCES public.dlc_bundles(id),
  priority INTEGER DEFAULT 0,
  notes TEXT,
  notify_on_sale BOOLEAN DEFAULT true,
  notify_on_release BOOLEAN DEFAULT true,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Admin DLC Package Toggles
CREATE TABLE IF NOT EXISTS public.admin_dlc_package_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- SECTION 7: Device Tokens & Notifications
-- =============================================

CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL,
  device_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- SECTION 8: Achievements & Gamification
-- =============================================

-- Achievement Definitions
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  badge_color TEXT NOT NULL DEFAULT '#FFD700',
  icon_name TEXT,
  points INTEGER NOT NULL DEFAULT 10,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER,
  requirement_data JSONB,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- User Streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, streak_type)
);

-- User Milestones
CREATE TABLE IF NOT EXISTS public.user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  milestone_value INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leaderboard_type TEXT NOT NULL,
  period TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  display_name TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, leaderboard_type, period)
);

-- =============================================
-- SECTION 9: Expert Content & Consultations
-- =============================================

-- Expert Profiles
CREATE TABLE IF NOT EXISTS public.expert_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  specialties TEXT[],
  credentials TEXT[],
  years_experience INTEGER,
  consultation_rate_per_hour DECIMAL(10,2),
  group_workshop_rate_per_person DECIMAL(10,2),
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  availability_schedule JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expert Articles
CREATE TABLE IF NOT EXISTS public.expert_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expert Videos
CREATE TABLE IF NOT EXISTS public.expert_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  category TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expert Consultations
CREATE TABLE IF NOT EXISTS public.expert_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  consultation_type TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT DEFAULT 'scheduled',
  meeting_url TEXT,
  notes TEXT,
  recording_url TEXT,
  payment_amount DECIMAL(10,2),
  payment_status TEXT,
  rating INTEGER,
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expert Group Workshops
CREATE TABLE IF NOT EXISTS public.expert_group_workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  price_per_person DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'upcoming',
  meeting_url TEXT,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Expert Questions
CREATE TABLE IF NOT EXISTS public.expert_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.expert_profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  category TEXT,
  status TEXT DEFAULT 'pending',
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- SECTION 10: Community Forum
-- =============================================

-- Forum Categories
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  thread_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Forum Threads
CREATE TABLE IF NOT EXISTS public.forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.forum_categories(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  last_reply_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- SECTION 11: Analytics & Events
-- =============================================

-- App Analytics Events
CREATE TABLE IF NOT EXISTS public.app_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_name TEXT NOT NULL,
  event_category TEXT,
  event_action TEXT,
  event_label TEXT,
  event_value DECIMAL(12,2),
  properties JSONB,
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_platform TEXT,
  app_version TEXT,
  app_build TEXT,
  distribution_channel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- SECTION 12: Beta Testers
-- =============================================

CREATE TABLE IF NOT EXISTS public.beta_testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  notes TEXT,
  granted_by UUID,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- SECTION 13: Multi-Camera Sessions
-- =============================================

CREATE TABLE IF NOT EXISTS public.multi_camera_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_name TEXT,
  session_type TEXT DEFAULT 'capture',
  status TEXT DEFAULT 'active',
  camera_count INTEGER DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.camera_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.multi_camera_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camera_index INTEGER NOT NULL,
  camera_name TEXT,
  device_id TEXT,
  device_type TEXT,
  resolution_width INTEGER,
  resolution_height INTEGER,
  fps INTEGER,
  codec TEXT,
  is_active BOOLEAN DEFAULT true,
  is_recording BOOLEAN DEFAULT false,
  video_url TEXT,
  video_storage_path TEXT,
  video_size_bytes BIGINT,
  video_duration_seconds INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  stopped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- SECTION 14: Core Functions
-- =============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Handle new user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Role check function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user roles function
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Achievement progress function
CREATE OR REPLACE FUNCTION public.check_achievement_progress(p_user_id UUID, p_achievement_code TEXT, p_progress_increment INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender UUID := auth.uid();
  v_rate_limit INTEGER := 12;
  v_count INTEGER := 0;
  v_now TIMESTAMPTZ := NOW();
  v_quiet_enabled BOOLEAN := false;
  v_quiet_start TIME;
  v_quiet_end TIME;
  v_timezone TEXT := 'UTC';
  v_local_time TIME;
  v_row public.partner_thought_pings;
BEGIN
  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.partner_connections pc
    WHERE pc.id = p_connection_id
      AND (pc.user_id = v_sender OR pc.partner_id = v_sender)
      AND pc.status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Connection not active';
  END IF;

  SELECT rate_limit_per_hour, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone
    INTO v_rate_limit, v_quiet_enabled, v_quiet_start, v_quiet_end, v_timezone
  FROM public.partner_sync_preferences
  WHERE user_id = p_recipient_id;

  v_rate_limit := COALESCE(v_rate_limit, 12);
  v_quiet_enabled := COALESCE(v_quiet_enabled, false);
  v_timezone := COALESCE(v_timezone, 'UTC');

  IF p_message IS NULL OR length(trim(p_message)) = 0 THEN
    RAISE EXCEPTION 'Message required';
  END IF;

  IF v_quiet_enabled AND p_scheduled_at IS NULL THEN
    v_local_time := (v_now AT TIME ZONE v_timezone)::time;
    IF v_quiet_start < v_quiet_end THEN
      IF v_local_time BETWEEN v_quiet_start AND v_quiet_end THEN
        RAISE EXCEPTION 'Recipient quiet hours enabled';
      END IF;
    ELSE
      IF v_local_time >= v_quiet_start OR v_local_time <= v_quiet_end THEN
        RAISE EXCEPTION 'Recipient quiet hours enabled';
      END IF;
    END IF;
  END IF;

  SELECT COUNT(1) INTO v_count
  FROM public.partner_thought_pings
  WHERE sender_id = v_sender
    AND created_at >= (v_now - INTERVAL '1 hour');

  IF v_count >= v_rate_limit THEN
    INSERT INTO public.partner_sync_abuse_signals(connection_id, actor_id, signal_type, severity, metadata)
    VALUES (p_connection_id, v_sender, 'ping_rate_limit', 'medium', jsonb_build_object('count', v_count));
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;

  INSERT INTO public.partner_thought_pings (
    connection_id,
    sender_id,
    recipient_id,
    tone_tags,
    intensity,
    theme,
    message,
    detailed_message,
    status,
    delivery_state,
    priority,
    is_pinned,
    read_receipt_requested,
    private_note_encrypted,
    scheduled_at,
    remind_at,
    images_urls,
    gifs_urls,
    voice_message_url,
    created_at,
    updated_at
  ) VALUES (
    p_connection_id,
    v_sender,
    p_recipient_id,
    COALESCE(p_tone_tags, '{}'::text[]),
    p_intensity,
    p_theme,
    p_message,
    p_detailed_message,
    CASE WHEN p_scheduled_at IS NOT NULL AND p_scheduled_at > v_now THEN 'scheduled' ELSE 'sent' END,
    CASE WHEN p_scheduled_at IS NOT NULL AND p_scheduled_at > v_now THEN 'queued' ELSE 'delivered' END,
    p_priority,
    p_is_pinned,
    p_read_receipt_requested,
    p_private_note_encrypted,
    p_scheduled_at,
    p_remind_at,
    p_images_urls,
    p_gifs_urls,
    p_voice_message_url,
    v_now,
    v_now
  ) RETURNING * INTO v_row;

  INSERT INTO public.partner_sync_events(connection_id, actor_id, event_type, metadata)
  VALUES (p_connection_id, v_sender, 'thought_ping_sent', jsonb_build_object('ping_id', v_row.id));

  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION public.partner_sync_create_date_plan(
  p_partner_id UUID,
  p_title TEXT,
  p_date DATE,
  p_time TIME,
  p_location_name TEXT DEFAULT NULL,
  p_location_address TEXT DEFAULT NULL,
  p_location_type TEXT DEFAULT 'home',
  p_is_location_private BOOLEAN DEFAULT true,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_activities JSONB DEFAULT '{}'::jsonb,
  p_positions TEXT[] DEFAULT '{}'::text[],
  p_message TEXT DEFAULT NULL,
  p_special_requests TEXT DEFAULT NULL,
  p_itinerary JSONB DEFAULT '[]'::jsonb,
  p_checklist TEXT[] DEFAULT '{}'::text[],
  p_packing_list TEXT[] DEFAULT '{}'::text[],
  p_distractions TEXT[] DEFAULT '{}'::text[],
  p_aftercare TEXT[] DEFAULT '{}'::text[],
  p_budget NUMERIC DEFAULT NULL,
  p_travel_minutes INTEGER DEFAULT NULL,
  p_reminders JSONB DEFAULT '[]'::jsonb
) RETURNS UUID
    v_achievement achievement_definitions%ROWTYPE;
    v_user_achievement user_achievements%ROWTYPE;
    v_new_progress INTEGER;
    v_unlocked BOOLEAN := false;
BEGIN
    SELECT * INTO v_achievement FROM achievement_definitions WHERE code = p_achievement_code AND is_active = true;
    IF NOT FOUND THEN RETURN false; END IF;
    
    SELECT * INTO v_user_achievement FROM user_achievements WHERE user_id = p_user_id AND achievement_id = v_achievement.id;
    
    IF NOT FOUND THEN
        INSERT INTO user_achievements (user_id, achievement_id, progress)
        VALUES (p_user_id, v_achievement.id, p_progress_increment)
        RETURNING * INTO v_user_achievement;
        v_new_progress := p_progress_increment;
    ELSE
        IF v_user_achievement.is_unlocked THEN RETURN false; END IF;
        v_new_progress := v_user_achievement.progress + p_progress_increment;
        UPDATE user_achievements SET progress = v_new_progress, updated_at = now()
        WHERE id = v_user_achievement.id;
    END IF;
    
    IF v_achievement.requirement_value IS NOT NULL AND v_new_progress >= v_achievement.requirement_value THEN
        UPDATE user_achievements SET is_unlocked = true, unlocked_at = now()
        WHERE user_id = p_user_id AND achievement_id = v_achievement.id;
        v_unlocked := true;
    END IF;
    
    RETURN v_unlocked;
END;
$$;

-- Streak update function
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID, p_streak_type TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_conn public.partner_connections;
  v_proposal_id UUID;
  v_idx INTEGER := 0;
  v_item JSONB;
  v_text TEXT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_conn
  FROM public.partner_connections
  WHERE ((user_id = v_user AND partner_id = p_partner_id)
     OR (user_id = p_partner_id AND partner_id = v_user))
    AND status = 'accepted'
  LIMIT 1;

  IF v_conn.id IS NULL THEN
    RAISE EXCEPTION 'No active connection';
  END IF;

  INSERT INTO public.intimate_date_proposals (
    creator_id,
    partner_id,
    proposal_title,
    proposed_date,
    proposed_time,
    location_name,
    location_address,
    location_type,
    is_location_private,
    duration_minutes,
    activities,
    specialty_intimacy,
    text_message,
    special_requests,
    proposal_status,
    created_at,
    updated_at
  ) VALUES (
    v_user,
    p_partner_id,
    p_title,
    p_date,
    p_time,
    p_location_name,
    p_location_address,
    p_location_type,
    p_is_location_private,
    p_duration_minutes,
    jsonb_set(
      jsonb_set(p_activities, '{budget}', to_jsonb(p_budget), true),
      '{travel_minutes}', to_jsonb(p_travel_minutes), true
    ),
    p_positions,
    p_message,
    p_special_requests,
    'pending',
    NOW(),
    NOW()
  ) RETURNING id INTO v_proposal_id;

  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itinerary)
  LOOP
    INSERT INTO public.intimate_date_itinerary_items (
      proposal_id, created_by, segment, title, time, location, notes, order_index
    ) VALUES (
      v_proposal_id,
      v_user,
      COALESCE(v_item->>'segment', 'dinner'),
      COALESCE(v_item->>'title', ''),
      v_item->>'time',
      v_item->>'location',
      v_item->>'notes',
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_reminders)
  LOOP
    IF (v_item->>'remindAt') IS NOT NULL AND length(v_item->>'remindAt') > 0 THEN
      INSERT INTO public.intimate_date_reminders (
        proposal_id, created_by, reminder_type, remind_at, notes
      ) VALUES (
        v_proposal_id,
        v_user,
        COALESCE(v_item->>'reminderType', 'custom'),
        (v_item->>'remindAt')::timestamptz,
        v_item->>'notes'
      );
    END IF;
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOREACH v_text IN ARRAY p_checklist
  LOOP
    INSERT INTO public.intimate_date_checklist_items (
      proposal_id, created_by, item, category, order_index
    ) VALUES (
      v_proposal_id,
      v_user,
      v_text,
      'prep',
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOREACH v_text IN ARRAY p_packing_list
  LOOP
    INSERT INTO public.intimate_date_packing_items (
      proposal_id, created_by, item, order_index
    ) VALUES (
      v_proposal_id,
      v_user,
      v_text,
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOREACH v_text IN ARRAY p_distractions
  LOOP
    INSERT INTO public.intimate_date_distractions (
      proposal_id, created_by, label
    ) VALUES (
      v_proposal_id,
      v_user,
      v_text
    );
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOREACH v_text IN ARRAY p_aftercare
  LOOP
    INSERT INTO public.intimate_date_aftercare_items (
      proposal_id, created_by, item, order_index
    ) VALUES (
      v_proposal_id,
      v_user,
      v_text,
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOREACH v_text IN ARRAY p_positions
  LOOP
    INSERT INTO public.intimate_date_positions (
      proposal_id, created_by, position_label
    ) VALUES (
      v_proposal_id,
      v_user,
      v_text
    );
    v_idx := v_idx + 1;
  END LOOP;

  INSERT INTO public.partner_sync_events(connection_id, actor_id, event_type, metadata)
  VALUES (v_conn.id, v_user, 'date_plan_created', jsonb_build_object('proposal_id', v_proposal_id));

  RETURN v_proposal_id;
END $$;

-- ==================== Retention & Panic Delete ====================
CREATE OR REPLACE FUNCTION public.partner_sync_apply_retention(p_connection_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_policy public.partner_sync_retention_policies;
BEGIN
  SELECT * INTO v_policy FROM public.partner_sync_retention_policies
  WHERE connection_id = p_connection_id;

  IF v_policy.id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.partner_thought_pings
  WHERE connection_id = p_connection_id
    AND created_at < NOW() - (COALESCE(v_policy.retention_days_pings, 0) || ' days')::interval;

  DELETE FROM public.partner_position_selections
  WHERE connection_id = p_connection_id
    AND created_at < NOW() - (COALESCE(v_policy.retention_days_selections, 0) || ' days')::interval;

  DELETE FROM public.partner_sync_events
  WHERE connection_id = p_connection_id
    AND created_at < NOW() - (COALESCE(v_policy.retention_days_events, 0) || ' days')::interval;

  DELETE FROM public.partner_sync_audit_log
  WHERE connection_id = p_connection_id
    AND created_at < NOW() - (COALESCE(v_policy.retention_days_events, 0) || ' days')::interval;

  DELETE FROM public.intimate_date_proposals p
  USING public.partner_connections pc
  WHERE pc.id = p_connection_id
    AND (
      (p.creator_id = pc.user_id AND p.partner_id = pc.partner_id)
      OR (p.creator_id = pc.partner_id AND p.partner_id = pc.user_id)
    )
    AND p.created_at < NOW() - (COALESCE(v_policy.retention_days_plans, 0) || ' days')::interval;
END $$;

CREATE OR REPLACE FUNCTION public.partner_sync_panic_delete(p_connection_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_conn public.partner_connections;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_conn
  FROM public.partner_connections
  WHERE id = p_connection_id
    AND (user_id = v_user OR partner_id = v_user);

  IF v_conn.id IS NULL THEN
    RAISE EXCEPTION 'Connection not found';
  END IF;

  DELETE FROM public.partner_thought_pings WHERE connection_id = p_connection_id;
  DELETE FROM public.partner_thought_ping_reactions
  WHERE ping_id IN (
    SELECT id FROM public.partner_thought_pings WHERE connection_id = p_connection_id
  );
  DELETE FROM public.partner_position_selections WHERE connection_id = p_connection_id;
  DELETE FROM public.partner_position_activity_log WHERE connection_id = p_connection_id;
  DELETE FROM public.partner_sync_events WHERE connection_id = p_connection_id;
  DELETE FROM public.partner_sync_audit_log WHERE connection_id = p_connection_id;
  DELETE FROM public.partner_sync_consent WHERE connection_id = p_connection_id;
  DELETE FROM public.partner_sync_retention_policies WHERE connection_id = p_connection_id;

  DELETE FROM public.intimate_date_proposals
  WHERE (creator_id = v_conn.user_id AND partner_id = v_conn.partner_id)
     OR (creator_id = v_conn.partner_id AND partner_id = v_conn.user_id);

  UPDATE public.partner_connections
  SET status = 'blocked', updated_at = NOW()
  WHERE id = p_connection_id;
END $$;

-- ==================== Response Latency Triggers ====================
CREATE OR REPLACE FUNCTION public.partner_sync_log_latency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_latency_ms BIGINT;
BEGIN
  IF TG_TABLE_NAME = 'partner_thought_pings' AND NEW.status = 'responded' THEN
    IF NEW.responded_at IS NULL THEN
      RETURN NEW;
    END IF;
    v_latency_ms := EXTRACT(EPOCH FROM (NEW.responded_at - NEW.created_at)) * 1000;
    INSERT INTO public.partner_sync_events(connection_id, actor_id, event_type, metadata)
    VALUES (NEW.connection_id, NEW.recipient_id, 'thought_ping_responded', jsonb_build_object('latency_ms', v_latency_ms));
  ELSIF TG_TABLE_NAME = 'partner_position_selections' AND NEW.selection_status IN ('accepted', 'declined', 'tried') THEN
    IF NEW.responded_at IS NULL THEN
      RETURN NEW;
    END IF;
    v_latency_ms := EXTRACT(EPOCH FROM (NEW.responded_at - NEW.created_at)) * 1000;
    INSERT INTO public.partner_sync_events(connection_id, actor_id, event_type, metadata)
    VALUES (NEW.connection_id, NEW.suggested_for, 'position_selection_' || NEW.selection_status, jsonb_build_object('latency_ms', v_latency_ms));
  ELSIF TG_TABLE_NAME = 'intimate_date_proposals' AND NEW.proposal_status IN ('accepted', 'declined', 'modified', 'resubmitted') THEN
    IF NEW.responded_at IS NULL THEN
      RETURN NEW;
    END IF;
    v_latency_ms := EXTRACT(EPOCH FROM (NEW.responded_at - NEW.created_at)) * 1000;
    INSERT INTO public.partner_sync_events(connection_id, actor_id, event_type, metadata)
    VALUES (
      (SELECT pc.id FROM public.partner_connections pc
        WHERE (pc.user_id = NEW.creator_id AND pc.partner_id = NEW.partner_id)
           OR (pc.user_id = NEW.partner_id AND pc.partner_id = NEW.creator_id)
        LIMIT 1),
      NEW.partner_id,
      'date_plan_' || NEW.proposal_status,
      jsonb_build_object('latency_ms', v_latency_ms)
    );
  END IF;
  RETURN NEW;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_thought_pings_latency') THEN
    CREATE TRIGGER trg_partner_thought_pings_latency
      AFTER UPDATE ON public.partner_thought_pings
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION public.partner_sync_log_latency();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_position_latency') THEN
    CREATE TRIGGER trg_partner_position_latency
      AFTER UPDATE ON public.partner_position_selections
      FOR EACH ROW
      WHEN (OLD.selection_status IS DISTINCT FROM NEW.selection_status)
      EXECUTE FUNCTION public.partner_sync_log_latency();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_date_latency') THEN
    CREATE TRIGGER trg_partner_date_latency
      AFTER UPDATE ON public.intimate_date_proposals
      FOR EACH ROW
      WHEN (OLD.proposal_status IS DISTINCT FROM NEW.proposal_status)
      EXECUTE FUNCTION public.partner_sync_log_latency();
  END IF;
END $$;

-- ==================== Audit Trigger ====================
CREATE OR REPLACE FUNCTION public.partner_sync_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_connection UUID;
  v_target UUID;
  v_payload JSONB;
BEGIN
  IF TG_TABLE_NAME = 'partner_thought_pings' THEN
    v_connection := COALESCE(NEW.connection_id, OLD.connection_id);
    v_target := COALESCE(NEW.recipient_id, OLD.recipient_id);
  ELSIF TG_TABLE_NAME = 'partner_position_selections' THEN
    v_connection := COALESCE(NEW.connection_id, OLD.connection_id);
    v_target := COALESCE(NEW.suggested_for, OLD.suggested_for);
  ELSIF TG_TABLE_NAME = 'intimate_date_proposals' THEN
    SELECT pc.id INTO v_connection
    FROM public.partner_connections pc
    WHERE (pc.user_id = COALESCE(NEW.creator_id, OLD.creator_id)
      AND pc.partner_id = COALESCE(NEW.partner_id, OLD.partner_id))
      OR (pc.user_id = COALESCE(NEW.partner_id, OLD.partner_id)
      AND pc.partner_id = COALESCE(NEW.creator_id, OLD.creator_id))
    LIMIT 1;
    v_target := COALESCE(NEW.partner_id, OLD.partner_id);
  END IF;

  v_payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'record_id', COALESCE(NEW.id, OLD.id)
  );

  IF v_connection IS NOT NULL AND v_actor IS NOT NULL THEN
    INSERT INTO public.partner_sync_audit_log(
      connection_id,
      actor_id,
      target_user_id,
      action_type,
      payload
    ) VALUES (
      v_connection,
      v_actor,
      v_target,
      lower(TG_TABLE_NAME || '_' || TG_OP),
      v_payload
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_thought_pings_audit') THEN
    CREATE TRIGGER trg_partner_thought_pings_audit
      AFTER INSERT OR UPDATE OR DELETE ON public.partner_thought_pings
      FOR EACH ROW EXECUTE FUNCTION public.partner_sync_audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_position_audit') THEN
    CREATE TRIGGER trg_partner_position_audit
      AFTER INSERT OR UPDATE OR DELETE ON public.partner_position_selections
      FOR EACH ROW EXECUTE FUNCTION public.partner_sync_audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_date_audit') THEN
    CREATE TRIGGER trg_partner_date_audit
      AFTER INSERT OR UPDATE OR DELETE ON public.intimate_date_proposals
      FOR EACH ROW EXECUTE FUNCTION public.partner_sync_audit_trigger();
  END IF;
END $$;


-- END MIGRATION: 20260130160000_partner_sync_enhancements.sql

-- BEGIN MIGRATION: 20260131034148_842493ef-b4cc-4476-8fc1-d13a73e60fd6.sql

-- Create user_feedback table for the Feedback Hub
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  kind TEXT NOT NULL DEFAULT 'general',
  title TEXT,
  description TEXT NOT NULL,
  rating INTEGER,
  sentiment TEXT,
  severity TEXT,
  frequency TEXT,
  steps_to_reproduce TEXT,
  expected TEXT,
  actual TEXT,
  tags TEXT[],
  allow_contact BOOLEAN DEFAULT false,
  contact_email TEXT,
  environment JSONB,
  attachments TEXT[],
  status TEXT DEFAULT 'pending',
  admin_response TEXT
);

-- Enable Row Level Security
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" 
ON public.user_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own feedback
CREATE POLICY "Users can create their own feedback" 
ON public.user_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update their own feedback" 
ON public.user_feedback 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own feedback
CREATE POLICY "Users can delete their own feedback" 
ON public.user_feedback 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_status ON public.user_feedback(status);

-- END MIGRATION: 20260131034148_842493ef-b4cc-4476-8fc1-d13a73e60fd6.sql

-- BEGIN MIGRATION: 20260131034253_ca5a51cc-3831-4cc5-9421-37929945e21f.sql

-- Create forum_categories table
CREATE TABLE public.forum_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  thread_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum_threads table
CREATE TABLE public.forum_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  last_reply_user_id UUID,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum_user_reputation table
CREATE TABLE public.forum_user_reputation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  reputation_points INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  threads_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  rank_title TEXT DEFAULT 'Newcomer',
  badges TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_user_reputation ENABLE ROW LEVEL SECURITY;

-- forum_categories: Public read access
CREATE POLICY "Anyone can view forum categories" 
ON public.forum_categories FOR SELECT USING (true);

-- forum_threads: Public read, authenticated create/update own
CREATE POLICY "Anyone can view forum threads" 
ON public.forum_threads FOR SELECT USING (true);

CREATE POLICY "Users can create forum threads" 
ON public.forum_threads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads" 
ON public.forum_threads FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads" 
ON public.forum_threads FOR DELETE 
USING (auth.uid() = user_id);

-- forum_user_reputation: Users can view all, update own
CREATE POLICY "Anyone can view user reputation" 
ON public.forum_user_reputation FOR SELECT USING (true);

CREATE POLICY "Users can update their own reputation" 
ON public.forum_user_reputation FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reputation" 
ON public.forum_user_reputation FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_forum_threads_category ON public.forum_threads(category_id);
CREATE INDEX idx_forum_threads_user ON public.forum_threads(user_id);
CREATE INDEX idx_forum_user_reputation_user ON public.forum_user_reputation(user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_forum_categories_updated_at
BEFORE UPDATE ON public.forum_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_threads_updated_at
BEFORE UPDATE ON public.forum_threads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_user_reputation_updated_at
BEFORE UPDATE ON public.forum_user_reputation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- END MIGRATION: 20260131034253_ca5a51cc-3831-4cc5-9421-37929945e21f.sql

    v_streak user_streaks%ROWTYPE;
    v_today DATE := CURRENT_DATE;
    v_new_streak INTEGER;
BEGIN
    SELECT * INTO v_streak FROM user_streaks WHERE user_id = p_user_id AND streak_type = p_streak_type;
    
    IF NOT FOUND THEN
        INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_start_date)
        VALUES (p_user_id, p_streak_type, 1, 1, v_today, v_today)
        RETURNING current_streak INTO v_new_streak;
    ELSE
        IF v_streak.last_activity_date = v_today THEN
            RETURN v_streak.current_streak;
        ELSIF v_streak.last_activity_date = v_today - INTERVAL '1 day' THEN
            v_new_streak := v_streak.current_streak + 1;
            UPDATE user_streaks SET current_streak = v_new_streak, longest_streak = GREATEST(longest_streak, v_new_streak), last_activity_date = v_today, updated_at = now()
            WHERE id = v_streak.id;
        ELSE
            v_new_streak := 1;
            UPDATE user_streaks SET current_streak = 1, last_activity_date = v_today, streak_start_date = v_today, updated_at = now()
            WHERE id = v_streak.id;
        END IF;
    END IF;
    
    RETURN v_new_streak;
END;
$$;

-- Leaderboard function
CREATE OR REPLACE FUNCTION public.get_public_leaderboards(p_leaderboard_type TEXT DEFAULT NULL, p_period TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 100)
RETURNS TABLE(id UUID, leaderboard_type TEXT, period TEXT, score INTEGER, rank INTEGER, display_name TEXT, is_anonymous BOOLEAN, created_at TIMESTAMP WITH TIME ZONE, updated_at TIMESTAMP WITH TIME ZONE)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT l.id, l.leaderboard_type, l.period, l.score, l.rank, l.display_name, l.is_anonymous, l.created_at, l.updated_at
    FROM public.leaderboards l
    WHERE (p_leaderboard_type IS NULL OR l.leaderboard_type = p_leaderboard_type)
      AND (p_period IS NULL OR l.period = p_period)
    ORDER BY l.rank ASC NULLS LAST, l.score DESC
    LIMIT LEAST(p_limit, 100);
$$;

-- =============================================
-- SECTION 15: Triggers
-- =============================================

-- Profile trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SECTION 16: Enable RLS on All Tables
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_scan_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_detection_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_license_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_installed_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_download_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_promo_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_gift_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_age_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dlc_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_dlc_package_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_group_workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.multi_camera_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_streams ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECTION 17: Core RLS Policies
-- =============================================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- User Preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Scans
CREATE POLICY "Users can view own scans" ON public.scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON public.scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scans" ON public.scans FOR DELETE USING (auth.uid() = user_id);

-- Scan History
CREATE POLICY "Users can view own scan history" ON public.scan_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scan history" ON public.scan_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scan history" ON public.scan_history FOR DELETE USING (auth.uid() = user_id);

-- Health Diary
CREATE POLICY "Users can view own diary" ON public.health_diary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert diary entries" ON public.health_diary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diary entries" ON public.health_diary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own diary entries" ON public.health_diary FOR DELETE USING (auth.uid() = user_id);

-- AI Scan Analysis
CREATE POLICY "Users can view own AI analysis" ON public.ai_scan_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert AI analysis" ON public.ai_scan_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anomaly Detection Log
CREATE POLICY "Users can view own anomalies" ON public.anomaly_detection_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert anomalies" ON public.anomaly_detection_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Payment History
CREATE POLICY "Users can view own payment history" ON public.payment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage payment history" ON public.payment_history FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- DLC Packages (public read)
CREATE POLICY "Anyone can view active DLC packages" ON public.dlc_packages FOR SELECT USING (is_active = true);

-- DLC Packs (public read)
CREATE POLICY "Anyone can view active DLC packs" ON public.dlc_packs FOR SELECT USING (is_active = true);

-- DLC Bundles (public read)
CREATE POLICY "Anyone can view active DLC bundles" ON public.dlc_bundles FOR SELECT USING (is_active = true);

-- DLC Content Items (public read for active)
CREATE POLICY "Anyone can view active content items" ON public.dlc_content_items FOR SELECT USING (is_active = true);

-- DLC Licenses
CREATE POLICY "Users can view their own licenses" ON public.dlc_licenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own licenses" ON public.dlc_licenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own licenses" ON public.dlc_licenses FOR UPDATE USING (auth.uid() = user_id);

-- DLC License Devices
CREATE POLICY "Users can manage their license devices" ON public.dlc_license_devices FOR ALL USING (auth.uid() = user_id);

-- DLC Purchases
CREATE POLICY "Users can view their own purchases" ON public.dlc_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own purchases" ON public.dlc_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DLC Installations
CREATE POLICY "Users can manage their own installations" ON public.dlc_installations FOR ALL USING (auth.uid() = user_id);

-- DLC Installed Content
CREATE POLICY "Users can manage their installed content" ON public.dlc_installed_content FOR ALL USING (auth.uid() = user_id);

-- DLC Download Queue
CREATE POLICY "Users can manage their download queue" ON public.dlc_download_queue FOR ALL USING (auth.uid() = user_id);

-- DLC Promo Codes (public read for active)
CREATE POLICY "Anyone can view active promo codes" ON public.dlc_promo_codes FOR SELECT USING (is_active = true);

-- DLC Promo Code Usage
CREATE POLICY "Users can view their promo usage" ON public.dlc_promo_code_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their promo usage" ON public.dlc_promo_code_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DLC Age Verifications
CREATE POLICY "Users can manage their age verification" ON public.dlc_age_verifications FOR ALL USING (auth.uid() = user_id);

-- DLC Ratings
CREATE POLICY "Anyone can view approved ratings" ON public.dlc_ratings FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can insert their own ratings" ON public.dlc_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ratings" ON public.dlc_ratings FOR UPDATE USING (auth.uid() = user_id);

-- DLC Updates (public read)
CREATE POLICY "Anyone can view available updates" ON public.dlc_updates FOR SELECT USING (is_available = true);

-- DLC Wishlist
CREATE POLICY "Users can manage their wishlist" ON public.dlc_wishlist FOR ALL USING (auth.uid() = user_id);

-- Device Tokens
CREATE POLICY "Users can manage their device tokens" ON public.device_tokens FOR ALL USING (auth.uid() = user_id);

-- Achievement Definitions (public read)
CREATE POLICY "Anyone can view active achievements" ON public.achievement_definitions FOR SELECT USING (is_active = true);

-- User Achievements
CREATE POLICY "Users can view their achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their achievements" ON public.user_achievements FOR UPDATE USING (auth.uid() = user_id);

-- User Streaks
CREATE POLICY "Users can manage their streaks" ON public.user_streaks FOR ALL USING (auth.uid() = user_id);

-- User Milestones
CREATE POLICY "Users can view their milestones" ON public.user_milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their milestones" ON public.user_milestones FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leaderboards (public read)
CREATE POLICY "Anyone can view leaderboards" ON public.leaderboards FOR SELECT USING (true);
CREATE POLICY "Users can manage their leaderboard entry" ON public.leaderboards FOR ALL USING (auth.uid() = user_id);

-- Expert Profiles (public read for available)
CREATE POLICY "Anyone can view available experts" ON public.expert_profiles FOR SELECT USING (is_available = true);
CREATE POLICY "Users can manage their expert profile" ON public.expert_profiles FOR ALL USING (auth.uid() = user_id);

-- Expert Articles (public read for published)
CREATE POLICY "Anyone can view published articles" ON public.expert_articles FOR SELECT USING (published_at IS NOT NULL);

-- Expert Videos (public read for published)
CREATE POLICY "Anyone can view published videos" ON public.expert_videos FOR SELECT USING (published_at IS NOT NULL);

-- Expert Consultations
CREATE POLICY "Users can view their consultations" ON public.expert_consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Experts can view their consultations" ON public.expert_consultations FOR SELECT USING (
  expert_id IN (SELECT id FROM public.expert_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create consultations" ON public.expert_consultations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Expert Group Workshops (public read for upcoming)
CREATE POLICY "Anyone can view upcoming workshops" ON public.expert_group_workshops FOR SELECT USING (status = 'upcoming');

-- Expert Questions
CREATE POLICY "Users can view their questions" ON public.expert_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create questions" ON public.expert_questions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Forum Categories (public read for active)
CREATE POLICY "Anyone can view active categories" ON public.forum_categories FOR SELECT USING (is_active = true);

-- Forum Threads
CREATE POLICY "Anyone can view threads" ON public.forum_threads FOR SELECT USING (true);
CREATE POLICY "Users can create threads" ON public.forum_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their threads" ON public.forum_threads FOR UPDATE USING (auth.uid() = user_id);

-- App Analytics Events
CREATE POLICY "Users can insert their events" ON public.app_analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins can view all events" ON public.app_analytics_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Beta Testers
CREATE POLICY "Users can view their beta status" ON public.beta_testers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage beta testers" ON public.beta_testers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Multi Camera Sessions
CREATE POLICY "Users can manage their camera sessions" ON public.multi_camera_sessions FOR ALL USING (auth.uid() = user_id);

-- Camera Streams
CREATE POLICY "Users can manage their camera streams" ON public.camera_streams FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- SECTION 18: Storage Buckets
-- =============================================
-- Run these in the Supabase Dashboard SQL Editor:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('scans', 'scans', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-uploads', 'user-uploads', false);

-- Storage policies for scans bucket
-- CREATE POLICY "Users can upload their scans" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can view their scans" ON storage.objects FOR SELECT USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete their scans" ON storage.objects FOR DELETE USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars bucket (public)
-- CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload their avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can update their avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- END OF SCHEMA EXPORT
-- =============================================

-- NOTES:
-- 1. This export includes the core schema. Some tables have additional columns
--    added by later migrations - refer to the full migration files if needed.
-- 2. Storage bucket creation and policies need to be run separately in the
--    Supabase Dashboard SQL Editor as they require storage schema access.
-- 3. After running this schema, you'll need to:
--    a. Set up your edge functions
--    b. Configure secrets (STRIPE_SECRET_KEY, DLC_KEYRING_MASTER_KEY_B64, etc.)
--    c. Enable email auth and configure auth settings
-- 4. Some policies reference the has_role() function - ensure it's created first.
