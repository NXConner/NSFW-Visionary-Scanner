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

