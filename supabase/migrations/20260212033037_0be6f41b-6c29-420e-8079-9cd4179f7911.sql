
-- ============================================================================
-- BATCH 3: Health Education, Progress Sharing, Routines, Premium, Marketplace, Dates, DLC misc
-- ============================================================================

-- Schema-tolerant guard:
-- Some tables in this batch may already exist with partial/older schemas.
-- Add columns referenced by RLS policies below so policy creation doesn't fail.
DO $$
DECLARE
  t text;
BEGIN
  -- Tables whose policies in this migration reference `user_id`
  FOREACH t IN ARRAY ARRAY[
    'user_assessment_results',
    'screening_reminders',
    'learning_course_reviews',
    'progress_shares',
    'progress_share_interactions',
    'challenge_participants',
    'challenge_checkins',
    'leaderboard_entries',
    'adaptive_routines',
    'routine_analytics',
    'shared_routines',
    'rest_day_recommendations',
    'premium_content_purchases',
    'premium_content_reviews',
    'premium_content_wishlist',
    'marketplace_purchases',
    'intimate_date_reminders',
    'intimate_date_reflections',
    'dlc_wishlist_packages',
    'dlc_promo_redemptions',
    'prostate_health',
    'testicular_health',
    'sexual_health_metrics',
    'hormone_levels',
    'urinary_health',
    'health_alerts',
    'health_risk_factors'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS user_id uuid', t);
    END IF;
  END LOOP;

  -- Columns referenced by SELECT policies
  IF to_regclass('public.learning_course_reviews') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.learning_course_reviews ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false';
  END IF;
  IF to_regclass('public.progress_shares') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.progress_shares ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false';
  END IF;
  IF to_regclass('public.shared_routines') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.shared_routines ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true';
  END IF;

  -- Additional policy columns
  IF to_regclass('public.challenges') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS created_by uuid';
  END IF;
  IF to_regclass('public.routine_marketplace') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.routine_marketplace ADD COLUMN IF NOT EXISTS creator_id uuid';
  END IF;
END $$;

-- Health Education
CREATE TABLE IF NOT EXISTS public.health_education_content (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, content text, category text, content_type text DEFAULT 'article', difficulty_level text, tags text[], is_published boolean DEFAULT true, view_count int DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.health_education_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_health_edu" ON public.health_education_content FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.health_assessments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assessment_name text NOT NULL, description text, questions jsonb, category text, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now());
ALTER TABLE public.health_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_assessments" ON public.health_assessments FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.user_assessment_results (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, assessment_id uuid, answers jsonb, score numeric, risk_level text, created_at timestamptz DEFAULT now());
ALTER TABLE public.user_assessment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uar_own" ON public.user_assessment_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.self_examination_guides (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, body_area text, steps jsonb, frequency text, importance_level text, created_at timestamptz DEFAULT now());
ALTER TABLE public.self_examination_guides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_guides" ON public.self_examination_guides FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.screening_reminders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, screening_type text NOT NULL, reminder_date date, is_completed boolean DEFAULT false, completed_at timestamptz, notes text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.screening_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "screen_own" ON public.screening_reminders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Learning Course Reviews
CREATE TABLE IF NOT EXISTS public.learning_course_reviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid, user_id uuid NOT NULL, rating int NOT NULL, review_text text, is_approved boolean DEFAULT false, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.learning_course_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lcr_own" ON public.learning_course_reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lcr_read" ON public.learning_course_reviews FOR SELECT USING (is_approved = true);

-- Progress Sharing & Challenges
CREATE TABLE IF NOT EXISTS public.progress_shares (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, share_type text, content jsonb, is_public boolean DEFAULT false, view_count int DEFAULT 0, created_at timestamptz DEFAULT now());
ALTER TABLE public.progress_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ps_own" ON public.progress_shares FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ps_public_read" ON public.progress_shares FOR SELECT USING (is_public = true);

CREATE TABLE IF NOT EXISTS public.progress_share_interactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), share_id uuid, user_id uuid NOT NULL, interaction_type text NOT NULL, created_at timestamptz DEFAULT now());
ALTER TABLE public.progress_share_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psi_own" ON public.progress_share_interactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.challenges (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, challenge_type text, start_date timestamptz, end_date timestamptz, is_active boolean DEFAULT true, participant_count int DEFAULT 0, created_by uuid, created_at timestamptz DEFAULT now());
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_challenges" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "create_challenges" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE TABLE IF NOT EXISTS public.challenge_participants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE, user_id uuid NOT NULL, progress numeric DEFAULT 0, joined_at timestamptz DEFAULT now());
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp_own" ON public.challenge_participants FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.challenge_checkins (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), challenge_id uuid, participant_id uuid, user_id uuid NOT NULL, checkin_data jsonb, created_at timestamptz DEFAULT now());
ALTER TABLE public.challenge_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_own" ON public.challenge_checkins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), leaderboard_id uuid, user_id uuid NOT NULL, score int DEFAULT 0, rank int, display_name text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "le_own" ON public.leaderboard_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "le_read" ON public.leaderboard_entries FOR SELECT USING (true);

