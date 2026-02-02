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
DROP TRIGGER IF EXISTS update_dlc_licenses_updated_at ON dlc_licenses;
CREATE TRIGGER update_dlc_licenses_updated_at
  BEFORE UPDATE ON dlc_licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pricing_tiers_updated_at ON pricing_tiers;
CREATE TRIGGER update_pricing_tiers_updated_at
  BEFORE UPDATE ON pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dlc_content_packages_updated_at ON dlc_content_packages;
CREATE TRIGGER update_dlc_content_packages_updated_at
  BEFORE UPDATE ON dlc_content_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

