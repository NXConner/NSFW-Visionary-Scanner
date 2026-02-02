-- Research Participation DLC (Free + rewards)
-- Anonymized data contribution for research with rewards system

-- Create research programs table
CREATE TABLE IF NOT EXISTS public.research_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  institution TEXT NOT NULL,
  principal_investigator TEXT,
  irb_approval_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('planned', 'active', 'completed', 'suspended')),
  data_requirements JSONB NOT NULL, -- What data is needed
  inclusion_criteria JSONB, -- Who can participate
  compensation_points INTEGER DEFAULT 100,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create research participation table
CREATE TABLE IF NOT EXISTS public.research_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.research_programs(id) ON DELETE CASCADE,
  opted_in BOOLEAN DEFAULT FALSE,
  consent_given_at TIMESTAMPTZ,
  consent_version TEXT,
  data_sharing_preferences JSONB DEFAULT '{"scans": true, "wellness_scores": true, "diary_entries": false, "demographics": true}'::jsonb,
  anonymization_level TEXT DEFAULT 'full' CHECK (anonymization_level IN ('full', 'partial', 'minimal')),
  withdrawal_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

-- Create anonymized contributions table
CREATE TABLE IF NOT EXISTS public.anonymized_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participation_id UUID NOT NULL REFERENCES public.research_participation(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.research_programs(id) ON DELETE CASCADE,
  anonymous_user_id UUID NOT NULL DEFAULT gen_random_uuid(), -- Permanent anonymous ID
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('scan_data', 'wellness_score', 'diary_entry', 'survey_response', 'demographic_data')),
  data JSONB NOT NULL, -- Anonymized data payload
  data_hash TEXT NOT NULL, -- For deduplication
  contributed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data_hash)
);

-- Create rewards system table
CREATE TABLE IF NOT EXISTS public.research_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create rewards transactions table
CREATE TABLE IF NOT EXISTS public.rewards_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'bonus', 'expired', 'reversed')),
  points INTEGER NOT NULL,
  source TEXT NOT NULL, -- program_id, redemption_id, etc.
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create research dashboard stats table
CREATE TABLE IF NOT EXISTS public.research_contribution_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_contributions INTEGER DEFAULT 0,
  contributions_by_type JSONB DEFAULT '{}'::jsonb,
  impact_score INTEGER DEFAULT 0, -- Based on contribution quality and quantity
  last_contribution_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create data usage transparency table
CREATE TABLE IF NOT EXISTS public.data_usage_transparency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.research_programs(id) ON DELETE CASCADE,
  publication_title TEXT,
  publication_date DATE,
  publication_url TEXT,
  findings_summary TEXT,
  data_points_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_research_programs_status ON public.research_programs(status);
CREATE INDEX IF NOT EXISTS idx_research_participation_user_id ON public.research_participation(user_id);
CREATE INDEX IF NOT EXISTS idx_research_participation_program_id ON public.research_participation(program_id);
CREATE INDEX IF NOT EXISTS idx_anonymized_contributions_program_id ON public.anonymized_contributions(program_id);
CREATE INDEX IF NOT EXISTS idx_research_rewards_user_id ON public.research_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_transactions_user_id ON public.rewards_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_contribution_stats_user_id ON public.research_contribution_stats(user_id);

-- Enable RLS
ALTER TABLE public.research_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymized_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_contribution_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_usage_transparency ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active research programs" ON public.research_programs
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can manage their research participation" ON public.research_participation
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users cannot view anonymized contributions" ON public.anonymized_contributions
  FOR SELECT USING (false); -- Strict privacy: no one can view

CREATE POLICY "Users can view their rewards" ON public.research_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their rewards transactions" ON public.rewards_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their contribution stats" ON public.research_contribution_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view data usage transparency" ON public.data_usage_transparency
  FOR SELECT USING (true);

-- Seed data: Sample research programs
INSERT INTO public.research_programs (
  name, 
  description, 
  institution, 
  principal_investigator, 
  irb_approval_number,
  start_date, 
  end_date,
  status, 
  data_requirements,
  compensation_points,
  max_participants
) VALUES
  (
    'Men''s Health Longitudinal Study',
    'A multi-year study tracking men''s health metrics and outcomes',
    'Johns Hopkins University',
    'Dr. Michael Chen, MD, PhD',
    'IRB-2024-001234',
    '2025-01-01',
    '2027-12-31',
    'active',
    '{"required": ["scan_data", "wellness_scores"], "optional": ["diary_entries"]}'::jsonb,
    500,
    10000
  ),
  (
    'Wellness Intervention Efficacy Study',
    'Evaluating the effectiveness of wellness interventions',
    'Stanford Medicine',
    'Dr. Sarah Johnson, PhD',
    'IRB-2024-005678',
    '2025-02-01',
    '2026-12-31',
    'active',
    '{"required": ["wellness_scores", "goal_tracking"], "optional": ["demographics"]}'::jsonb,
    300,
    5000
  );

COMMENT ON TABLE public.research_programs IS 'Research Participation DLC: Active research programs';
COMMENT ON TABLE public.research_participation IS 'Research Participation DLC: User participation records';
COMMENT ON TABLE public.anonymized_contributions IS 'Research Participation DLC: Anonymized data contributions';
COMMENT ON TABLE public.research_rewards IS 'Research Participation DLC: User rewards balances';
COMMENT ON TABLE public.data_usage_transparency IS 'Research Participation DLC: Published research transparency';
