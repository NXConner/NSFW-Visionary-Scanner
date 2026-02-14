-- Migration: Harden NSFW RLS entitlements
-- Purpose:
-- - Prevent DB-level paywall bypass (REST/GraphQL) for NSFW catalog tables.
-- - Enforce: authenticated + age verification/consent + DLC entitlements at the DB layer.
-- - Keep admin tooling functional under RLS (admins/service role can manage content).
--
-- Idempotent:
-- - Uses CREATE OR REPLACE FUNCTION
-- - Uses DROP POLICY IF EXISTS then CREATE POLICY
--
-- Notes:
-- - This intentionally does NOT rely on client-side feature gating.
-- - "Free preview" rows remain possible by setting requires_dlc=false AND is_premium=false.

-- Ensure age-verification consent flags exist across older environments.
ALTER TABLE public.dlc_age_verifications
  ADD COLUMN IF NOT EXISTS adult_content_consent BOOLEAN DEFAULT false;

ALTER TABLE public.dlc_age_verifications
  ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;

-- Helper: age verification + adult consent (self-declared is supported by app).
CREATE OR REPLACE FUNCTION public.is_nsfw_age_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    _user_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.dlc_age_verifications av
      WHERE av.user_id = _user_id
        AND av.is_verified = true
        AND COALESCE(av.adult_content_consent, false) = true
        AND COALESCE(av.terms_accepted, false) = true
        AND (av.expires_at IS NULL OR av.expires_at > now())
    );
$$;

