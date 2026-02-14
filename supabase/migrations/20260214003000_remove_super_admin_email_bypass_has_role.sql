-- Remove email-based super admin bypass from has_role()
--
-- Security hardening: role checks must be database-driven (user_roles), not email string comparisons.
-- This migration intentionally overrides any prior CREATE OR REPLACE that added an email bypass.
--
-- Idempotent: CREATE OR REPLACE

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

