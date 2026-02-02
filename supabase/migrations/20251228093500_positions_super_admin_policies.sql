-- Positions Gallery: admin/super_admin full access policies
-- Ensures super_admin (including email-bypass in public.has_role) can view/manage all rows,
-- including moderation fields (e.g., unapproved reviews).
--
-- Idempotent: DROP POLICY IF EXISTS + recreate, guarded for missing tables.

DO $$
BEGIN
  -- position_difficulty_ratings
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position difficulty ratings" ON public.position_difficulty_ratings;
    CREATE POLICY "Admins can manage all position difficulty ratings"
      ON public.position_difficulty_ratings
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_effectiveness_tracking
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position effectiveness tracking" ON public.position_effectiveness_tracking;
    CREATE POLICY "Admins can manage all position effectiveness tracking"
      ON public.position_effectiveness_tracking
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_reviews (moderation)
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position reviews" ON public.position_reviews;
    CREATE POLICY "Admins can manage all position reviews"
      ON public.position_reviews
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_playlists
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position playlists" ON public.position_playlists;
    CREATE POLICY "Admins can manage all position playlists"
      ON public.position_playlists
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_recommendations
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position recommendations" ON public.position_recommendations;
    CREATE POLICY "Admins can manage all position recommendations"
      ON public.position_recommendations
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_viewing_analytics
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position viewing analytics" ON public.position_viewing_analytics;
    CREATE POLICY "Admins can manage all position viewing analytics"
      ON public.position_viewing_analytics
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_comparisons
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position comparisons" ON public.position_comparisons;
    CREATE POLICY "Admins can manage all position comparisons"
      ON public.position_comparisons
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- position_variations
  BEGIN
    DROP POLICY IF EXISTS "Admins can manage all position variations" ON public.position_variations;
    CREATE POLICY "Admins can manage all position variations"
      ON public.position_variations
      FOR ALL
      USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
END $$;

