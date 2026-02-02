-- Beta testers allowlist (non-paid beta unlock)
-- Purpose:
-- - Enable "all features + all DLC" access for approved beta testers without Stripe.
-- - Keep access auditable, revocable, and optionally expiring.
-- Notes:
-- - Idempotent: CREATE TABLE IF NOT EXISTS + DROP/CREATE POLICIES.
-- - Access model:
--   - Users can read their own beta status.
--   - Admin/super_admin can manage rows.

CREATE TABLE IF NOT EXISTS public.beta_testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ NULL,
  granted_by UUID NULL REFERENCES auth.users(id),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT beta_testers_user_id_unique UNIQUE (user_id)
);

-- Keep email uniqueness case-insensitive (best-effort)
CREATE UNIQUE INDEX IF NOT EXISTS beta_testers_email_lower_unique
  ON public.beta_testers (LOWER(email));

CREATE INDEX IF NOT EXISTS beta_testers_enabled_idx
  ON public.beta_testers (enabled);

CREATE INDEX IF NOT EXISTS beta_testers_expires_at_idx
  ON public.beta_testers (expires_at);

ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "beta_testers_read_own" ON public.beta_testers;
CREATE POLICY "beta_testers_read_own"
ON public.beta_testers
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "beta_testers_admin_read_all" ON public.beta_testers;
CREATE POLICY "beta_testers_admin_read_all"
ON public.beta_testers
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "beta_testers_admin_insert" ON public.beta_testers;
CREATE POLICY "beta_testers_admin_insert"
ON public.beta_testers
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "beta_testers_admin_update" ON public.beta_testers;
CREATE POLICY "beta_testers_admin_update"
ON public.beta_testers
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "beta_testers_admin_delete" ON public.beta_testers;
CREATE POLICY "beta_testers_admin_delete"
ON public.beta_testers
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'super_admin')
);