-- Helper: active DLC entitlement for a given package_id.
-- - Direct license for package_id counts.
-- - License for a bundle counts if dlc_packages.included_packages contains the required package_id.
CREATE OR REPLACE FUNCTION public.user_has_active_dlc_entitlement(_user_id uuid, _required_package_id text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    _user_id IS NOT NULL
    AND _required_package_id IS NOT NULL
    AND _required_package_id <> ''
    AND EXISTS (
      SELECT 1
      FROM public.dlc_licenses l
      LEFT JOIN public.dlc_packages p ON p.package_id = l.package_id
      WHERE l.user_id = _user_id
        AND l.is_active = true
        AND l.refunded_at IS NULL
        AND (l.subscription_status IS NULL OR l.subscription_status = 'active')
        AND (l.subscription_end IS NULL OR l.subscription_end > now())
        AND (
          l.package_id = _required_package_id
          OR COALESCE(p.included_packages, '{}'::text[]) @> ARRAY[_required_package_id]::text[]
        )
    );
$$;

-- Helper: active feature entitlement for a given feature id.
-- Checks dlc_packages.features JSON and (for older bundles) included package features.
CREATE OR REPLACE FUNCTION public.user_has_active_feature(_user_id uuid, _required_feature_id text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    _user_id IS NOT NULL
    AND _required_feature_id IS NOT NULL
    AND _required_feature_id <> ''
    AND EXISTS (
      SELECT 1
      FROM public.dlc_licenses l
      JOIN public.dlc_packages p ON p.package_id = l.package_id
      WHERE l.user_id = _user_id
        AND l.is_active = true
        AND l.refunded_at IS NULL
        AND (l.subscription_status IS NULL OR l.subscription_status = 'active')
        AND (l.subscription_end IS NULL OR l.subscription_end > now())
        AND (
          EXISTS (
            SELECT 1
            FROM jsonb_array_elements(COALESCE(p.features, '[]'::jsonb)) f
            WHERE (f->>'id') = _required_feature_id
          )
          OR EXISTS (
            SELECT 1
            FROM public.dlc_packages p2
            WHERE p2.package_id = ANY(COALESCE(p.included_packages, '{}'::text[]))
              AND EXISTS (
                SELECT 1
                FROM jsonb_array_elements(COALESCE(p2.features, '[]'::jsonb)) f2
                WHERE (f2->>'id') = _required_feature_id
              )
          )
        )
    );
$$;

-- ------------------------------------------------------------
-- NSFW Positions Gallery
-- ------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.nsfw_positions_gallery') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.nsfw_positions_gallery ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Anyone can view active positions" ON public.nsfw_positions_gallery;
  DROP POLICY IF EXISTS "Verified users can view entitled positions" ON public.nsfw_positions_gallery;
  DROP POLICY IF EXISTS "Admins can manage nsfw positions gallery" ON public.nsfw_positions_gallery;

  CREATE POLICY "Admins can manage nsfw positions gallery"
    ON public.nsfw_positions_gallery
    FOR ALL
    USING (
      (auth.jwt() ->> 'role' = 'service_role')
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    )
    WITH CHECK (
      (auth.jwt() ->> 'role' = 'service_role')
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    );

  CREATE POLICY "Verified users can view entitled positions"
    ON public.nsfw_positions_gallery
    FOR SELECT
    USING (
      auth.role() = 'authenticated'
      AND is_active = true
      AND public.is_nsfw_age_verified(auth.uid())
      AND (
        (COALESCE(requires_dlc, true) = false AND COALESCE(is_premium, true) = false)
        OR public.user_has_active_dlc_entitlement(auth.uid(), 'dlc-positions')
      )
    );
END $$;

-- ------------------------------------------------------------
-- NSFW Video Content
-- ------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.nsfw_video_content') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.nsfw_video_content ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Authenticated users can view approved videos" ON public.nsfw_video_content;
  DROP POLICY IF EXISTS "Verified users can view entitled videos" ON public.nsfw_video_content;
  DROP POLICY IF EXISTS "Admins can manage nsfw video content" ON public.nsfw_video_content;

  CREATE POLICY "Admins can manage nsfw video content"
    ON public.nsfw_video_content
    FOR ALL
    USING (
      (auth.jwt() ->> 'role' = 'service_role')
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    )
    WITH CHECK (
      (auth.jwt() ->> 'role' = 'service_role')
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    );

  CREATE POLICY "Verified users can view entitled videos"
    ON public.nsfw_video_content
    FOR SELECT
    USING (
      auth.role() = 'authenticated'
      AND is_active = true
      AND is_approved = true
      AND public.is_nsfw_age_verified(auth.uid())
      AND (
        (COALESCE(requires_dlc, true) = false AND COALESCE(is_premium, true) = false)
        OR public.user_has_active_dlc_entitlement(auth.uid(), 'dlc-videos')
      )
    );
END $$;

-- ------------------------------------------------------------
-- NSFW Topics (index)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.nsfw_topics') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.nsfw_topics ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Anyone can view active nsfw_topics" ON public.nsfw_topics;
  DROP POLICY IF EXISTS "Verified users can view nsfw topics index" ON public.nsfw_topics;
  DROP POLICY IF EXISTS "Admins can manage nsfw topics" ON public.nsfw_topics;

  -- Keep existing "Service role can manage nsfw_topics" policy if present (do not drop).

  CREATE POLICY "Admins can manage nsfw topics"
    ON public.nsfw_topics
    FOR ALL
    USING (
      (auth.jwt() ->> 'role' = 'service_role')
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    )
    WITH CHECK (
      (auth.jwt() ->> 'role' = 'service_role')
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    );

  CREATE POLICY "Verified users can view nsfw topics index"
    ON public.nsfw_topics
    FOR SELECT
    USING (
      auth.role() = 'authenticated'
      AND is_active = true
      AND public.is_nsfw_age_verified(auth.uid())
      AND public.user_has_active_feature(auth.uid(), 'topics_library')
    );
END $$;

-- ------------------------------------------------------------
-- NSFW Topic Library Items
-- ------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.nsfw_topic_library_items') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.nsfw_topic_library_items ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Anyone can view active topic library items" ON public.nsfw_topic_library_items;
  DROP POLICY IF EXISTS "Verified users can view entitled topic library items" ON public.nsfw_topic_library_items;
  DROP POLICY IF EXISTS "Admins can manage nsfw topic library items" ON public.nsfw_topic_library_items;

  -- Keep existing "Service role can manage topic library items" policy if present (do not drop).

  CREATE POLICY "Admins can manage nsfw topic library items"
    ON public.nsfw_topic_library_items
    FOR ALL
    USING (
      (auth.jwt() ->> 'role' = 'service_role')
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    )
    WITH CHECK (
      (auth.jwt() ->> 'role' = 'service_role')
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    );

  CREATE POLICY "Verified users can view entitled topic library items"
    ON public.nsfw_topic_library_items
    FOR SELECT
    USING (
      auth.role() = 'authenticated'
      AND is_active = true
      AND public.is_nsfw_age_verified(auth.uid())
      AND public.user_has_active_feature(auth.uid(), 'topics_library')
      AND (
        COALESCE(requires_dlc, true) = false
        OR public.user_has_active_feature(auth.uid(), requires_feature_id)
      )
    );
END $$;

