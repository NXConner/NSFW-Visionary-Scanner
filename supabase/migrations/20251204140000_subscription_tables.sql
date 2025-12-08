-- Create user_subscriptions table for Stripe integration
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_history table for tracking payments
CREATE TABLE public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  stripe_invoice_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for payment_history
CREATE POLICY "Users can view own payment history" ON public.payment_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment history" ON public.payment_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for updating updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscription_updated_at();

-- Function to automatically set user_id from stripe_customer_id
CREATE OR REPLACE FUNCTION public.set_subscription_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is not set but we have a stripe_customer_id,
  -- try to find the user from the customer metadata
  IF NEW.user_id IS NULL AND NEW.stripe_customer_id IS NOT NULL THEN
    -- This would be populated by the webhook or checkout completion
    -- For now, we'll require user_id to be set explicitly
    RAISE EXCEPTION 'user_id must be provided for subscription records';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to ensure user_id is set
CREATE TRIGGER set_subscription_user_id_trigger
  BEFORE INSERT ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_subscription_user_id();
