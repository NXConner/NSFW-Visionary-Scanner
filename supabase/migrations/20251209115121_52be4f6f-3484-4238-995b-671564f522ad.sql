-- Healthcare Provider Portal Tables

-- Healthcare Providers
CREATE TABLE IF NOT EXISTS public.healthcare_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'doctor',
  specialty TEXT[] DEFAULT '{}',
  credentials TEXT[] DEFAULT '{}',
  license_number TEXT,
  license_state TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  website TEXT,
  subscription_tier TEXT DEFAULT 'basic',
  subscription_status TEXT DEFAULT 'active',
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  hipaa_compliant BOOLEAN DEFAULT false,
  hipaa_certification_date TIMESTAMPTZ,
  baa_signed BOOLEAN DEFAULT false,
  baa_signed_date TIMESTAMPTZ,
  max_patients INTEGER DEFAULT 100,
  current_patient_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patient Provider Relationships
CREATE TABLE IF NOT EXISTS public.patient_provider_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  provider_id UUID NOT NULL REFERENCES public.healthcare_providers(id) ON DELETE CASCADE,
  consent_granted BOOLEAN DEFAULT false,
  consent_date TIMESTAMPTZ,
  consent_expires_date TIMESTAMPTZ,
  consent_scope TEXT[] DEFAULT '{}',
  relationship_type TEXT DEFAULT 'primary',
  status TEXT DEFAULT 'active',
  access_level TEXT DEFAULT 'read',
  can_view_scans BOOLEAN DEFAULT false,
  can_view_diary BOOLEAN DEFAULT false,
  can_view_analytics BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  provider_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Provider Professional Reports
