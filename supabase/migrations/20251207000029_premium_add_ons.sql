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

