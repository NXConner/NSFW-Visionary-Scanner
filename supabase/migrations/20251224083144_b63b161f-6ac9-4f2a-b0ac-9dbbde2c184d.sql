-- Create admin_dlc_package_toggles table for storing admin DLC visibility preferences
CREATE TABLE IF NOT EXISTS public.admin_dlc_package_toggles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    package_id text NOT NULL,
    is_enabled boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, package_id)
);

-- Enable RLS
ALTER TABLE public.admin_dlc_package_toggles ENABLE ROW LEVEL SECURITY;

-- Users can view their own toggles
CREATE POLICY "Users can view own toggles"
ON public.admin_dlc_package_toggles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage their own toggles
CREATE POLICY "Admins can manage own toggles"
ON public.admin_dlc_package_toggles
FOR ALL
USING (auth.uid() = user_id AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_dlc_toggles_user_id ON public.admin_dlc_package_toggles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_dlc_toggles_package_id ON public.admin_dlc_package_toggles(package_id);

-- Add updated_at trigger
CREATE TRIGGER update_admin_dlc_package_toggles_updated_at
    BEFORE UPDATE ON public.admin_dlc_package_toggles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();