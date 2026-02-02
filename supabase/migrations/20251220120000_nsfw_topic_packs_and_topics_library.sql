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
SELECT *
FROM (VALUES
  ('power_dynamics', 'Power Dynamics', 'Consent-focused power dynamics, communication, and safety-first guidance.', 'topic_power_dynamics', 10, true, '18+'),
  ('tantric', 'Tantric & Mindful Intimacy', 'Mindfulness, breathwork, connection, and slow intimacy practices.', 'topic_tantric', 20, true, '18+'),
  ('kama_sutra', 'Classic Texts & Positions', 'Classic position reference and historical context (adult).', 'topic_kama_sutra', 30, true, '18+'),
  ('roleplay', 'Roleplay & Fantasy', 'Communication, boundaries, and scenarios for consensual roleplay.', 'topic_roleplay', 40, true, '18+'),
  ('male_pleasure', 'Male Pleasure & Pelvic Health', 'Adult techniques with anatomy/safety framing; pelvic floor and prostate education.', 'topic_male_pleasure', 50, true, '18+')
) AS t(topic_id, display_name, description, requires_feature_id, sort_order, is_active, content_rating)
WHERE public.is_nsfw_enabled()
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
WHERE public.is_nsfw_enabled()
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

