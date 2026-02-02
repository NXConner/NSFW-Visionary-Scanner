-- Achievement System Tables

-- Achievement Definitions
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('consistency', 'progress', 'health', 'community', 'premium', 'special')),
    icon_name TEXT,
    badge_color TEXT NOT NULL DEFAULT '#FFD700',
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('streak', 'count', 'milestone', 'custom')),
    requirement_value INTEGER,
    requirement_data JSONB,
    points INTEGER NOT NULL DEFAULT 10,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Achievements (progress tracking)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    achievement_id UUID NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
    progress INTEGER NOT NULL DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    progress_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, achievement_id)
);

-- User Streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    streak_type TEXT NOT NULL CHECK (streak_type IN ('scan', 'routine', 'diary', 'education', 'community')),
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_activity_date DATE,
    streak_start_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, streak_type)
);

-- User Milestones
CREATE TABLE IF NOT EXISTS public.user_milestones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    milestone_type TEXT NOT NULL CHECK (milestone_type IN ('scan_count', 'routine_count', 'diary_count', 'days_active', 'measurement_growth', 'custom')),
    milestone_value INTEGER NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    milestone_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, milestone_type, milestone_value)
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS public.leaderboards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('achievements', 'streaks', 'progress', 'community')),
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    display_name TEXT NOT NULL DEFAULT 'Anonymous',
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, leaderboard_type, period)
);

-- Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('scans', 'scans', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('progress-photos', 'progress-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('videos', 'videos', false, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
    ('documents', 'documents', false, 20971520, ARRAY['application/pdf', 'application/json', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all new tables
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;

-- Ensure policies are idempotent if rerun
DROP POLICY IF EXISTS "Anyone can view active achievements" ON public.achievement_definitions;
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can update own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can manage own streaks" ON public.user_streaks;
DROP POLICY IF EXISTS "Users can manage own milestones" ON public.user_milestones;
DROP POLICY IF EXISTS "Anyone can view leaderboards" ON public.leaderboards;
DROP POLICY IF EXISTS "Users can manage own leaderboard entry" ON public.leaderboards;
DROP POLICY IF EXISTS "Users can view own scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;

-- RLS Policies for achievement_definitions (public read)
CREATE POLICY "Anyone can view active achievements" ON public.achievement_definitions
    FOR SELECT USING (is_active = true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON public.user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_streaks
CREATE POLICY "Users can manage own streaks" ON public.user_streaks
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_milestones
CREATE POLICY "Users can manage own milestones" ON public.user_milestones
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for leaderboards
CREATE POLICY "Anyone can view leaderboards" ON public.leaderboards
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own leaderboard entry" ON public.leaderboards
    FOR ALL USING (auth.uid() = user_id);

-- Storage Policies for scans bucket
CREATE POLICY "Users can view own scans" ON storage.objects
    FOR SELECT USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own scans" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own scans" ON storage.objects
    FOR DELETE USING (bucket_id = 'scans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for progress-photos bucket
CREATE POLICY "Users can view own progress photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own progress photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own progress photos" ON storage.objects
    FOR DELETE USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for avatars bucket (public read)
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Database functions for achievements
CREATE OR REPLACE FUNCTION public.check_achievement_progress(
    p_user_id UUID,
    p_achievement_code TEXT,
    p_progress_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_achievement achievement_definitions%ROWTYPE;
    v_user_achievement user_achievements%ROWTYPE;
    v_new_progress INTEGER;
    v_unlocked BOOLEAN := false;
BEGIN
    -- Get achievement definition
    SELECT * INTO v_achievement FROM achievement_definitions WHERE code = p_achievement_code AND is_active = true;
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Get or create user achievement
    SELECT * INTO v_user_achievement FROM user_achievements 
    WHERE user_id = p_user_id AND achievement_id = v_achievement.id;
    
    IF NOT FOUND THEN
        INSERT INTO user_achievements (user_id, achievement_id, progress)
        VALUES (p_user_id, v_achievement.id, p_progress_increment)
        RETURNING * INTO v_user_achievement;
        v_new_progress := p_progress_increment;
    ELSE
        IF v_user_achievement.is_unlocked THEN
            RETURN false; -- Already unlocked
        END IF;
        v_new_progress := v_user_achievement.progress + p_progress_increment;
        UPDATE user_achievements 
        SET progress = v_new_progress, updated_at = now()
        WHERE id = v_user_achievement.id;
    END IF;
    
    -- Check if achievement is now unlocked
    IF v_achievement.requirement_value IS NOT NULL AND v_new_progress >= v_achievement.requirement_value THEN
        UPDATE user_achievements 
        SET is_unlocked = true, unlocked_at = now()
        WHERE user_id = p_user_id AND achievement_id = v_achievement.id;
        v_unlocked := true;
    END IF;
    
    RETURN v_unlocked;
END;
$$;

-- Database function for updating streaks
CREATE OR REPLACE FUNCTION public.update_streak(
    p_user_id UUID,
    p_streak_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_streak user_streaks%ROWTYPE;
    v_today DATE := CURRENT_DATE;
    v_new_streak INTEGER;
BEGIN
    -- Get or create user streak
    SELECT * INTO v_streak FROM user_streaks 
    WHERE user_id = p_user_id AND streak_type = p_streak_type;
    
    IF NOT FOUND THEN
        INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date, streak_start_date)
        VALUES (p_user_id, p_streak_type, 1, 1, v_today, v_today)
        RETURNING current_streak INTO v_new_streak;
    ELSE
        -- Check if streak continues or resets
        IF v_streak.last_activity_date = v_today THEN
            -- Already updated today
            RETURN v_streak.current_streak;
        ELSIF v_streak.last_activity_date = v_today - INTERVAL '1 day' THEN
            -- Streak continues
            v_new_streak := v_streak.current_streak + 1;
            UPDATE user_streaks 
            SET current_streak = v_new_streak,
                longest_streak = GREATEST(longest_streak, v_new_streak),
                last_activity_date = v_today,
                updated_at = now()
            WHERE id = v_streak.id;
        ELSE
            -- Streak resets
            v_new_streak := 1;
            UPDATE user_streaks 
            SET current_streak = 1,
                last_activity_date = v_today,
                streak_start_date = v_today,
                updated_at = now()
            WHERE id = v_streak.id;
        END IF;
    END IF;
    
    RETURN v_new_streak;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_achievement_definitions_updated_at
    BEFORE UPDATE ON public.achievement_definitions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at
    BEFORE UPDATE ON public.user_achievements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at
    BEFORE UPDATE ON public.user_streaks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaderboards_updated_at
    BEFORE UPDATE ON public.leaderboards
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();