-- Adaptive Routines
CREATE TABLE IF NOT EXISTS public.adaptive_routines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, routine_name text NOT NULL, routine_data jsonb, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.adaptive_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ar_own" ON public.adaptive_routines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.routine_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), template_name text NOT NULL, description text, routine_data jsonb, category text, difficulty_level text, is_public boolean DEFAULT true, created_at timestamptz DEFAULT now());
ALTER TABLE public.routine_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_rt" ON public.routine_templates FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.routine_analytics (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, routine_id uuid, analytics_data jsonb, period_start date, period_end date, created_at timestamptz DEFAULT now());
ALTER TABLE public.routine_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ra_own" ON public.routine_analytics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.shared_routines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, routine_id uuid, share_code text UNIQUE, is_public boolean DEFAULT true, download_count int DEFAULT 0, created_at timestamptz DEFAULT now());
ALTER TABLE public.shared_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr_own" ON public.shared_routines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sr_pub_read" ON public.shared_routines FOR SELECT USING (is_public = true);

CREATE TABLE IF NOT EXISTS public.routine_marketplace (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), routine_id uuid, creator_id uuid NOT NULL, title text NOT NULL, description text, price numeric DEFAULT 0, category text, rating_average numeric DEFAULT 0, download_count int DEFAULT 0, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.routine_marketplace ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_rm" ON public.routine_marketplace FOR SELECT USING (true);
CREATE POLICY "rm_creator" ON public.routine_marketplace FOR ALL USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

CREATE TABLE IF NOT EXISTS public.rest_day_recommendations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, recommendation_data jsonb, recommended_date date, is_accepted boolean, created_at timestamptz DEFAULT now());
ALTER TABLE public.rest_day_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rdr_own" ON public.rest_day_recommendations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.multi_week_programs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), program_name text NOT NULL, description text, duration_weeks int, program_data jsonb, difficulty_level text, is_public boolean DEFAULT true, created_at timestamptz DEFAULT now());
ALTER TABLE public.multi_week_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_mwp" ON public.multi_week_programs FOR SELECT USING (true);

