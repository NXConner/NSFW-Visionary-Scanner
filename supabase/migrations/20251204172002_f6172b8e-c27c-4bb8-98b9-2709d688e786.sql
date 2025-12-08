-- Create user_preferences table for cloud sync
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  theme text DEFAULT 'dark',
  theme_preset text DEFAULT 'obsidian',
  font_size text DEFAULT 'medium',
  color_blind_mode text DEFAULT 'none',
  haptic_enabled boolean DEFAULT true,
  notifications_enabled boolean DEFAULT false,
  reminder_time text DEFAULT '09:00',
  reminder_days integer[] DEFAULT '{1,3,5}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();