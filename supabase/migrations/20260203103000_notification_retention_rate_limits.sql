-- Notification & data retention preferences + edge rate limits

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS data_retention_preferences JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  max_requests INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (identifier, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_edge_rate_limits_identifier ON public.edge_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_edge_rate_limits_endpoint ON public.edge_rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_edge_rate_limits_window_end ON public.edge_rate_limits(window_end);

ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage edge rate limits"
  ON public.edge_rate_limits FOR ALL
  USING (true);
