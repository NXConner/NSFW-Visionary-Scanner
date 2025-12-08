-- Comprehensive Sexual Health Education System
-- Manages educational content, interactive learning, Q&A, and expert content

-- Education modules/categories
CREATE TABLE IF NOT EXISTS sexual_health_education_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('anatomy', 'function', 'conditions', 'treatment', 'prevention', 'wellness', 'relationships', 'myths')),
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  age_group TEXT CHECK (age_group IN ('18-25', '26-35', '36-45', '46-55', '56+', 'all')),
  estimated_duration_minutes INTEGER,
  content_type TEXT CHECK (content_type IN ('article', 'video', 'interactive', 'quiz', 'assessment')),
  
  -- Content
  content_text TEXT,
  content_html TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  
  -- Metadata
  author TEXT,
  expert_reviewed BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Organization
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interactive learning content (quizzes, assessments)
CREATE TABLE IF NOT EXISTS education_interactive_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES sexual_health_education_modules(id) ON DELETE CASCADE,
  
  content_type TEXT NOT NULL CHECK (content_type IN ('quiz', 'assessment', 'interactive_guide')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Quiz/Assessment structure (stored as JSON)
  questions JSONB NOT NULL,
  answers JSONB,
  passing_score INTEGER DEFAULT 70,
  
  -- Results tracking
  completion_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS education_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES sexual_health_education_modules(id) ON DELETE CASCADE,
  
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  
  -- Quiz/Assessment results
  quiz_score DECIMAL(5,2),
  quiz_attempts INTEGER DEFAULT 0,
  quiz_completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, module_id)
);

-- Q&A database
CREATE TABLE IF NOT EXISTS education_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT CHECK (category IN ('anatomy', 'function', 'conditions', 'treatment', 'prevention', 'wellness', 'relationships', 'myths', 'general')),
  
  -- Expert information
  answered_by TEXT,
  expert_verified BOOLEAN DEFAULT false,
  source_url TEXT,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  -- Organization
  tags TEXT[],
  related_module_ids UUID[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Q&A interactions
CREATE TABLE IF NOT EXISTS education_qa_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qa_id UUID NOT NULL REFERENCES education_qa(id) ON DELETE CASCADE,
  
  was_helpful BOOLEAN,
  user_question TEXT, -- User's specific question if asking new one
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, qa_id)
);

-- Expert interviews/content
CREATE TABLE IF NOT EXISTS education_expert_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  expert_name TEXT NOT NULL,
  expert_title TEXT,
  expert_credentials TEXT,
  expert_bio TEXT,
  expert_image_url TEXT,
  
  content_type TEXT CHECK (content_type IN ('interview', 'article', 'video', 'webinar')),
  title TEXT NOT NULL,
  description TEXT,
  content_text TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  
  duration_minutes INTEGER,
  transcript TEXT,
  
  -- Metadata
  topics TEXT[],
  tags TEXT[],
  is_premium BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Research updates/news
CREATE TABLE IF NOT EXISTS education_research_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_article TEXT,
  source_url TEXT,
  source_name TEXT,
  
  category TEXT CHECK (category IN ('research', 'news', 'breakthrough', 'study', 'guideline')),
  tags TEXT[],
  
  published_date DATE,
  relevance_score INTEGER DEFAULT 0, -- 0-100
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User bookmarks/favorites
CREATE TABLE IF NOT EXISTS education_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content_type TEXT NOT NULL CHECK (content_type IN ('module', 'qa', 'expert_content', 'research_update')),
  content_id UUID NOT NULL,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, content_type, content_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_education_modules_category ON sexual_health_education_modules(category);
CREATE INDEX IF NOT EXISTS idx_education_modules_featured ON sexual_health_education_modules(is_featured, order_index);
CREATE INDEX IF NOT EXISTS idx_education_modules_premium ON sexual_health_education_modules(is_premium);
CREATE INDEX IF NOT EXISTS idx_education_interactive_module ON education_interactive_content(module_id);
CREATE INDEX IF NOT EXISTS idx_education_progress_user ON education_user_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_education_progress_module ON education_user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_education_qa_category ON education_qa(category);
CREATE INDEX IF NOT EXISTS idx_education_qa_verified ON education_qa(expert_verified);
CREATE INDEX IF NOT EXISTS idx_education_qa_interactions_user ON education_qa_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_education_expert_published ON education_expert_content(published_at);
CREATE INDEX IF NOT EXISTS idx_education_research_category ON education_research_updates(category, published_date);
CREATE INDEX IF NOT EXISTS idx_education_bookmarks_user ON education_bookmarks(user_id, content_type);

-- RLS Policies
ALTER TABLE sexual_health_education_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_interactive_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_qa_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_expert_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_research_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_bookmarks ENABLE ROW LEVEL SECURITY;

-- Education modules policies (public read, admin write)
CREATE POLICY "Anyone can view education modules"
  ON sexual_health_education_modules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage education modules"
  ON sexual_health_education_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Interactive content policies
CREATE POLICY "Anyone can view interactive content"
  ON education_interactive_content FOR SELECT
  USING (true);

-- User progress policies
CREATE POLICY "Users can view their own progress"
  ON education_user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress"
  ON education_user_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Q&A policies
CREATE POLICY "Anyone can view Q&A"
  ON education_qa FOR SELECT
  USING (true);

CREATE POLICY "Users can interact with Q&A"
  ON education_qa_interactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Expert content policies
CREATE POLICY "Anyone can view expert content"
  ON education_expert_content FOR SELECT
  USING (true);

-- Research updates policies
CREATE POLICY "Anyone can view research updates"
  ON education_research_updates FOR SELECT
  USING (true);

-- Bookmarks policies
CREATE POLICY "Users can manage their own bookmarks"
  ON education_bookmarks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update module view count
CREATE OR REPLACE FUNCTION increment_module_view_count(module_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE sexual_health_education_modules
  SET view_count = view_count + 1
  WHERE id = module_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user's education completion percentage
CREATE OR REPLACE FUNCTION get_user_education_completion(user_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  total_modules INTEGER;
  completed_modules INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_modules
  FROM sexual_health_education_modules
  WHERE is_premium = false; -- Only count free modules for completion
  
  SELECT COUNT(*) INTO completed_modules
  FROM education_user_progress
  WHERE education_user_progress.user_id = get_user_education_completion.user_id
    AND is_completed = true;
  
  IF total_modules = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (completed_modules::DECIMAL / total_modules::DECIMAL) * 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

