-- Migration: Email Analytics
-- Creates table for email marketing analytics

CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_address TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aggregate email analytics view
CREATE OR REPLACE VIEW email_analytics_summary AS
SELECT
  DATE(created_at) as date,
  event_type,
  COUNT(*) as count
FROM email_analytics
GROUP BY DATE(created_at), event_type;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_analytics_user_id ON email_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_campaign_id ON email_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_event_type ON email_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_email_analytics_created_at ON email_analytics(created_at);

-- Enable RLS
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own email analytics" ON email_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage email analytics" ON email_analytics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

