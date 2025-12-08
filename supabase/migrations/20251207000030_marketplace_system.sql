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

