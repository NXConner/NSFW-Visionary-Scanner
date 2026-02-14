-- Migration: Broadcast notifications (admin + user feed)
-- Replaces hardcoded sample data in AdminNotificationsPanel with real, persisted notifications.
-- Provides:
--  - app_broadcast_notifications: admin-authored announcements/alerts
--  - app_broadcast_notification_reads: per-user read receipts for read-rate metrics
--  - helper functions for premium/audience gating inside RLS (fail-closed)

-- ======= Helpers =======

-- Premium definition used for notification audience gating.
-- SECURITY DEFINER so RLS policies can safely evaluate against subscription tables.
CREATE OR REPLACE FUNCTION public.is_premium_user(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Privileged users are always treated as premium.
  IF public.has_role(_user_id, 'super_admin'::public.app_role)
     OR public.has_role(_user_id, 'admin'::public.app_role) THEN
    RETURN true;
  END IF;

  -- If the subscriptions table isn't present in this environment, fail-closed.
  IF to_regclass('public.user_subscriptions') IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_subscriptions us
    WHERE us.user_id = _user_id
      AND lower(coalesce(us.status, '')) IN ('active', 'trialing', 'past_due')
      AND (us.current_period_end IS NULL OR us.current_period_end > (now() - interval '1 day'))
  );
END;
$$;

-- Centralized audience predicate (used by RLS and by clients inserting read receipts).
CREATE OR REPLACE FUNCTION public.can_user_view_broadcast_notification(
  _notification_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_broadcast_notifications n
    WHERE n.id = _notification_id
      AND n.is_deleted = false
      AND n.status = 'sent'
      AND n.sent_at IS NOT NULL
      AND n.sent_at <= now()
      AND (
        n.audience = 'all'
        OR (n.audience = 'premium' AND public.is_premium_user(_user_id))
        OR (n.audience = 'free' AND NOT public.is_premium_user(_user_id))
        OR (n.audience = 'specific' AND _user_id = ANY(n.audience_user_ids))
      )
  );
$$;

-- ======= Tables =======

CREATE TABLE IF NOT EXISTS public.app_broadcast_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),

  audience text NOT NULL CHECK (audience IN ('all', 'premium', 'free', 'specific')),
  audience_user_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],

  -- Delivery channels (admin UI can toggle; in-app delivery is implemented via row visibility).
  channels jsonb NOT NULL DEFAULT '{"in_app": true, "push": false, "email": false}'::jsonb,

  status text NOT NULL CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
  scheduled_for timestamptz,
  sent_at timestamptz,

  -- Metrics computed at send time (or updated by scheduled dispatcher).
  target_count integer NOT NULL DEFAULT 0,
  read_count integer NOT NULL DEFAULT 0,
  last_error text,

  -- Soft delete (keeps audit trail without exposing to users).
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_broadcast_notifications_status
  ON public.app_broadcast_notifications(status);
CREATE INDEX IF NOT EXISTS idx_app_broadcast_notifications_sent_at
  ON public.app_broadcast_notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_broadcast_notifications_scheduled_for
  ON public.app_broadcast_notifications(scheduled_for ASC);
CREATE INDEX IF NOT EXISTS idx_app_broadcast_notifications_is_deleted
  ON public.app_broadcast_notifications(is_deleted);

ALTER TABLE public.app_broadcast_notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.app_broadcast_notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.app_broadcast_notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_app_broadcast_notification_reads_notification_id
  ON public.app_broadcast_notification_reads(notification_id);
CREATE INDEX IF NOT EXISTS idx_app_broadcast_notification_reads_user_id
  ON public.app_broadcast_notification_reads(user_id);

ALTER TABLE public.app_broadcast_notification_reads ENABLE ROW LEVEL SECURITY;

-- ======= Policies =======

-- Admin management policies
DROP POLICY IF EXISTS "Admins manage broadcast notifications" ON public.app_broadcast_notifications;
CREATE POLICY "Admins manage broadcast notifications"
  ON public.app_broadcast_notifications
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- User visibility policy (sent notifications only; audience-gated; fail-closed)
DROP POLICY IF EXISTS "Users can view applicable broadcast notifications" ON public.app_broadcast_notifications;
CREATE POLICY "Users can view applicable broadcast notifications"
  ON public.app_broadcast_notifications
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND public.can_user_view_broadcast_notification(id, auth.uid())
  );

-- Read receipts: users can read/mark their own receipt rows for visible notifications
DROP POLICY IF EXISTS "Users can view own broadcast notification reads" ON public.app_broadcast_notification_reads;
CREATE POLICY "Users can view own broadcast notification reads"
  ON public.app_broadcast_notification_reads
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own broadcast notification reads" ON public.app_broadcast_notification_reads;
CREATE POLICY "Users can create own broadcast notification reads"
  ON public.app_broadcast_notification_reads
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.can_user_view_broadcast_notification(notification_id, auth.uid())
  );

DROP POLICY IF EXISTS "Admins can view all broadcast notification reads" ON public.app_broadcast_notification_reads;
CREATE POLICY "Admins can view all broadcast notification reads"
  ON public.app_broadcast_notification_reads
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- ======= Triggers =======

-- Maintain updated_at on notification updates (idempotent trigger creation).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_app_broadcast_notifications_updated_at'
  ) THEN
    CREATE TRIGGER trg_app_broadcast_notifications_updated_at
      BEFORE UPDATE ON public.app_broadcast_notifications
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Increment read_count on first read receipt insert (unique prevents double increments).
CREATE OR REPLACE FUNCTION public.bump_broadcast_notification_read_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.app_broadcast_notifications
  SET read_count = read_count + 1,
      updated_at = now()
  WHERE id = NEW.notification_id;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_app_broadcast_notification_reads_bump_count'
  ) THEN
    CREATE TRIGGER trg_app_broadcast_notification_reads_bump_count
      AFTER INSERT ON public.app_broadcast_notification_reads
      FOR EACH ROW
      EXECUTE FUNCTION public.bump_broadcast_notification_read_count();
  END IF;
END $$;

