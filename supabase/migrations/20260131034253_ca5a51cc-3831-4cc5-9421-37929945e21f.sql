-- Create forum_categories table
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  thread_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum_threads table
CREATE TABLE IF NOT EXISTS public.forum_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE,
  last_reply_user_id UUID,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum_user_reputation table
CREATE TABLE IF NOT EXISTS public.forum_user_reputation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  reputation_points INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  threads_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  rank_title TEXT DEFAULT 'Newcomer',
  badges TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_user_reputation ENABLE ROW LEVEL SECURITY;

-- forum_categories: Public read access
DROP POLICY IF EXISTS "Anyone can view forum categories" ON public.forum_categories;
CREATE POLICY "Anyone can view forum categories" 
ON public.forum_categories FOR SELECT USING (true);

-- forum_threads: Public read, authenticated create/update own
DROP POLICY IF EXISTS "Anyone can view forum threads" ON public.forum_threads;
CREATE POLICY "Anyone can view forum threads" 
ON public.forum_threads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create forum threads" ON public.forum_threads;
CREATE POLICY "Users can create forum threads" 
ON public.forum_threads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own threads" ON public.forum_threads;
CREATE POLICY "Users can update their own threads" 
ON public.forum_threads FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own threads" ON public.forum_threads;
CREATE POLICY "Users can delete their own threads" 
ON public.forum_threads FOR DELETE 
USING (auth.uid() = user_id);

-- forum_user_reputation: Users can view all, update own
DROP POLICY IF EXISTS "Anyone can view user reputation" ON public.forum_user_reputation;
CREATE POLICY "Anyone can view user reputation" 
ON public.forum_user_reputation FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own reputation" ON public.forum_user_reputation;
CREATE POLICY "Users can update their own reputation" 
ON public.forum_user_reputation FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own reputation" ON public.forum_user_reputation;
CREATE POLICY "Users can create their own reputation" 
ON public.forum_user_reputation FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_forum_threads_category ON public.forum_threads(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_user ON public.forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_user_reputation_user ON public.forum_user_reputation(user_id);

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_forum_categories_updated_at ON public.forum_categories;
CREATE TRIGGER update_forum_categories_updated_at
BEFORE UPDATE ON public.forum_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_threads_updated_at ON public.forum_threads;
CREATE TRIGGER update_forum_threads_updated_at
BEFORE UPDATE ON public.forum_threads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_forum_user_reputation_updated_at ON public.forum_user_reputation;
CREATE TRIGGER update_forum_user_reputation_updated_at
BEFORE UPDATE ON public.forum_user_reputation
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();