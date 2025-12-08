-- Migration: API & Webhooks
-- Creates tables for public API, webhook system, API key management, rate limiting, and usage analytics

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Key details
  key_name TEXT NOT NULL,
  api_key_hash TEXT NOT NULL UNIQUE, -- Hashed API key
  api_key_prefix TEXT NOT NULL, -- First 8 chars for display
  
  -- Access tier
  access_tier TEXT DEFAULT 'basic' CHECK (access_tier IN ('basic', 'pro', 'enterprise')),
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- Permissions
  allowed_endpoints TEXT[], -- NULL for all endpoints
  allowed_methods TEXT[] DEFAULT ARRAY['GET'], -- GET, POST, PUT, DELETE
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  -- Usage
  total_requests INTEGER DEFAULT 0,
  last_request_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Usage Analytics
CREATE TABLE IF NOT EXISTS api_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Request details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  
  -- Request data
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  ip_address INET,
  user_agent TEXT,
  
  -- Errors
  error_type TEXT,
  error_message TEXT,
  
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Webhook details
  webhook_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT, -- For signature verification
  
  -- Events
  subscribed_events TEXT[] NOT NULL, -- Events to subscribe to
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  
  -- Retry settings
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  
  -- Statistics
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Deliveries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  
  -- Delivery details
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  payload JSONB NOT NULL,
  
  -- Delivery status
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'retrying')),
  http_status_code INTEGER,
  response_body TEXT,
  
  -- Retry
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  
  -- Timestamps
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

-- API Rate Limiting
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  
  -- Rate limit window
  window_type TEXT NOT NULL CHECK (window_type IN ('minute', 'hour', 'day')),
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  
  -- Usage
  request_count INTEGER DEFAULT 0,
  is_limit_exceeded BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(api_key_id, window_type, window_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_usage_analytics_api_key_id ON api_usage_analytics(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_analytics_requested_at ON api_usage_analytics(requested_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(delivery_status);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_api_key_id ON api_rate_limits(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON api_rate_limits(window_start, window_end);

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- API Keys: Users can view their own
CREATE POLICY "Users can manage own API keys"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id);

-- API Usage Analytics: Users can view their own
CREATE POLICY "Users can view own API usage"
  ON api_usage_analytics FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM api_keys ak
      WHERE ak.id = api_usage_analytics.api_key_id
      AND ak.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create API usage analytics"
  ON api_usage_analytics FOR INSERT
  WITH CHECK (true);

-- Webhooks: Users can view their own
CREATE POLICY "Users can manage own webhooks"
  ON webhooks FOR ALL
  USING (auth.uid() = user_id);

-- Webhook Deliveries: Users can view deliveries for their webhooks
CREATE POLICY "Users can view own webhook deliveries"
  ON webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM webhooks w
      WHERE w.id = webhook_deliveries.webhook_id
      AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create webhook deliveries"
  ON webhook_deliveries FOR INSERT
  WITH CHECK (true);

-- API Rate Limits: System can manage
CREATE POLICY "System can manage rate limits"
  ON api_rate_limits FOR ALL
  USING (true);

