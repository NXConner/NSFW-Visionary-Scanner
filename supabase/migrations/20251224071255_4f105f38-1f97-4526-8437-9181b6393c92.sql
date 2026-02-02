-- Create beta_testers table for managing beta access
CREATE TABLE IF NOT EXISTS public.beta_testers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    email text NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    expires_at timestamptz,
    granted_by uuid,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_testers ENABLE ROW LEVEL SECURITY;

-- Users can view their own beta status
CREATE POLICY "Users can view own beta status"
ON public.beta_testers
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all beta testers (using existing has_role function)
CREATE POLICY "Admins can manage beta testers"
ON public.beta_testers
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_beta_testers_user_id ON public.beta_testers(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_testers_email ON public.beta_testers(email);

-- Add updated_at trigger
CREATE TRIGGER update_beta_testers_updated_at
    BEFORE UPDATE ON public.beta_testers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();