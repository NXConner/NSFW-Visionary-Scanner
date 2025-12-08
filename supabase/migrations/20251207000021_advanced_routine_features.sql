-- Migration: Advanced Routine Features
-- Creates tables for routine templates library, adaptive routines, routine sharing, marketplace, video-guided routines, analytics, and multi-week programs

-- Routine Templates Library
CREATE TABLE IF NOT EXISTS routine_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('beginner', 'intermediate', 'advanced', 'recovery', 'maintenance', 'intensive', 'custom')),
  
  -- Template configuration
  exercises JSONB NOT NULL, -- Array of exercise definitions
  duration_weeks INTEGER,
  sessions_per_week INTEGER,
  estimated_time_per_session_minutes INTEGER,
  
  -- Difficulty
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
  intensity_level TEXT CHECK (intensity_level IN ('low', 'moderate', 'high', 'very_high')),
  
  -- Goals
  target_goals TEXT[], -- ['length', 'girth', 'curvature', 'endurance', etc.]
  expected_outcomes TEXT,
  
  -- Video guidance
  has_video_guidance BOOLEAN DEFAULT false,
  video_urls JSONB, -- Array of video URLs for exercises
  
  -- Requirements
  equipment_required TEXT[],
  experience_required TEXT,
  time_commitment TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id), -- NULL for system templates
  is_system_template BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false, -- Verified by experts
  
  -- Usage statistics
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 4), -- 0.0000 to 1.0000
  average_rating DECIMAL(3, 2), -- 1.00 to 5.00
  rating_count INTEGER DEFAULT 0,
  
  -- Reviews
  review_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Template Reviews
CREATE TABLE IF NOT EXISTS routine_template_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES routine_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  pros TEXT[],
  cons TEXT[],
  
  -- Experience
  completed_routine BOOLEAN DEFAULT false,
  weeks_completed INTEGER,
  results_achieved TEXT,
  
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(template_id, user_id)
);

-- Adaptive Routines (AI-powered personalized routines)
CREATE TABLE IF NOT EXISTS adaptive_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_template_id UUID REFERENCES routine_templates(id),
  
  routine_name TEXT NOT NULL,
  
  -- Adaptation data
  adaptation_reason TEXT, -- Why this routine was adapted
  user_profile JSONB NOT NULL, -- User's current state, goals, history
  adaptation_history JSONB, -- History of adaptations made
  
  -- Current routine
  current_exercises JSONB NOT NULL,
  current_schedule JSONB NOT NULL,
  difficulty_adjustment DECIMAL(3, 2), -- Multiplier for difficulty (0.5 to 2.0)
  
  -- AI metadata
  ai_model_version TEXT,
  adaptation_confidence DECIMAL(3, 2),
  last_adapted_at TIMESTAMPTZ,
  adaptation_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  start_date DATE,
  target_end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Sharing
CREATE TABLE IF NOT EXISTS shared_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID, -- References user's routine (could be from routines table)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  share_name TEXT NOT NULL,
  description TEXT,
  
  -- Sharing settings
  is_public BOOLEAN DEFAULT false,
  share_token TEXT UNIQUE,
  shared_with_users UUID[],
  
  -- Routine data (snapshot)
  routine_data JSONB NOT NULL, -- Full routine configuration
  
  -- Statistics
  view_count INTEGER DEFAULT 0,
  copy_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Marketplace (premium routines for sale)
