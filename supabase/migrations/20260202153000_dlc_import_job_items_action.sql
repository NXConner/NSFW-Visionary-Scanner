-- Migration: Add action metadata to import job items
-- Purpose: enable rollback of created items without touching updated rows

DO $$
BEGIN
  IF to_regclass('public.dlc_content_import_job_items') IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dlc_content_import_job_items'
      AND column_name = 'action'
  ) THEN
    ALTER TABLE public.dlc_content_import_job_items
      ADD COLUMN action TEXT;
  END IF;

  UPDATE public.dlc_content_import_job_items
  SET action = COALESCE(action, 'created')
  WHERE action IS NULL;

  -- Add constraint if missing (safe to re-run)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.dlc_content_import_job_items'::regclass
      AND conname = 'dlc_content_import_job_items_action_check'
  ) THEN
    ALTER TABLE public.dlc_content_import_job_items
      ADD CONSTRAINT dlc_content_import_job_items_action_check
      CHECK (action IN ('created', 'updated', 'skipped', 'failed'));
  END IF;
END $$;
