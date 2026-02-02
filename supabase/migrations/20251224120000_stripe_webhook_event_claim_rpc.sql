-- Stripe Webhook Idempotency: atomic claim RPC
-- Purpose:
-- - Prevent concurrent Stripe retries from processing the same event twice.
-- - Allow safe retries when prior processing failed.
-- Notes:
-- - Idempotent: CREATE OR REPLACE
-- - Locked down: only service_role can execute.

CREATE OR REPLACE FUNCTION public.claim_stripe_webhook_event(
  _event_id TEXT,
  _event_type TEXT,
  _stripe_created_at TIMESTAMPTZ,
  _metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed BOOLEAN := FALSE;
  affected_rows INTEGER := 0;
BEGIN
  -- If the idempotency ledger isn't present (older env), allow processing.
  IF to_regclass('public.stripe_webhook_events') IS NULL THEN
    RETURN TRUE;
  END IF;

  -- First writer wins: insert "processing" row for this event_id.
  INSERT INTO public.stripe_webhook_events (
    event_id,
    event_type,
    stripe_created_at,
    received_at,
    status,
    metadata
  )
  VALUES (
    _event_id,
    _event_type,
    _stripe_created_at,
    NOW(),
    'processing',
    COALESCE(_metadata, '{}'::jsonb)
  )
  ON CONFLICT (event_id) DO NOTHING;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  claimed := affected_rows > 0;
  IF claimed THEN
    RETURN TRUE;
  END IF;

  -- If it already exists, only allow re-claim when status indicates incomplete work.
  UPDATE public.stripe_webhook_events
    SET status = 'processing',
        processed_at = NULL,
        error_message = NULL
  WHERE event_id = _event_id
    AND status IN ('received', 'failed');

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  claimed := affected_rows > 0;
  RETURN claimed;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_stripe_webhook_event(TEXT, TEXT, TIMESTAMPTZ, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_stripe_webhook_event(TEXT, TEXT, TIMESTAMPTZ, JSONB) TO service_role;

