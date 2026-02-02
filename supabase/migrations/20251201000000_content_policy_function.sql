-- Content policy helper for SFW/NSFW data seeding
-- Use a session-level setting: app.content_policy = 'sfw' | 'nsfw'
-- Default to 'sfw' when unset/empty

CREATE OR REPLACE FUNCTION public.is_nsfw_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('app.content_policy', true), ''), 'sfw') = 'nsfw';
$$;
