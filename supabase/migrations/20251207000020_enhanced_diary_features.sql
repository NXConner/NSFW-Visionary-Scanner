-- Migration: Enhanced Diary Features
-- Creates tables for symptom tracking, medication tracking, mood tracking, energy levels, sleep, diet, exercise, photo diary, voice notes, and diary templates

-- Enhanced Diary Entries (extends basic diary)
CREATE TABLE IF NOT EXISTS enhanced_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_entry_id UUID REFERENCES public.health_diary(id) ON DELETE CASCADE, -- Link to base diary entry if exists
  
  entry_date DATE NOT NULL,
  entry_time TIME,
  
  -- Symptom Tracking
  symptoms JSONB, -- Array of {symptom: string, severity: integer 1-10, location: string, duration: string, notes: string}
  symptom_count INTEGER DEFAULT 0,
  
  -- Medication Tracking
  medications JSONB, -- Array of {medication: string, dosage: string, time_taken: TIME, notes: string}
  medication_count INTEGER DEFAULT 0,
  
  -- Mood Tracking
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  mood_label TEXT CHECK (mood_label IN ('excellent', 'good', 'okay', 'poor', 'terrible')),
  mood_notes TEXT,
  mood_tags TEXT[], -- ['energetic', 'calm', 'anxious', etc.]
  
  -- Energy Level
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  energy_notes TEXT,
  
  -- Sleep Tracking
  sleep_hours DECIMAL(4, 2), -- Hours of sleep
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
  sleep_start_time TIME,
  sleep_end_time TIME,
  sleep_notes TEXT,
  sleep_interruptions INTEGER DEFAULT 0,
  
  -- Diet Tracking
  meals JSONB, -- Array of {meal_type: string, foods: string[], calories: integer, notes: string}
  total_calories INTEGER,
  water_intake_ml INTEGER,
  diet_notes TEXT,
  
  -- Exercise Logging (beyond PE)
  exercises JSONB, -- Array of {exercise: string, duration_minutes: integer, intensity: string, calories_burned: integer, notes: string}
  total_exercise_minutes INTEGER,
  exercise_notes TEXT,
  
  -- Photo Diary
  photos JSONB, -- Array of {url: string, caption: string, taken_at: TIMESTAMPTZ}
  photo_count INTEGER DEFAULT 0,
  
  -- Voice Notes
  voice_notes JSONB, -- Array of {url: string, duration_seconds: integer, transcript: TEXT, created_at: TIMESTAMPTZ}
  voice_note_count INTEGER DEFAULT 0,
  
  -- General Notes
  notes TEXT,
  tags TEXT[],
  
  -- Weather/Environment (optional context)
  weather TEXT,
  temperature_celsius DECIMAL(5, 2),
  location TEXT,
  
  -- Privacy
  is_private BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, entry_date)
);

-- Diary Templates
CREATE TABLE IF NOT EXISTS diary_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system templates
  
  template_name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('daily', 'weekly', 'health_focus', 'symptom_tracking', 'medication', 'exercise', 'custom')),
  
  -- Template configuration
  template_config JSONB NOT NULL, -- Which fields to include, default values, etc.
  required_fields TEXT[],
  optional_fields TEXT[],
  
  -- Default values
  default_values JSONB, -- Default values for fields
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diary Search Index (for full-text search)
CREATE TABLE IF NOT EXISTS diary_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES enhanced_diary_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Searchable content
  searchable_text TEXT NOT NULL, -- Combined text from all fields for search
  keywords TEXT[], -- Extracted keywords
  
  -- Metadata for search
  entry_date DATE NOT NULL,
  tags TEXT[],
  categories TEXT[], -- Auto-categorized
  
  -- Full-text search vector (for PostgreSQL full-text search)
  search_vector tsvector,
  
  indexed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diary Analytics (aggregated insights)
