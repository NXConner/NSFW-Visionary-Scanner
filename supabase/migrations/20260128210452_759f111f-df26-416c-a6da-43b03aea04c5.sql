-- Fix the security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboards_public;

-- Recreate view with explicit SECURITY INVOKER (default, but being explicit)
CREATE VIEW public.leaderboards_public 
WITH (security_invoker = true)
AS
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

-- Re-grant SELECT on the view
GRANT SELECT ON public.leaderboards_public TO authenticated, anon;

-- Add comments
COMMENT ON VIEW public.leaderboards_public IS 'Secure public view of leaderboards that excludes user_id to prevent activity tracking. Uses SECURITY INVOKER for proper RLS enforcement.';