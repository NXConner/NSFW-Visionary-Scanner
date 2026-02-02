-- Create learning tables for interactive learning persistence
CREATE TABLE IF NOT EXISTS public.learning_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty_level TEXT DEFAULT 'beginner',
  estimated_duration_minutes INTEGER DEFAULT 0,
  module_count INTEGER DEFAULT 0,
  lesson_count INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  intro_video_url TEXT,
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  enrollment_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure learning_courses has is_published when table pre-exists
ALTER TABLE public.learning_courses
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS public.learning_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  estimated_duration_minutes INTEGER DEFAULT 0,
  lesson_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.learning_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  content_data JSONB,
  order_index INTEGER DEFAULT 0,
  estimated_duration_minutes INTEGER DEFAULT 0,
  requires_completion_of TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  current_module_id UUID REFERENCES public.learning_modules(id),
  current_lesson_id UUID REFERENCES public.learning_lessons(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.learning_lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.learning_lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completion_percentage NUMERIC(5,2) DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.learning_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.learning_lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT DEFAULT 'multiple_choice',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  attempt_limit INTEGER,
  show_results_immediately BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL REFERENCES public.learning_quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score NUMERIC(5,2),
  passed BOOLEAN DEFAULT false,
  time_taken_minutes INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  certificate_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS on all learning tables
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_certificates ENABLE ROW LEVEL SECURITY;

-- Courses, modules, lessons, quizzes are publicly readable
DROP POLICY IF EXISTS "Learning courses are viewable by everyone" ON public.learning_courses;
DROP POLICY IF EXISTS "Learning modules are viewable by everyone" ON public.learning_modules;
DROP POLICY IF EXISTS "Learning lessons are viewable by everyone" ON public.learning_lessons;
DROP POLICY IF EXISTS "Learning quizzes are viewable by everyone" ON public.learning_quizzes;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.learning_enrollments;
DROP POLICY IF EXISTS "Users can create their own enrollments" ON public.learning_enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.learning_enrollments;
DROP POLICY IF EXISTS "Users can view their own lesson progress" ON public.learning_lesson_progress;
DROP POLICY IF EXISTS "Users can create their own lesson progress" ON public.learning_lesson_progress;
DROP POLICY IF EXISTS "Users can update their own lesson progress" ON public.learning_lesson_progress;
DROP POLICY IF EXISTS "Users can view their own quiz attempts" ON public.learning_quiz_attempts;
DROP POLICY IF EXISTS "Users can create their own quiz attempts" ON public.learning_quiz_attempts;
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.learning_certificates;

CREATE POLICY "Learning courses are viewable by everyone" ON public.learning_courses FOR SELECT USING (is_published = true);
CREATE POLICY "Learning modules are viewable by everyone" ON public.learning_modules FOR SELECT USING (true);
CREATE POLICY "Learning lessons are viewable by everyone" ON public.learning_lessons FOR SELECT USING (true);
CREATE POLICY "Learning quizzes are viewable by everyone" ON public.learning_quizzes FOR SELECT USING (true);

-- User-specific data is only accessible by the owner
CREATE POLICY "Users can view their own enrollments" ON public.learning_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own enrollments" ON public.learning_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own enrollments" ON public.learning_enrollments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own lesson progress" ON public.learning_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own lesson progress" ON public.learning_lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lesson progress" ON public.learning_lesson_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own quiz attempts" ON public.learning_quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quiz attempts" ON public.learning_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own certificates" ON public.learning_certificates FOR SELECT USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_enrollments_user ON public.learning_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_enrollments_course ON public.learning_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_lesson_progress_user ON public.learning_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_quiz_attempts_user ON public.learning_quiz_attempts(user_id);