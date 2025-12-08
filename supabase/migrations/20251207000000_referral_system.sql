-- Migration: Referral System
-- Creates tables for referral program tracking and rewards

-- Referral Codes Table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  max_uses INTEGER, -- NULL = unlimited
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral Tracking Table
CREATE TABLE IF NOT EXISTS referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded', 'expired')),
  reward_type TEXT CHECK (reward_type IN ('discount', 'free_month', 'credit', 'badge')),
  reward_value DECIMAL(10, 2),
  reward_applied BOOLEAN DEFAULT false,
  referred_subscribed BOOLEAN DEFAULT false,
  referred_subscription_tier TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  rewarded_at TIMESTAMP WITH TIME ZONE
);

-- Referral Rewards History
CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_tracking_id UUID NOT NULL REFERENCES referral_tracking(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_value DECIMAL(10, 2) NOT NULL,
  reward_status TEXT NOT NULL DEFAULT 'pending' CHECK (reward_status IN ('pending', 'applied', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_is_active ON referral_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON referral_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred ON referral_tracking(referred_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_status ON referral_tracking(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(reward_status);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view own referral codes" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral codes" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own referral codes" ON referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active referral codes for validation" ON referral_codes
  FOR SELECT USING (is_active = true);

-- RLS Policies for referral_tracking
CREATE POLICY "Users can view own referral tracking" ON referral_tracking
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Service role can manage referral tracking" ON referral_tracking
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view own rewards" ON referral_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage rewards" ON referral_rewards
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || NOW()::TEXT) 
        FROM 1 FOR 8
      )
    );
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_codes.code = generate_referral_code.code) INTO exists_check;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to update referral tracking when user subscribes
CREATE OR REPLACE FUNCTION update_referral_on_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user was referred
  UPDATE referral_tracking
  SET 
    referred_subscribed = true,
    referred_subscription_tier = NEW.status,
    status = CASE 
      WHEN status = 'pending' THEN 'completed'
      ELSE status
    END,
    completed_at = CASE 
      WHEN status = 'pending' THEN NOW()
      ELSE completed_at
    END
  WHERE referred_id = NEW.user_id 
    AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update referral tracking on subscription
CREATE TRIGGER trigger_update_referral_on_subscription
  AFTER INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION update_referral_on_subscription();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_referral_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_referral_codes_updated_at
  BEFORE UPDATE ON referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_updated_at();

