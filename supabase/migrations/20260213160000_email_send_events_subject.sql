-- Migration: Add subject to email_send_events (idempotent)
-- Purpose:
-- - Persist subjects for admin email log UX (EmailManagement panel).
-- - Preserve campaign-linked subjects while supporting one-off sends.

ALTER TABLE public.email_send_events
  ADD COLUMN IF NOT EXISTS subject TEXT;

CREATE INDEX IF NOT EXISTS idx_email_send_events_subject ON public.email_send_events(subject);

