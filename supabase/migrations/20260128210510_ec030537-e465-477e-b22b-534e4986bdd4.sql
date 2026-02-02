-- The issue is that with SECURITY INVOKER, anonymous users can't access the base table
-- We need a different approach: create a function that returns the public data

-- Drop the view
DROP VIEW IF EXISTS public.leaderboards_public;

-- Create a SECURITY DEFINER function with proper restrictions to fetch public leaderboard data
-- This is the recommended pattern when we need to expose data publicly but restrict columns
CREATE OR REPLACE FUNCTION public.get_public_leaderboards(
    p_leaderboard_type text DEFAULT NULL,
    p_period text DEFAULT NULL,
    p_limit integer DEFAULT 100
)
RETURNS TABLE (
    id uuid,
    leaderboard_type text,
    period text,
    score integer,
    rank integer,
    display_name text,
    is_anonymous boolean,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        l.id,
        l.leaderboard_type,
        l.period,
        l.score,
        l.rank,
        l.display_name,
        l.is_anonymous,
        l.created_at,
        l.updated_at
    FROM public.leaderboards l
    WHERE 
        (p_leaderboard_type IS NULL OR l.leaderboard_type = p_leaderboard_type)
        AND (p_period IS NULL OR l.period = p_period)
    ORDER BY l.rank ASC NULLS LAST, l.score DESC
    LIMIT LEAST(p_limit, 100);
$$;

-- Grant execute to all users
GRANT EXECUTE ON FUNCTION public.get_public_leaderboards(text, text, integer) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION public.get_public_leaderboards IS 'Secure function to get public leaderboard data without exposing user_id. Prevents user activity tracking while maintaining leaderboard functionality.';