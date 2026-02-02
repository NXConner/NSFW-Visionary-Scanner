-- Create referral_codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER NULL,
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral_tracking table
CREATE TABLE IF NOT EXISTS public.referral_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id),
  status TEXT NOT NULL DEFAULT 'pending',
  reward_type TEXT NULL,
  reward_value NUMERIC NULL,
  reward_applied BOOLEAN NOT NULL DEFAULT false,
  referred_subscribed BOOLEAN NOT NULL DEFAULT false,
  referred_subscription_tier TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  rewarded_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  referral_tracking_id UUID NOT NULL REFERENCES public.referral_tracking(id),
  reward_type TEXT NOT NULL,
  reward_value NUMERIC NOT NULL,
  reward_status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NULL,
  applied_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral_codes
DROP POLICY IF EXISTS "Users can view their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can create their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can update their own referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can view their referral tracking" ON public.referral_tracking;
DROP POLICY IF EXISTS "System can insert referral tracking" ON public.referral_tracking;
DROP POLICY IF EXISTS "Users can view their own rewards" ON public.referral_rewards;
DROP POLICY IF EXISTS "System can insert rewards" ON public.referral_rewards;

CREATE POLICY "Users can view their own referral codes" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" ON public.referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for referral_tracking
CREATE POLICY "Users can view their referral tracking" ON public.referral_tracking
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referral tracking" ON public.referral_tracking
  FOR INSERT WITH CHECK (true);

-- RLS policies for referral_rewards
CREATE POLICY "Users can view their own rewards" ON public.referral_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert rewards" ON public.referral_rewards
  FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON public.referral_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred ON public.referral_tracking(referred_id);