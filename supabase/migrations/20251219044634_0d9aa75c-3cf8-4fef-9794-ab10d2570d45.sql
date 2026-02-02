-- Compatibility migration (idempotent):
-- - Some environments already applied 20251217000000_app_analytics_events.sql
-- - This migration must NOT fail if the table/policies already exist

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'app_analytics_events'
  ) THEN
    -- Create app_analytics_events table for analytics tracking
    CREATE TABLE public.app_analytics_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      session_id TEXT,
      event_name TEXT NOT NULL,
      event_category TEXT,
      event_action TEXT,
      event_label TEXT,
      event_value NUMERIC,
      properties JSONB NOT NULL DEFAULT '{}'::jsonb,
      page_path TEXT,
      referrer TEXT,
      user_agent TEXT,
      device_platform TEXT,
      app_version TEXT,
      app_build TEXT,
      distribution_channel TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END
$$;

-- Enable RLS (safe if already enabled)
ALTER TABLE public.app_analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies (drop+recreate to ensure a consistent, safe rule-set)
DROP POLICY IF EXISTS "Users can insert own analytics events" ON public.app_analytics_events;
CREATE POLICY "Users can insert own analytics events"
  ON public.app_analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own analytics events" ON public.app_analytics_events;
CREATE POLICY "Users can view own analytics events"
  ON public.app_analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add missing columns to dlc_packages
ALTER TABLE public.dlc_packages
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS included_packages TEXT[] DEFAULT '{}'::text[];

-- Add missing columns to dlc_age_verifications
ALTER TABLE public.dlc_age_verifications
ADD COLUMN IF NOT EXISTS adult_content_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;

-- Create index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_app_analytics_events_user_id ON public.app_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_app_analytics_events_created_at ON public.app_analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_app_analytics_events_event_name ON public.app_analytics_events(event_name);