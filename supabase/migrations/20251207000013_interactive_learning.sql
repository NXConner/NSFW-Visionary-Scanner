-- Interactive Learning Modules System
-- Step-by-step courses, quizzes, assessments, progress tracking, and certificates

-- Learning courses
CREATE TABLE IF NOT EXISTS learning_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('health_education', 'technique', 'wellness', 'anatomy', 'treatment', 'prevention')),
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Course structure
  estimated_duration_minutes INTEGER,
  module_count INTEGER DEFAULT 0,
  lesson_count INTEGER DEFAULT 0,
  
  -- Content
  thumbnail_url TEXT,
  intro_video_url TEXT,
  
  -- Organization
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  -- Engagement
  enrollment_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course modules (sections within a course)
CREATE TABLE IF NOT EXISTS learning_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  estimated_duration_minutes INTEGER,
  
  lesson_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course lessons (individual learning units)
CREATE TABLE IF NOT EXISTS learning_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'video', 'interactive', 'quiz', 'assessment')),
  content_data JSONB, -- Flexible content storage
  
  order_index INTEGER DEFAULT 0,
  estimated_duration_minutes INTEGER,
  
  -- Prerequisites
  requires_completion_of UUID[], -- Lesson IDs that must be completed first
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User course enrollments
CREATE TABLE IF NOT EXISTS learning_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  current_module_id UUID REFERENCES learning_modules(id),
  current_lesson_id UUID REFERENCES learning_lessons(id),
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, course_id)
);

-- User lesson progress
CREATE TABLE IF NOT EXISTS learning_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES learning_lessons(id) ON DELETE CASCADE,
  
  is_completed BOOLEAN DEFAULT false,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, lesson_id)
);

-- Quizzes and assessments
CREATE TABLE IF NOT EXISTS learning_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES learning_lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES learning_courses(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT CHECK (quiz_type IN ('quiz', 'assessment', 'exam', 'practice')),
  
  questions JSONB NOT NULL, -- Array of question objects
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  
  attempt_limit INTEGER, -- NULL = unlimited
  show_results_immediately BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz attempts and results
CREATE TABLE IF NOT EXISTS learning_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES learning_quizzes(id) ON DELETE CASCADE,
  
  answers JSONB NOT NULL, -- User's answers
  score DECIMAL(5,2),
  percentage_score DECIMAL(5,2),
  passed BOOLEAN DEFAULT false,
  
  time_taken_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates of completion
CREATE TABLE IF NOT EXISTS learning_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course recommendations (AI-powered)
CREATE TABLE IF NOT EXISTS learning_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  
  recommendation_reason TEXT,
  confidence_score DECIMAL(5,2),
  priority INTEGER DEFAULT 0,
  
  is_viewed BOOLEAN DEFAULT false,
  is_enrolled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adaptive learning paths
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  path_type TEXT CHECK (path_type IN ('custom', 'recommended', 'adaptive')),
  
  course_ids UUID[] NOT NULL,
  current_course_index INTEGER DEFAULT 0,
  
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_courses_category ON learning_courses(category, is_featured);
CREATE INDEX IF NOT EXISTS idx_learning_modules_course ON learning_modules(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_learning_lessons_module ON learning_lessons(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_learning_enrollments_user ON learning_enrollments(user_id, last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_enrollments_course ON learning_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_lesson_progress_user ON learning_lesson_progress(user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_learning_quiz_attempts_user ON learning_quiz_attempts(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_certificates_user ON learning_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_recommendations_user ON learning_recommendations(user_id, priority DESC);
CREATE INDEX IF NOT EXISTS idx_learning_paths_user ON learning_paths(user_id);

-- RLS Policies
ALTER TABLE learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

-- Learning courses policies (public read, admin write)
CREATE POLICY "Anyone can view courses"
  ON learning_courses FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage courses"
  ON learning_courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Learning modules and lessons policies (public read)
CREATE POLICY "Anyone can view modules"
  ON learning_modules FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view lessons"
  ON learning_lessons FOR SELECT
  USING (true);

-- Enrollments policies
CREATE POLICY "Users can view their own enrollments"
  ON learning_enrollments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses"
  ON learning_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON learning_enrollments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Lesson progress policies
CREATE POLICY "Users can manage their own lesson progress"
  ON learning_lesson_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quiz attempts policies
CREATE POLICY "Users can manage their own quiz attempts"
  ON learning_quiz_attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Certificates policies
CREATE POLICY "Users can view their own certificates"
  ON learning_certificates FOR SELECT
  USING (auth.uid() = user_id);

-- Recommendations policies
CREATE POLICY "Users can view their own recommendations"
  ON learning_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON learning_recommendations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Learning paths policies
CREATE POLICY "Users can manage their own learning paths"
  ON learning_paths FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE learning_courses
    SET enrollment_count = enrollment_count + 1
    WHERE id = NEW.course_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE learning_courses
    SET enrollment_count = GREATEST(enrollment_count - 1, 0)
    WHERE id = OLD.course_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_enrollment_count
  AFTER INSERT OR DELETE ON learning_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_enrollment_count();

CREATE OR REPLACE FUNCTION update_course_completion_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at IS DISTINCT FROM NEW.completed_at) THEN
    UPDATE learning_courses
    SET completion_count = completion_count + 1
    WHERE id = NEW.course_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_completion_count
  AFTER UPDATE ON learning_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_course_completion_count();


