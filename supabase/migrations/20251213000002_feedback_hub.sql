-- Feedback Hub: user-submitted bugs, wishlist items, feature/expansion requests
-- Idempotent and safe to re-run.

CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  kind TEXT NOT NULL CHECK (kind IN ('bug','glitch','error','feature_request','expansion_request','wishlist','general','praise')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  rating SMALLINT CHECK (rating >= 0 AND rating <= 10),
  sentiment TEXT CHECK (sentiment IN ('love','like','neutral','dislike','hate')),
  severity TEXT CHECK (severity IN ('low','medium','high','critical')),
  frequency TEXT CHECK (frequency IN ('once','sometimes','often','always')),

  steps_to_reproduce TEXT,
  expected TEXT,
  actual TEXT,
  tags TEXT[],

  allow_contact BOOLEAN NOT NULL DEFAULT FALSE,
  contact_email TEXT,

  attachments JSONB,
  environment JSONB,
  audit_snapshot JSONB,
  source TEXT NOT NULL DEFAULT 'settings_feedback_hub',

  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','triaged','in_progress','resolved','won''t_fix','duplicate')),
  admin_response TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_feedback_user_id_idx ON public.user_feedback (user_id);
CREATE INDEX IF NOT EXISTS user_feedback_status_idx ON public.user_feedback (status);
CREATE INDEX IF NOT EXISTS user_feedback_created_at_idx ON public.user_feedback (created_at DESC);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can read their own feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_feedback' AND policyname = 'Users can view own feedback'
  ) THEN
    CREATE POLICY "Users can view own feedback" ON public.user_feedback
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Users can create feedback for themselves
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_feedback' AND policyname = 'Users can create own feedback'
  ) THEN
    CREATE POLICY "Users can create own feedback" ON public.user_feedback
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Users can update their own feedback (limited to their rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_feedback' AND policyname = 'Users can update own feedback'
  ) THEN
    CREATE POLICY "Users can update own feedback" ON public.user_feedback
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Service role can manage all feedback
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_feedback' AND policyname = 'Service role can manage feedback'
  ) THEN
    CREATE POLICY "Service role can manage feedback" ON public.user_feedback
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_feedback_updated_at ON public.user_feedback;
CREATE TRIGGER update_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_user_feedback_updated_at();

