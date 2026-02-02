-- Create user_feedback table for the Feedback Hub
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  kind TEXT NOT NULL DEFAULT 'general',
  title TEXT,
  description TEXT NOT NULL,
  rating INTEGER,
  sentiment TEXT,
  severity TEXT,
  frequency TEXT,
  steps_to_reproduce TEXT,
  expected TEXT,
  actual TEXT,
  tags TEXT[],
  allow_contact BOOLEAN DEFAULT false,
  contact_email TEXT,
  environment JSONB,
  attachments TEXT[],
  status TEXT DEFAULT 'pending',
  admin_response TEXT
);

-- Enable Row Level Security
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.user_feedback;
CREATE POLICY "Users can view their own feedback" 
ON public.user_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own feedback
DROP POLICY IF EXISTS "Users can create their own feedback" ON public.user_feedback;
CREATE POLICY "Users can create their own feedback" 
ON public.user_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.user_feedback;
CREATE POLICY "Users can update their own feedback" 
ON public.user_feedback 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own feedback
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.user_feedback;
CREATE POLICY "Users can delete their own feedback" 
ON public.user_feedback 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_user_feedback_updated_at ON public.user_feedback;
CREATE TRIGGER update_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON public.user_feedback(status);