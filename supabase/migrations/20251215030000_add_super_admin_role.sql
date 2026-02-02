-- Ensure app_role enum supports super_admin (idempotent on Postgres 15+)
DO $$
BEGIN
  BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
  EXCEPTION
    WHEN undefined_object THEN
      -- app_role may not exist in some environments yet; ignore
      NULL;
  END;
END $$;

