-- Create webhooks table with proper structure
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  webhook_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT NOT NULL,
  subscribed_events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  max_retries INTEGER NOT NULL DEFAULT 3,
  retry_delay_seconds INTEGER NOT NULL DEFAULT 60,
  total_deliveries INTEGER NOT NULL DEFAULT 0,
  successful_deliveries INTEGER NOT NULL DEFAULT 0,
  failed_deliveries INTEGER NOT NULL DEFAULT 0,
  last_delivery_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on webhooks table
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;

-- Users can only view their own webhooks
CREATE POLICY "Users can view their own webhooks"
ON public.webhooks
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert webhooks for themselves
CREATE POLICY "Users can create their own webhooks"
ON public.webhooks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own webhooks
CREATE POLICY "Users can update their own webhooks"
ON public.webhooks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own webhooks
CREATE POLICY "Users can delete their own webhooks"
ON public.webhooks
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON public.webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();