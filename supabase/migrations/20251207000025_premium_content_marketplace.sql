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

