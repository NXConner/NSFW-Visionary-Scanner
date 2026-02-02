-- ============================================================
-- Compatibility migration: unify schema expectations
-- - stripe_webhook_events is used by edge function `stripe-webhook`
-- - device_tokens is used by push notification utilities + retention cleanup
--
-- This migration is idempotent and safe to re-run.
-- ============================================================

-- -----------------------------
-- stripe_webhook_events
-- -----------------------------
DO $$
BEGIN
  IF to_regclass('public.stripe_webhook_events') IS NOT NULL THEN
    -- Columns used by the app-generated types / older compatibility layers
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb;
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS processed boolean DEFAULT false;
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

    -- Columns used by edge function `stripe-webhook` (more detailed lifecycle)
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS stripe_created_at timestamptz;
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS received_at timestamptz DEFAULT now();
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS status text DEFAULT 'received';
    ALTER TABLE public.stripe_webhook_events
      ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

    -- Backfill (safe no-ops if already populated)
    UPDATE public.stripe_webhook_events SET id = gen_random_uuid() WHERE id IS NULL;
    UPDATE public.stripe_webhook_events SET payload = '{}'::jsonb WHERE payload IS NULL;
    UPDATE public.stripe_webhook_events SET processed = false WHERE processed IS NULL;
    UPDATE public.stripe_webhook_events SET received_at = now() WHERE received_at IS NULL;
    UPDATE public.stripe_webhook_events SET status = 'received' WHERE status IS NULL;
    UPDATE public.stripe_webhook_events SET metadata = '{}'::jsonb WHERE metadata IS NULL;
    UPDATE public.stripe_webhook_events
      SET created_at = COALESCE(created_at, received_at, now())
      WHERE created_at IS NULL;

    -- Ensure event_id can be used for idempotent upserts (onConflict: 'event_id')
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id_unique ON public.stripe_webhook_events(event_id)';

    -- Add a status check constraint if absent (keeps status values sane)
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'stripe_webhook_events_status_check'
        AND conrelid = 'public.stripe_webhook_events'::regclass
    ) THEN
      BEGIN
        ALTER TABLE public.stripe_webhook_events
          ADD CONSTRAINT stripe_webhook_events_status_check
          CHECK (status IN ('received', 'processing', 'processed', 'failed', 'skipped'));
      EXCEPTION WHEN others THEN
        -- If an incompatible constraint already exists (or permissions differ), keep going.
        NULL;
      END;
    END IF;

    -- Tighten NOT NULL where possible (ignore if blocked by existing data/constraints)
    BEGIN
      ALTER TABLE public.stripe_webhook_events ALTER COLUMN id SET NOT NULL;
    EXCEPTION WHEN others THEN
      NULL;
    END;

    BEGIN
      ALTER TABLE public.stripe_webhook_events ALTER COLUMN payload SET NOT NULL;
    EXCEPTION WHEN others THEN
      NULL;
    END;

    -- Ensure RLS is enabled (service role bypasses; clients remain locked down)
    ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- -----------------------------
-- device_tokens
-- -----------------------------
DO $$
BEGIN
  IF to_regclass('public.device_tokens') IS NOT NULL THEN
    -- Some parts of the app expect an is_active flag.
    ALTER TABLE public.device_tokens
      ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

    UPDATE public.device_tokens SET is_active = true WHERE is_active IS NULL;

    ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