CREATE TABLE IF NOT EXISTS routine_marketplace (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES routine_templates(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_subscription BOOLEAN DEFAULT false, -- Recurring payment
  subscription_duration_days INTEGER, -- If subscription
  
  -- Marketplace metadata
  marketplace_category TEXT,
  tags TEXT[],
  featured_image_url TEXT,
  preview_video_url TEXT,
  
  -- Sales
  sales_count INTEGER DEFAULT 0,
  revenue_total DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Purchases
CREATE TABLE IF NOT EXISTS routine_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID NOT NULL REFERENCES routine_marketplace(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  purchase_type TEXT DEFAULT 'one_time' CHECK (purchase_type IN ('one_time', 'subscription')),
  price_paid DECIMAL(10, 2) NOT NULL,
  payment_intent_id TEXT,
  
  -- Access
  access_granted_at TIMESTAMPTZ DEFAULT NOW(),
  access_expires_at TIMESTAMPTZ, -- NULL for lifetime access
  is_active BOOLEAN DEFAULT true,
  
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video-Guided Routine Sessions
CREATE TABLE IF NOT EXISTS video_guided_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID, -- References adaptive_routines or user routines
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  session_date DATE NOT NULL,
  session_type TEXT, -- 'warmup', 'exercise', 'cooldown', 'full'
  
  -- Video
  video_url TEXT NOT NULL,
  video_duration_seconds INTEGER,
  video_thumbnail_url TEXT,
  
  -- Progress tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  watched_duration_seconds INTEGER,
  completion_percentage DECIMAL(5, 2),
  
  -- Interaction
  paused_count INTEGER DEFAULT 0,
  rewind_count INTEGER DEFAULT 0,
  skipped BOOLEAN DEFAULT false,
  
  -- Feedback
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  helpful_rating INTEGER CHECK (helpful_rating >= 1 AND helpful_rating <= 5),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Routine Analytics
CREATE TABLE IF NOT EXISTS routine_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID, -- References adaptive_routines or user routines
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  
  -- Completion metrics
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  skipped_sessions INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2), -- Percentage
  
  -- Performance metrics
  average_session_duration_minutes DECIMAL(6, 2),
  total_time_spent_minutes INTEGER,
  consistency_score DECIMAL(5, 2), -- How consistent user is
  
  -- Progress metrics
  starting_measurements JSONB,
  current_measurements JSONB,
  progress_made JSONB, -- Changes in measurements
  
  -- Engagement
  engagement_score DECIMAL(5, 2),
  difficulty_adjustments_made INTEGER,
  
  -- Outcomes
  goals_achieved TEXT[],
  goals_in_progress TEXT[],
  goals_not_met TEXT[],
  
  -- Insights
  insights TEXT[],
  recommendations TEXT[],
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rest Day Recommendations (AI-powered)
CREATE TABLE IF NOT EXISTS rest_day_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID, -- References adaptive_routines
  
  recommended_date DATE NOT NULL,
  recommendation_type TEXT CHECK (recommendation_type IN ('scheduled', 'recovery', 'injury_prevention', 'overtraining', 'fatigue')),
  
  -- Reasoning
  reason TEXT NOT NULL,
  factors_considered JSONB, -- {recent_activity: ..., fatigue_level: ..., etc.}
  confidence DECIMAL(3, 2),
  
  -- User response
  was_followed BOOLEAN,
  user_feedback TEXT,
  
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Injury Prevention Alerts
CREATE TABLE IF NOT EXISTS injury_prevention_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID,
  
  alert_type TEXT NOT NULL CHECK (alert_type IN ('overtraining', 'form_correction', 'rest_needed', 'intensity_reduction', 'exercise_substitution')),
  
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Alert details
  message TEXT NOT NULL,
  affected_exercises TEXT[],
  recommendations TEXT[],
  
  -- Risk factors
  risk_factors JSONB, -- Identified risk factors
  risk_score DECIMAL(5, 2), -- 0.00 to 100.00
  
  -- User response
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  action_taken TEXT,
  
  alerted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-Week Programs
CREATE TABLE IF NOT EXISTS multi_week_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_template_id UUID REFERENCES routine_templates(id),
  
  program_name TEXT NOT NULL,
  description TEXT,
  
  -- Program structure
  total_weeks INTEGER NOT NULL,
  current_week INTEGER DEFAULT 1,
  phases JSONB NOT NULL, -- Array of program phases
  
  -- Schedule
  start_date DATE NOT NULL,
  target_end_date DATE,
  actual_end_date DATE,
  
  -- Progress
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  weeks_completed INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  
  -- Goals
  program_goals TEXT[],
  milestones JSONB, -- Array of milestones
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program Phases (individual phases within multi-week programs)
CREATE TABLE IF NOT EXISTS program_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES multi_week_programs(id) ON DELETE CASCADE,
  
  phase_number INTEGER NOT NULL,
  phase_name TEXT NOT NULL,
  description TEXT,
  
  -- Phase details
  duration_weeks INTEGER NOT NULL,
  start_week INTEGER NOT NULL,
  end_week INTEGER NOT NULL,
  
  -- Phase routine
  phase_routine JSONB NOT NULL,
  phase_goals TEXT[],
  
  -- Progress
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_routine_templates_category ON routine_templates(category);
CREATE INDEX IF NOT EXISTS idx_routine_templates_difficulty ON routine_templates(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_routine_template_reviews_template_id ON routine_template_reviews(template_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_routines_user_id ON adaptive_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_routines_user_id ON shared_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_routines_public ON shared_routines(is_public);
CREATE INDEX IF NOT EXISTS idx_routine_marketplace_creator_id ON routine_marketplace(creator_id);
CREATE INDEX IF NOT EXISTS idx_routine_purchases_user_id ON routine_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_video_guided_sessions_user_id ON video_guided_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_analytics_user_id ON routine_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_rest_day_recommendations_user_id ON rest_day_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_injury_prevention_alerts_user_id ON injury_prevention_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_multi_week_programs_user_id ON multi_week_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_program_phases_program_id ON program_phases(program_id);

-- RLS Policies
ALTER TABLE routine_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_template_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_guided_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rest_day_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_prevention_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_week_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_phases ENABLE ROW LEVEL SECURITY;

-- Routine Templates: All authenticated users can view
CREATE POLICY "Authenticated users can view routine templates"
  ON routine_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create routine templates"
  ON routine_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Routine Template Reviews: Users can view all, create own
CREATE POLICY "Users can view all reviews"
  ON routine_template_reviews FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create own reviews"
  ON routine_template_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON routine_template_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Adaptive Routines: Users can view their own
CREATE POLICY "Users can manage own adaptive routines"
  ON adaptive_routines FOR ALL
  USING (auth.uid() = user_id);

-- Shared Routines: Users can view public and shared with them
CREATE POLICY "Users can view public and shared routines"
  ON shared_routines FOR SELECT
  USING (
    is_public = true OR 
    auth.uid() = user_id OR 
    auth.uid() = ANY(shared_with_users)
  );

CREATE POLICY "Users can create shared routines"
  ON shared_routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Routine Marketplace: All authenticated users can view
CREATE POLICY "Authenticated users can view marketplace"
  ON routine_marketplace FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Creators can manage own marketplace items"
  ON routine_marketplace FOR ALL
  USING (auth.uid() = creator_id);

-- Routine Purchases: Users can view their own
CREATE POLICY "Users can view own purchases"
  ON routine_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
  ON routine_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Video-Guided Sessions: Users can view their own
CREATE POLICY "Users can manage own video sessions"
  ON video_guided_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Routine Analytics: Users can view their own
CREATE POLICY "Users can view own routine analytics"
  ON routine_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create routine analytics"
  ON routine_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Rest Day Recommendations: Users can view their own
CREATE POLICY "Users can view own rest day recommendations"
  ON rest_day_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rest day recommendations"
  ON rest_day_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create rest day recommendations"
  ON rest_day_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Injury Prevention Alerts: Users can view their own
CREATE POLICY "Users can view own injury alerts"
  ON injury_prevention_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own injury alerts"
  ON injury_prevention_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create injury alerts"
  ON injury_prevention_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Multi-Week Programs: Users can view their own
CREATE POLICY "Users can manage own multi-week programs"
  ON multi_week_programs FOR ALL
  USING (auth.uid() = user_id);

-- Program Phases: Users can view phases of their programs
CREATE POLICY "Users can view phases of own programs"
  ON program_phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM multi_week_programs mwp 
      WHERE mwp.id = program_phases.program_id 
      AND mwp.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage program phases"
  ON program_phases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM multi_week_programs mwp 
      WHERE mwp.id = program_phases.program_id 
      AND mwp.user_id = auth.uid()
    )
  );

