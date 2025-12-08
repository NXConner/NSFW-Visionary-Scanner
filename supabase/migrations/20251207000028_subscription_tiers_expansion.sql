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

