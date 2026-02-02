-- Wellness Coaching AI DLC ($19.99/month)
-- AI-powered personalized coaching and insights

-- Create coaching sessions table
CREATE TABLE IF NOT EXISTS public.coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('initial_assessment', 'progress_review', 'goal_setting', 'weekly_checkin', 'monthly_review')),
  ai_insights JSONB NOT NULL, -- AI-generated insights
  user_feedback TEXT,
  goals_set JSONB,
  action_items TEXT[],
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user goals table
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('health', 'wellness', 'fitness', 'performance', 'lifestyle')),
  target_value DECIMAL,
  current_value DECIMAL,
  unit TEXT,
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  progress_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create progress tracking table
CREATE TABLE IF NOT EXISTS public.goal_progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.user_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value DECIMAL NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create coaching reports table
CREATE TABLE IF NOT EXISTS public.coaching_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'quarterly', 'annual')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  summary TEXT NOT NULL,
  key_insights JSONB NOT NULL,
  recommendations TEXT[],
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create personalized insights table
CREATE TABLE IF NOT EXISTS public.personalized_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern', 'trend', 'recommendation', 'alert', 'achievement')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  data_source JSONB, -- Reference to scan history, wellness scores, etc.
  action_required BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_user_id ON public.coaching_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_created_at ON public.coaching_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON public.user_goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_progress_tracking_goal_id ON public.goal_progress_tracking(goal_id);
CREATE INDEX IF NOT EXISTS idx_coaching_reports_user_id ON public.coaching_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_insights_user_id ON public.personalized_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_insights_dismissed ON public.personalized_insights(dismissed);

-- Enable RLS
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalized_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their coaching sessions" ON public.coaching_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their goals" ON public.user_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their goal progress" ON public.goal_progress_tracking
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their coaching reports" ON public.coaching_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their insights" ON public.personalized_insights
  FOR ALL USING (auth.uid() = user_id);

COMMENT ON TABLE public.coaching_sessions IS 'Wellness Coaching AI DLC: AI-powered coaching sessions';
COMMENT ON TABLE public.user_goals IS 'Wellness Coaching AI DLC: User health and wellness goals';
COMMENT ON TABLE public.coaching_reports IS 'Wellness Coaching AI DLC: Periodic coaching reports';
COMMENT ON TABLE public.personalized_insights IS 'Wellness Coaching AI DLC: AI-generated personalized insights';
