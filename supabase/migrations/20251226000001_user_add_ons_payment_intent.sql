-- Migration: Track Stripe payment intent for add-ons
-- Enables reliable refund/chargeback revocation for one-time ("lifetime") add-ons.

ALTER TABLE IF EXISTS user_add_ons
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_user_add_ons_payment_intent_id
  ON user_add_ons(stripe_payment_intent_id);

