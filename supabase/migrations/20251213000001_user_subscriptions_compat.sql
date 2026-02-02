-- =============================================
-- user_subscriptions compatibility + forward schema
-- Migration: 20251213000001_user_subscriptions_compat.sql
-- Description: Ensures columns referenced by app + webhooks exist (idempotent)
-- =============================================

ALTER TABLE IF EXISTS public.user_subscriptions
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT,
  ADD COLUMN IF NOT EXISTS plan_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Helpful indexes (safe to re-run)
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_price_id ON public.user_subscriptions(stripe_price_id);

