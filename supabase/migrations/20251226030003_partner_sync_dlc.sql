-- Partner Sync DLC ($24.99/month)
-- Collaborative tracking and shared dashboards for couples

-- Create partner connections table
CREATE TABLE IF NOT EXISTS public.partner_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  invitation_code TEXT UNIQUE,
  invitation_expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, partner_id),
  CHECK (user_id != partner_id)
);

-- Ensure partner_connections has partner_id when table pre-exists
ALTER TABLE public.partner_connections
  ADD COLUMN IF NOT EXISTS partner_id UUID;

DO $$
BEGIN
  IF to_regclass('public.partner_connections') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'partner_connections_partner_id_fkey'
    ) THEN
      ALTER TABLE public.partner_connections
        ADD CONSTRAINT partner_connections_partner_id_fkey
        FOREIGN KEY (partner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

ALTER TABLE public.partner_connections
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE public.partner_connections
  ADD COLUMN IF NOT EXISTS invitation_code TEXT;

ALTER TABLE public.partner_connections
  ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMPTZ;

ALTER TABLE public.partner_connections
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

ALTER TABLE public.partner_connections
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.partner_connections
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF to_regclass('public.partner_connections') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'partner_connections_status_check'
    ) THEN
      ALTER TABLE public.partner_connections
        ADD CONSTRAINT partner_connections_status_check
        CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')) NOT VALID;
    END IF;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_connections_invitation_code_unique
  ON public.partner_connections(invitation_code)
  WHERE invitation_code IS NOT NULL;

-- Create shared data permissions table
CREATE TABLE IF NOT EXISTS public.partner_data_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL CHECK (data_type IN ('scans', 'wellness_scores', 'diary_entries', 'goals', 'progress_photos', 'all')),
  can_view BOOLEAN DEFAULT FALSE,
  can_comment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, user_id, data_type)
);

-- Create shared activities table
CREATE TABLE IF NOT EXISTS public.partner_shared_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('scan', 'diary_entry', 'goal_update', 'wellness_score', 'achievement')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_reference UUID, -- Reference to the actual data (scan_id, diary_id, etc.)
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner comments table
CREATE TABLE IF NOT EXISTS public.partner_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.partner_shared_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner comparison data table
CREATE TABLE IF NOT EXISTS public.partner_comparison_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('wellness_score', 'scan_measurement', 'goal_progress', 'activity_frequency')),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user1_value DECIMAL,
  user2_value DECIMAL,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partner sync settings table
CREATE TABLE IF NOT EXISTS public.partner_sync_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE UNIQUE,
  real_time_sync BOOLEAN DEFAULT TRUE,
  notification_preferences JSONB DEFAULT '{"new_activity": true, "comments": true, "achievements": true}'::jsonb,
  privacy_mode TEXT DEFAULT 'selective' CHECK (privacy_mode IN ('open', 'selective', 'minimal')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_connections_user_id ON public.partner_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_connections_partner_id ON public.partner_connections(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_connections_status ON public.partner_connections(status);
CREATE INDEX IF NOT EXISTS idx_partner_data_permissions_connection_id ON public.partner_data_permissions(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_shared_activities_connection_id ON public.partner_shared_activities(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_shared_activities_created_at ON public.partner_shared_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_comments_activity_id ON public.partner_comments(activity_id);

-- Enable RLS
ALTER TABLE public.partner_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_data_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_shared_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_comparison_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sync_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their partner connections" ON public.partner_connections
  FOR ALL USING (auth.uid() = user_id OR auth.uid() = partner_id);

CREATE POLICY "Users can manage permissions for their connections" ON public.partner_data_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_connections
      WHERE id = partner_data_permissions.connection_id
      AND (user_id = auth.uid() OR partner_id = auth.uid())
    )
  );

CREATE POLICY "Users can view shared activities" ON public.partner_shared_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_connections
      WHERE id = partner_shared_activities.connection_id
      AND (user_id = auth.uid() OR partner_id = auth.uid())
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can add comments to shared activities" ON public.partner_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_connections pc
      JOIN public.partner_shared_activities psa ON pc.id = psa.connection_id
      WHERE psa.id = partner_comments.activity_id
      AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
      AND pc.status = 'accepted'
    )
  );

CREATE POLICY "Users can view comparison data" ON public.partner_comparison_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_connections
      WHERE id = partner_comparison_data.connection_id
      AND (user_id = auth.uid() OR partner_id = auth.uid())
      AND status = 'accepted'
    )
  );

CREATE POLICY "Users can manage sync settings for their connections" ON public.partner_sync_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_connections
      WHERE id = partner_sync_settings.connection_id
      AND (user_id = auth.uid() OR partner_id = auth.uid())
    )
  );

COMMENT ON TABLE public.partner_connections IS 'Partner Sync DLC: Partner connection management';
COMMENT ON TABLE public.partner_data_permissions IS 'Partner Sync DLC: Data sharing permissions';
COMMENT ON TABLE public.partner_shared_activities IS 'Partner Sync DLC: Shared activity feed';
COMMENT ON TABLE public.partner_comparison_data IS 'Partner Sync DLC: Comparative analytics';
