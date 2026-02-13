-- DLC Age Verification compatibility hardening
-- - Older clients used verification_method = 'self_attested'
-- - Early schema allowed only ('self_declared', 'id_check', 'credit_card')
-- This migration makes the check constraint tolerant across versions.
--
-- Idempotent / re-runnable.

DO $$
DECLARE
  tbl regclass;
  has_col boolean;
  c record;
BEGIN
  tbl := to_regclass('public.dlc_age_verifications');
  IF tbl IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dlc_age_verifications'
      AND column_name = 'verification_method'
  ) INTO has_col;

  IF NOT has_col THEN
    RETURN;
  END IF;

  -- Drop any existing CHECK constraints that reference verification_method
  -- (constraint names vary across environments).
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = tbl
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%verification_method%'
  LOOP
    EXECUTE format('ALTER TABLE public.dlc_age_verifications DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;

  -- Re-add a canonical, more permissive constraint.
  -- NOTE: This still constrains values to a known-safe set (no arbitrary strings),
  -- but includes historical client values for compatibility.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = tbl
      AND conname = 'dlc_age_verifications_verification_method_check'
  ) THEN
    EXECUTE $sql$
      ALTER TABLE public.dlc_age_verifications
        ADD CONSTRAINT dlc_age_verifications_verification_method_check
        CHECK (
          verification_method IN ('self_declared', 'self_attested', 'id_check', 'credit_card')
        )
    $sql$;
  END IF;
END $$;

