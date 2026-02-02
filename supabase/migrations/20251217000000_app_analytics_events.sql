-- =============================================
-- App Analytics Events (Privacy-consented product analytics)
-- Migration: 20251217000000_app_analytics_events.sql
-- Description: First-party event collection for growth funnel analysis
-- Notes:
-- - Idempotent (safe re-run)
-- - RLS: authenticated inserts only (limits abuse); users can read own events
-- =============================================

CREATE TABLE IF NOT EXISTS app_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,

  -- Event
  event_name TEXT NOT NULL,
  event_category TEXT,
  event_action TEXT,
  event_label TEXT,
  event_value NUMERIC,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Client context (best-effort)
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_platform TEXT,
  app_version TEXT,
  app_build TEXT,
  distribution_channel TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_analytics_events_user_id ON app_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_app_analytics_events_event_name ON app_analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_app_analytics_events_created_at ON app_analytics_events(created_at);

ALTER TABLE app_analytics_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert events for themselves.
DROP POLICY IF EXISTS "Users can insert own app analytics events" ON app_analytics_events;
CREATE POLICY "Users can insert own app analytics events"
  ON app_analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can read their own events.
DROP POLICY IF EXISTS "Users can view own app analytics events" ON app_analytics_events;
CREATE POLICY "Users can view own app analytics events"
  ON app_analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all analytics events.
DROP POLICY IF EXISTS "Service role can manage app analytics events" ON app_analytics_events;
CREATE POLICY "Service role can manage app analytics events"
  ON app_analytics_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