-- Premium Content
CREATE TABLE IF NOT EXISTS public.premium_content_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, content_type text, price numeric DEFAULT 0, category text, preview_url text, content_url text, is_active boolean DEFAULT true, view_count int DEFAULT 0, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.premium_content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_pci" ON public.premium_content_items FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.premium_content_purchases (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, content_id uuid, price_paid numeric, payment_status text DEFAULT 'completed', purchased_at timestamptz DEFAULT now());
ALTER TABLE public.premium_content_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pcp_own" ON public.premium_content_purchases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.premium_content_reviews (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, content_id uuid, rating int NOT NULL, review_text text, created_at timestamptz DEFAULT now());
ALTER TABLE public.premium_content_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pcr_own" ON public.premium_content_reviews FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.premium_content_wishlist (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, content_id uuid, added_at timestamptz DEFAULT now());
ALTER TABLE public.premium_content_wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pcw_own" ON public.premium_content_wishlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Marketplace Purchases
CREATE TABLE IF NOT EXISTS public.marketplace_purchases (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, item_id uuid, price_paid numeric, payment_status text DEFAULT 'completed', purchased_at timestamptz DEFAULT now());
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_own" ON public.marketplace_purchases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Intimate Date Plan Items
CREATE TABLE IF NOT EXISTS public.intimate_date_itinerary_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), proposal_id uuid, title text NOT NULL, description text, start_time timestamptz, end_time timestamptz, order_index int DEFAULT 0, created_at timestamptz DEFAULT now());
ALTER TABLE public.intimate_date_itinerary_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idi_read" ON public.intimate_date_itinerary_items FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.intimate_date_checklist_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), proposal_id uuid, item_text text NOT NULL, is_completed boolean DEFAULT false, order_index int DEFAULT 0, created_at timestamptz DEFAULT now());
ALTER TABLE public.intimate_date_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idcl_read" ON public.intimate_date_checklist_items FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.intimate_date_packing_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), proposal_id uuid, item_name text NOT NULL, is_packed boolean DEFAULT false, category text, created_at timestamptz DEFAULT now());
ALTER TABLE public.intimate_date_packing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idp_read" ON public.intimate_date_packing_items FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.intimate_date_distractions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), proposal_id uuid, distraction_type text, description text, is_addressed boolean DEFAULT false, created_at timestamptz DEFAULT now());
ALTER TABLE public.intimate_date_distractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idd_read" ON public.intimate_date_distractions FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.intimate_date_positions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), proposal_id uuid, position_id uuid, order_index int DEFAULT 0, notes text, created_at timestamptz DEFAULT now());
ALTER TABLE public.intimate_date_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idpos_read" ON public.intimate_date_positions FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.intimate_date_reminders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), proposal_id uuid, user_id uuid NOT NULL, reminder_time timestamptz, message text, is_sent boolean DEFAULT false, created_at timestamptz DEFAULT now());
ALTER TABLE public.intimate_date_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idr_own" ON public.intimate_date_reminders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_aftercare_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), proposal_id uuid, item_text text NOT NULL, category text, order_index int DEFAULT 0, created_at timestamptz DEFAULT now());
ALTER TABLE public.intimate_date_aftercare_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idac_read" ON public.intimate_date_aftercare_items FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.intimate_date_reflections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), proposal_id uuid, user_id uuid NOT NULL, rating int, reflection_text text, highlights text[], improvements text[], created_at timestamptz DEFAULT now());
ALTER TABLE public.intimate_date_reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "idref_own" ON public.intimate_date_reflections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DLC Wishlist Packages & Promo Redemptions
CREATE TABLE IF NOT EXISTS public.dlc_wishlist_packages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, package_id uuid, added_at timestamptz DEFAULT now(), notes text);
ALTER TABLE public.dlc_wishlist_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dwp_own" ON public.dlc_wishlist_packages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.dlc_promo_redemptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, promo_code_id uuid, discount_applied numeric, redeemed_at timestamptz DEFAULT now());
ALTER TABLE public.dlc_promo_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dpr_own" ON public.dlc_promo_redemptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Health Monitoring missing tables
CREATE TABLE IF NOT EXISTS public.prostate_health (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, assessment_date date DEFAULT CURRENT_DATE, psa_level numeric, symptoms jsonb, notes text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.prostate_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ph_own" ON public.prostate_health FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.testicular_health (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, exam_date date DEFAULT CURRENT_DATE, findings jsonb, notes text, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
ALTER TABLE public.testicular_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "th_own" ON public.testicular_health FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.sexual_health_metrics (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, metric_date date DEFAULT CURRENT_DATE, metric_type text, metric_value numeric, notes text, created_at timestamptz DEFAULT now());
ALTER TABLE public.sexual_health_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shm_own" ON public.sexual_health_metrics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.hormone_levels (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, test_date date DEFAULT CURRENT_DATE, hormone_type text NOT NULL, level numeric, unit text, reference_range text, created_at timestamptz DEFAULT now());
ALTER TABLE public.hormone_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hl_own" ON public.hormone_levels FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.urinary_health (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, assessment_date date DEFAULT CURRENT_DATE, ipss_score int, symptoms jsonb, notes text, created_at timestamptz DEFAULT now());
ALTER TABLE public.urinary_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uh_own" ON public.urinary_health FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.health_alerts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, alert_type text NOT NULL, severity text DEFAULT 'info', message text NOT NULL, is_read boolean DEFAULT false, created_at timestamptz DEFAULT now());
ALTER TABLE public.health_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ha_own" ON public.health_alerts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.health_risk_factors (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, risk_factor text NOT NULL, severity text, details jsonb, identified_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now());
ALTER TABLE public.health_risk_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hrf_own" ON public.health_risk_factors FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
