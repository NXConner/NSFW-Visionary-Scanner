-- Create a secure view for public leaderboard access that excludes user_id
-- This prevents user activity tracking while maintaining leaderboard functionality

-- Create a materialized view for public leaderboard data without user_id
CREATE OR REPLACE VIEW public.leaderboards_public AS
SELECT 
    id,
    leaderboard_type,
    period,
    score,
    rank,
    display_name,
    is_anonymous,
    created_at,
    updated_at
FROM public.leaderboards;

-- Grant SELECT on the view to authenticated and anon users
GRANT SELECT ON public.leaderboards_public TO authenticated, anon;

-- Drop the overly permissive SELECT policy on leaderboards
DROP POLICY IF EXISTS "Anyone can view leaderboards" ON public.leaderboards;

-- Create a new policy that only allows users to view their own entries
CREATE POLICY "Users can view their own leaderboard entries"
ON public.leaderboards
FOR SELECT
USING (auth.uid() = user_id);

-- Add a comment explaining the security model
COMMENT ON VIEW public.leaderboards_public IS 'Secure public view of leaderboards that excludes user_id to prevent activity tracking. Use this view for public leaderboard displays.';
COMMENT ON TABLE public.leaderboards IS 'Private leaderboard data with user_id. Direct access restricted to own entries only. Use leaderboards_public view for anonymous public access.';