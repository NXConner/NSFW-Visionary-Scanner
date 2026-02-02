-- ==================== DLC Content Items ====================
CREATE TABLE IF NOT EXISTS public.dlc_content_items (
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

DROP POLICY IF EXISTS "Anyone can view content items of active packs" ON public.dlc_content_items;
CREATE POLICY "Anyone can view content items of active packs"
  ON public.dlc_content_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.dlc_packs WHERE id = pack_id AND is_active = true
  ));

CREATE INDEX IF NOT EXISTS idx_dlc_content_items_pack_id ON public.dlc_content_items(pack_id);
CREATE INDEX IF NOT EXISTS idx_dlc_content_items_content_type ON public.dlc_content_items(content_type);

-- ==================== DLC Promo Codes ====================
CREATE TABLE IF NOT EXISTS public.dlc_promo_codes (
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

-- Ensure dlc_promo_codes has expiry fields when table pre-exists
ALTER TABLE public.dlc_promo_codes
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.dlc_promo_codes
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.dlc_promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active promo codes" ON public.dlc_promo_codes;
CREATE POLICY "Anyone can view active promo codes"
  ON public.dlc_promo_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE UNIQUE INDEX IF NOT EXISTS idx_dlc_promo_codes_code ON public.dlc_promo_codes(code);

-- ==================== DLC Promo Code Usage ====================
CREATE TABLE IF NOT EXISTS public.dlc_promo_code_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.dlc_promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  purchase_id UUID REFERENCES public.dlc_purchases(id),
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.dlc_promo_code_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own promo code usage" ON public.dlc_promo_code_usage;
DROP POLICY IF EXISTS "Users can use promo codes" ON public.dlc_promo_code_usage;
CREATE POLICY "Users can view own promo code usage"
  ON public.dlc_promo_code_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can use promo codes"
  ON public.dlc_promo_code_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dlc_promo_code_usage_user ON public.dlc_promo_code_usage(user_id);

-- ==================== DLC Gift Codes ====================
CREATE TABLE IF NOT EXISTS public.dlc_gift_codes (
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

-- Ensure dlc_gift_codes has sender/redeemer columns when table pre-exists
ALTER TABLE public.dlc_gift_codes
  ADD COLUMN IF NOT EXISTS sender_id UUID;

ALTER TABLE public.dlc_gift_codes
  ADD COLUMN IF NOT EXISTS redeemed_by UUID;

ALTER TABLE public.dlc_gift_codes
  ADD COLUMN IF NOT EXISTS is_redeemed BOOLEAN DEFAULT false;

ALTER TABLE public.dlc_gift_codes
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.dlc_gift_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sent gifts" ON public.dlc_gift_codes;
DROP POLICY IF EXISTS "Users can create gift codes" ON public.dlc_gift_codes;
DROP POLICY IF EXISTS "Users can redeem gift codes" ON public.dlc_gift_codes;
CREATE POLICY "Users can view own sent gifts"
  ON public.dlc_gift_codes FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = redeemed_by);

CREATE POLICY "Users can create gift codes"
  ON public.dlc_gift_codes FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can redeem gift codes"
  ON public.dlc_gift_codes FOR UPDATE
  USING (is_redeemed = false AND (expires_at IS NULL OR expires_at > now()));

CREATE UNIQUE INDEX IF NOT EXISTS idx_dlc_gift_codes_code ON public.dlc_gift_codes(code);

-- ==================== DLC Wishlist ====================
CREATE TABLE IF NOT EXISTS public.dlc_wishlist (
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

DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.dlc_wishlist;
CREATE POLICY "Users can manage own wishlist"
  ON public.dlc_wishlist FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dlc_wishlist_user ON public.dlc_wishlist(user_id);
CREATE UNIQUE INDEX idx_dlc_wishlist_user_pack ON public.dlc_wishlist(user_id, pack_id) WHERE pack_id IS NOT NULL;
CREATE UNIQUE INDEX idx_dlc_wishlist_user_bundle ON public.dlc_wishlist(user_id, bundle_id) WHERE bundle_id IS NOT NULL;

-- ==================== DLC Ratings ====================
CREATE TABLE IF NOT EXISTS public.dlc_ratings (
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

DROP POLICY IF EXISTS "Anyone can view approved ratings" ON public.dlc_ratings;
DROP POLICY IF EXISTS "Users can create ratings" ON public.dlc_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON public.dlc_ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON public.dlc_ratings;
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
CREATE TABLE IF NOT EXISTS public.nsfw_positions_gallery (
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

DROP POLICY IF EXISTS "Anyone can view active positions" ON public.nsfw_positions_gallery;
CREATE POLICY "Anyone can view active positions"
  ON public.nsfw_positions_gallery FOR SELECT
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_nsfw_positions_category ON public.nsfw_positions_gallery(category);
CREATE INDEX IF NOT EXISTS idx_nsfw_positions_difficulty ON public.nsfw_positions_gallery(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_nsfw_positions_premium ON public.nsfw_positions_gallery(is_premium);

-- ==================== NSFW Positions Favorites ====================
CREATE TABLE IF NOT EXISTS public.nsfw_positions_favorites (
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

DROP POLICY IF EXISTS "Users can manage own position favorites" ON public.nsfw_positions_favorites;
CREATE POLICY "Users can manage own position favorites"
  ON public.nsfw_positions_favorites FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nsfw_positions_favorites_user ON public.nsfw_positions_favorites(user_id);

-- ==================== NSFW Position Ratings ====================
CREATE TABLE IF NOT EXISTS public.nsfw_position_ratings (
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

DROP POLICY IF EXISTS "Anyone can view position ratings" ON public.nsfw_position_ratings;
DROP POLICY IF EXISTS "Users can manage own position ratings" ON public.nsfw_position_ratings;
CREATE POLICY "Anyone can view position ratings"
  ON public.nsfw_position_ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own position ratings"
  ON public.nsfw_position_ratings FOR ALL
  USING (auth.uid() = user_id);

-- ==================== NSFW AI Chat Sessions ====================
CREATE TABLE IF NOT EXISTS public.nsfw_ai_chat_sessions (
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

DROP POLICY IF EXISTS "Users can manage own AI chat sessions" ON public.nsfw_ai_chat_sessions;
CREATE POLICY "Users can manage own AI chat sessions"
  ON public.nsfw_ai_chat_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nsfw_ai_chat_user ON public.nsfw_ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_nsfw_ai_chat_type ON public.nsfw_ai_chat_sessions(chat_type);

-- ==================== NSFW Expert Content ====================
CREATE TABLE IF NOT EXISTS public.nsfw_expert_content (
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

DROP POLICY IF EXISTS "Anyone can view published expert content" ON public.nsfw_expert_content;
DROP POLICY IF EXISTS "Experts can manage own content" ON public.nsfw_expert_content;
CREATE POLICY "Anyone can view published expert content"
  ON public.nsfw_expert_content FOR SELECT
  USING (is_approved = true AND is_active = true AND published_at IS NOT NULL);

CREATE POLICY "Experts can manage own content"
  ON public.nsfw_expert_content FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.expert_profiles WHERE id = expert_id AND user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_nsfw_expert_content_type ON public.nsfw_expert_content(content_type);
CREATE INDEX IF NOT EXISTS idx_nsfw_expert_content_category ON public.nsfw_expert_content(category);

-- ==================== DLC Installed Content Tracking ====================
CREATE TABLE IF NOT EXISTS public.dlc_installed_content (
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

DROP POLICY IF EXISTS "Users can manage own installed content" ON public.dlc_installed_content;
CREATE POLICY "Users can manage own installed content"
  ON public.dlc_installed_content FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_dlc_installed_user ON public.dlc_installed_content(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_installed_pack ON public.dlc_installed_content(pack_id);