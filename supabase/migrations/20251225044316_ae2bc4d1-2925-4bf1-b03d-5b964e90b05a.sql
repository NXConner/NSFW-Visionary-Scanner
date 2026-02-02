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

-- Insert the subscription tiers (idempotent)
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
)
ON CONFLICT (tier_id) DO UPDATE SET
    tier_name = EXCLUDED.tier_name,
    tier_description = EXCLUDED.tier_description,
    monthly_price = EXCLUDED.monthly_price,
    annual_price = EXCLUDED.annual_price,
    lifetime_price = EXCLUDED.lifetime_price,
    features = EXCLUDED.features,
    limitations = EXCLUDED.limitations,
    is_active = EXCLUDED.is_active,
    is_featured = EXCLUDED.is_featured,
    is_popular = EXCLUDED.is_popular,
    sort_order = EXCLUDED.sort_order,
    color_scheme = EXCLUDED.color_scheme,
    updated_at = now();

-- Insert comparison features (idempotent)
WITH features AS (
    SELECT * FROM (VALUES
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
        ('Concierge Support', 'Dedicated support team', 'Support', ARRAY['infinity'], false, true, 20)
    ) AS t(feature_name, feature_description, feature_category, available_tiers, is_core, is_premium, sort_order)
),
updated AS (
    UPDATE public.tier_comparison_features f
    SET
        feature_description = v.feature_description,
        feature_category = v.feature_category,
        available_tiers = v.available_tiers,
        is_core = v.is_core,
        is_premium = v.is_premium,
        sort_order = v.sort_order,
        updated_at = now()
    FROM features v
    WHERE f.feature_name = v.feature_name
    RETURNING f.feature_name
)
INSERT INTO public.tier_comparison_features (feature_name, feature_description, feature_category, available_tiers, is_core, is_premium, sort_order)
SELECT
    v.feature_name,
    v.feature_description,
    v.feature_category,
    v.available_tiers,
    v.is_core,
    v.is_premium,
    v.sort_order
FROM features v
WHERE NOT EXISTS (
    SELECT 1 FROM public.tier_comparison_features f WHERE f.feature_name = v.feature_name
);

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
