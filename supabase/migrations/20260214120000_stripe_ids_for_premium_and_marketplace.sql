-- Add Stripe catalog identifiers for non-DLC commerce tables.
-- Goal: avoid inline price_data in Stripe Checkout for live mode.
--
-- Idempotent (safe to rerun).

-- Premium Content Marketplace
ALTER TABLE public.premium_content_items
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

ALTER TABLE public.premium_content_items
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

CREATE INDEX IF NOT EXISTS idx_premium_content_items_stripe_product_id
  ON public.premium_content_items (stripe_product_id);

CREATE INDEX IF NOT EXISTS idx_premium_content_items_stripe_price_id
  ON public.premium_content_items (stripe_price_id);

-- Generic Marketplace
ALTER TABLE public.marketplace_items
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

ALTER TABLE public.marketplace_items
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

CREATE INDEX IF NOT EXISTS idx_marketplace_items_stripe_product_id
  ON public.marketplace_items (stripe_product_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_items_stripe_price_id
  ON public.marketplace_items (stripe_price_id);

-- Routine Marketplace
ALTER TABLE public.routine_marketplace
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

ALTER TABLE public.routine_marketplace
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

CREATE INDEX IF NOT EXISTS idx_routine_marketplace_stripe_product_id
  ON public.routine_marketplace (stripe_product_id);

CREATE INDEX IF NOT EXISTS idx_routine_marketplace_stripe_price_id
  ON public.routine_marketplace (stripe_price_id);