CREATE TABLE IF NOT EXISTS public.provider_professional_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.healthcare_providers(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'assessment',
  report_title TEXT NOT NULL,
  report_content JSONB DEFAULT '{}',
  findings TEXT[] DEFAULT '{}',
  recommendations TEXT[] DEFAULT '{}',
  treatment_plan JSONB,
  report_status TEXT DEFAULT 'draft',
  is_shared_with_patient BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  file_url TEXT,
  file_format TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Treatment Plans
CREATE TABLE IF NOT EXISTS public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.healthcare_providers(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  plan_description TEXT,
  plan_data JSONB DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  milestones TEXT[] DEFAULT '{}',
  timeline_days INTEGER,
  plan_status TEXT DEFAULT 'draft',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress_percentage NUMERIC DEFAULT 0,
  milestones_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- HIPAA Audit Logs
CREATE TABLE IF NOT EXISTS public.hipaa_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_id UUID,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habit Definitions (templates)
CREATE TABLE IF NOT EXISTS public.habit_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'custom',
  frequency TEXT NOT NULL DEFAULT 'daily',
  target_value NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'times',
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_times TEXT[] DEFAULT '{}',
  reminder_days INTEGER[] DEFAULT '{}',
  linked_routine_id UUID,
  linked_feature TEXT,
  color TEXT DEFAULT '#4CAF50',
  icon TEXT DEFAULT '💪',
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Habits
CREATE TABLE IF NOT EXISTS public.user_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_definition_id UUID NOT NULL REFERENCES public.habit_definitions(id) ON DELETE CASCADE,
  custom_name TEXT,
  custom_target_value NUMERIC,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT now(),
  paused_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  completion_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habit Entries
CREATE TABLE IF NOT EXISTS public.habit_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_habit_id UUID NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  completed_value NUMERIC DEFAULT 0,
  target_value NUMERIC,
  notes TEXT,
  mood TEXT,
  difficulty_rating INTEGER,
  duration_minutes INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habit Streaks
CREATE TABLE IF NOT EXISTS public.habit_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_habit_id UUID NOT NULL REFERENCES public.user_habits(id) ON DELETE CASCADE,
  streak_start_date DATE NOT NULL,
  streak_end_date DATE,
  streak_length INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_provider_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_professional_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hipaa_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for healthcare_providers
DROP POLICY IF EXISTS "Users can view own provider profile" ON public.healthcare_providers;
DROP POLICY IF EXISTS "Users can create own provider profile" ON public.healthcare_providers;
DROP POLICY IF EXISTS "Users can update own provider profile" ON public.healthcare_providers;
DROP POLICY IF EXISTS "Patients can view own relationships" ON public.patient_provider_relationships;
DROP POLICY IF EXISTS "Providers can view their patient relationships" ON public.patient_provider_relationships;
DROP POLICY IF EXISTS "Patients can create relationships" ON public.patient_provider_relationships;
DROP POLICY IF EXISTS "Patients can update own relationships" ON public.patient_provider_relationships;
DROP POLICY IF EXISTS "Providers can manage own reports" ON public.provider_professional_reports;
DROP POLICY IF EXISTS "Patients can view shared reports" ON public.provider_professional_reports;
DROP POLICY IF EXISTS "Providers can manage own treatment plans" ON public.treatment_plans;
DROP POLICY IF EXISTS "Patients can view own treatment plans" ON public.treatment_plans;
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.hipaa_audit_logs;
DROP POLICY IF EXISTS "Users can create audit logs" ON public.hipaa_audit_logs;
DROP POLICY IF EXISTS "Users can view own and template habits" ON public.habit_definitions;
DROP POLICY IF EXISTS "Users can create own habit definitions" ON public.habit_definitions;
DROP POLICY IF EXISTS "Users can update own habit definitions" ON public.habit_definitions;
DROP POLICY IF EXISTS "Users can delete own habit definitions" ON public.habit_definitions;
DROP POLICY IF EXISTS "Users can manage own habits" ON public.user_habits;
DROP POLICY IF EXISTS "Users can manage own habit entries" ON public.habit_entries;
DROP POLICY IF EXISTS "Users can manage own habit streaks" ON public.habit_streaks;

CREATE POLICY "Users can view own provider profile" ON public.healthcare_providers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own provider profile" ON public.healthcare_providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own provider profile" ON public.healthcare_providers FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for patient_provider_relationships
CREATE POLICY "Patients can view own relationships" ON public.patient_provider_relationships FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Providers can view their patient relationships" ON public.patient_provider_relationships FOR SELECT USING (EXISTS (SELECT 1 FROM public.healthcare_providers WHERE id = provider_id AND user_id = auth.uid()));
CREATE POLICY "Patients can create relationships" ON public.patient_provider_relationships FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Patients can update own relationships" ON public.patient_provider_relationships FOR UPDATE USING (auth.uid() = patient_id);

-- RLS Policies for provider_professional_reports
CREATE POLICY "Providers can manage own reports" ON public.provider_professional_reports FOR ALL USING (EXISTS (SELECT 1 FROM public.healthcare_providers WHERE id = provider_id AND user_id = auth.uid()));
CREATE POLICY "Patients can view shared reports" ON public.provider_professional_reports FOR SELECT USING (patient_id = auth.uid() AND is_shared_with_patient = true);

-- RLS Policies for treatment_plans
CREATE POLICY "Providers can manage own treatment plans" ON public.treatment_plans FOR ALL USING (EXISTS (SELECT 1 FROM public.healthcare_providers WHERE id = provider_id AND user_id = auth.uid()));
CREATE POLICY "Patients can view own treatment plans" ON public.treatment_plans FOR SELECT USING (patient_id = auth.uid());

-- RLS Policies for hipaa_audit_logs
CREATE POLICY "Users can view own audit logs" ON public.hipaa_audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create audit logs" ON public.hipaa_audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for habit_definitions
CREATE POLICY "Users can view own and template habits" ON public.habit_definitions FOR SELECT USING (user_id = auth.uid() OR is_template = true);
CREATE POLICY "Users can create own habit definitions" ON public.habit_definitions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own habit definitions" ON public.habit_definitions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own habit definitions" ON public.habit_definitions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_habits
CREATE POLICY "Users can manage own habits" ON public.user_habits FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for habit_entries
CREATE POLICY "Users can manage own habit entries" ON public.habit_entries FOR ALL USING (EXISTS (SELECT 1 FROM public.user_habits WHERE id = user_habit_id AND user_id = auth.uid()));

-- RLS Policies for habit_streaks
CREATE POLICY "Users can manage own habit streaks" ON public.habit_streaks FOR ALL USING (EXISTS (SELECT 1 FROM public.user_habits WHERE id = user_habit_id AND user_id = auth.uid()));

-- Create function to increment patient count
CREATE OR REPLACE FUNCTION public.increment_patient_count(p_provider_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.healthcare_providers
  SET current_patient_count = current_patient_count + 1,
      updated_at = now()
  WHERE id = p_provider_id;
END;
$$;

-- Insert default habit templates
INSERT INTO public.habit_definitions (id, name, description, category, frequency, target_value, unit, icon, color, is_template) VALUES
('00000000-0000-0000-0000-000000000001', 'Daily PE Routine', 'Complete your daily PE exercises', 'pe_routine', 'daily', 1, 'session', '💪', '#4CAF50', true),
('00000000-0000-0000-0000-000000000002', 'Jelqing Session', 'Complete jelqing exercises', 'pe_routine', 'daily', 20, 'minutes', '🎯', '#2196F3', true),
('00000000-0000-0000-0000-000000000003', 'Stretching Routine', 'Complete stretching exercises', 'pe_routine', 'daily', 15, 'minutes', '🧘', '#9C27B0', true),
('00000000-0000-0000-0000-000000000004', 'Kegel Exercises', 'Complete kegel exercises', 'health', 'daily', 50, 'reps', '💎', '#FF9800', true)
ON CONFLICT (id) DO NOTHING;