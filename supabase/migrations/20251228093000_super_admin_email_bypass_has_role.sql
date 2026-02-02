-- Super admin email-based bypass for role checks
-- This ensures the owner account (n8ter8@gmail.com) has full admin/super_admin DB privileges
-- even if the user_roles row has not yet been created (e.g., fresh environments).
--
-- Idempotent: CREATE OR REPLACE

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Email-based super admin bypass (only for the current authenticated user)
    (
      _user_id = auth.uid()
      AND lower(coalesce((auth.jwt() ->> 'email')::text, '')) = 'n8ter8@gmail.com'
    )
    OR EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
$$;