CREATE TABLE IF NOT EXISTS diary_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  
  -- Aggregated metrics
  total_entries INTEGER DEFAULT 0,
  entries_with_symptoms INTEGER DEFAULT 0,
  entries_with_medications INTEGER DEFAULT 0,
  entries_with_photos INTEGER DEFAULT 0,
  entries_with_voice_notes INTEGER DEFAULT 0,
  
  -- Averages
  average_mood_score DECIMAL(4, 2),
  average_energy_level DECIMAL(4, 2),
  average_sleep_hours DECIMAL(4, 2),
  average_sleep_quality DECIMAL(4, 2),
  
  -- Totals
  total_calories INTEGER,
  total_water_intake_ml INTEGER,
  total_exercise_minutes INTEGER,
  
  -- Patterns
  most_common_symptoms JSONB, -- Array of {symptom: string, frequency: integer}
  most_common_moods TEXT[],
  activity_patterns JSONB,
  
  -- Trends
  mood_trend TEXT CHECK (mood_trend IN ('improving', 'stable', 'declining', 'fluctuating')),
  energy_trend TEXT,
  sleep_trend TEXT,
  
  -- Insights
  insights TEXT[],
  recommendations TEXT[],
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Symptom Patterns (identified patterns in symptoms)
CREATE TABLE IF NOT EXISTS symptom_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  pattern_name TEXT NOT NULL,
  pattern_type TEXT CHECK (pattern_type IN ('temporal', 'correlation', 'trigger', 'severity')),
  
  -- Pattern data
  symptoms_involved TEXT[] NOT NULL,
  pattern_description TEXT,
  frequency TEXT, -- How often this pattern occurs
  confidence DECIMAL(3, 2), -- 0.00 to 1.00
  
  -- Correlations
  correlated_factors JSONB, -- {factor: string, correlation_strength: decimal}
  
  -- Recommendations
  recommendations TEXT[],
  
  identified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure symptom_patterns has expected user_id when table pre-exists
ALTER TABLE symptom_patterns
  ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'symptom_patterns_user_id_fkey'
  ) THEN
    ALTER TABLE symptom_patterns
      ADD CONSTRAINT symptom_patterns_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Medication Schedule
CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'daily', 'twice_daily', 'as_needed', etc.
  
  -- Schedule
  times_per_day INTEGER,
  specific_times TIME[], -- Array of specific times
  days_of_week INTEGER[], -- 0-6 (Sunday-Saturday)
  
  -- Duration
  start_date DATE,
  end_date DATE, -- NULL for ongoing
  is_active BOOLEAN DEFAULT true,
  
  -- Reminders
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_minutes_before INTEGER DEFAULT 15,
  
  -- Tracking
  total_doses INTEGER DEFAULT 0,
  missed_doses INTEGER DEFAULT 0,
  adherence_percentage DECIMAL(5, 2),
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medication Log (actual medication taken)
CREATE TABLE IF NOT EXISTS medication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES medication_schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL,
  scheduled_time TIME,
  
  was_on_time BOOLEAN, -- Taken at scheduled time
  was_missed BOOLEAN DEFAULT false,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_diary_user_date ON enhanced_diary_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_enhanced_diary_user_id ON enhanced_diary_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_templates_user_id ON diary_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_search_index_user_id ON diary_search_index(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_search_index_entry_id ON diary_search_index(entry_id);
CREATE INDEX IF NOT EXISTS idx_diary_search_index_vector ON diary_search_index USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_diary_analytics_user_id ON diary_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_patterns_user_id ON symptom_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_user_id ON medication_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_active ON medication_schedules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_medication_log_user_id ON medication_log(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_log_taken_at ON medication_log(taken_at);

-- RLS Policies
ALTER TABLE enhanced_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_log ENABLE ROW LEVEL SECURITY;

-- Enhanced Diary Entries: Users can view their own
CREATE POLICY "Users can manage own enhanced diary entries"
  ON enhanced_diary_entries FOR ALL
  USING (auth.uid() = user_id);

-- Diary Templates: Users can view their own and shared/system templates
CREATE POLICY "Users can view own and shared templates"
  ON diary_templates FOR SELECT
  USING (auth.uid() = user_id OR is_shared = true OR user_id IS NULL);

CREATE POLICY "Users can manage own templates"
  ON diary_templates FOR ALL
  USING (auth.uid() = user_id);

-- Diary Search Index: Users can view their own
CREATE POLICY "Users can view own search index"
  ON diary_search_index FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage search index"
  ON diary_search_index FOR ALL
  USING (auth.uid() = user_id);

-- Diary Analytics: Users can view their own
CREATE POLICY "Users can view own diary analytics"
  ON diary_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create diary analytics"
  ON diary_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Symptom Patterns: Users can view their own
CREATE POLICY "Users can view own symptom patterns"
  ON symptom_patterns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create symptom patterns"
  ON symptom_patterns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Medication Schedules: Users can manage their own
CREATE POLICY "Users can manage own medication schedules"
  ON medication_schedules FOR ALL
  USING (auth.uid() = user_id);

-- Medication Log: Users can view their own
CREATE POLICY "Users can manage own medication log"
  ON medication_log FOR ALL
  USING (auth.uid() = user_id);

