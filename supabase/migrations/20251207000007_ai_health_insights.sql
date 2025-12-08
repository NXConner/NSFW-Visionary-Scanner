-- Migration: AI Health Insights System
-- Creates tables for daily insights, patterns, and predictions

-- Daily Health Insights
CREATE TABLE IF NOT EXISTS daily_health_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_date DATE NOT NULL DEFAULT CURRENT_DATE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern', 'prediction', 'recommendation', 'warning', 'celebration')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('prostate', 'testicular', 'sexual', 'urinary', 'general', 'routine')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  actionable BOOLEAN DEFAULT false,
  action_items TEXT[],
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, insight_date, title)
);

-- Health Pattern Analysis Cache
CREATE TABLE IF NOT EXISTS health_pattern_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_data JSONB NOT NULL,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Prediction Cache
CREATE TABLE IF NOT EXISTS health_prediction_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timeframe TEXT NOT NULL CHECK (timeframe IN ('1_month', '3_months', '6_months', '1_year')),
  prediction_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_date ON daily_health_insights(user_id, insight_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_insights_read ON daily_health_insights(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_pattern_cache_user ON health_pattern_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_cache_user_timeframe ON health_prediction_cache(user_id, timeframe);

-- Enable RLS
ALTER TABLE daily_health_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_pattern_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_prediction_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own insights" ON daily_health_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights" ON daily_health_insights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can create insights" ON daily_health_insights
  FOR INSERT USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view own pattern cache" ON health_pattern_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage pattern cache" ON health_pattern_cache
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can view own prediction cache" ON health_prediction_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage prediction cache" ON health_prediction_cache
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

