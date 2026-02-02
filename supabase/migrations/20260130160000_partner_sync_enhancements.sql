-- Partner Sync Enhancements: preferences, templates, audit, retention, date plan items

-- ==================== Partner Thought Ping Enhancements ====================
ALTER TABLE public.partner_thought_pings
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_state TEXT DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS read_receipt_requested BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS private_note_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS images_urls TEXT[],
  ADD COLUMN IF NOT EXISTS gifs_urls TEXT[],
  ADD COLUMN IF NOT EXISTS voice_message_url TEXT,
  ADD COLUMN IF NOT EXISTS quick_reply_used TEXT,
  ADD COLUMN IF NOT EXISTS reaction_summary JSONB DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'partner_thought_pings_status_check'
  ) THEN
    ALTER TABLE public.partner_thought_pings DROP CONSTRAINT partner_thought_pings_status_check;
  END IF;
END $$;

ALTER TABLE public.partner_thought_pings
  ADD CONSTRAINT partner_thought_pings_status_check
  CHECK (status IN ('sent', 'read', 'archived', 'responded', 'scheduled'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_thought_pings_priority_check'
  ) THEN
    ALTER TABLE public.partner_thought_pings
      ADD CONSTRAINT partner_thought_pings_priority_check
      CHECK (priority IN ('normal', 'high'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_thought_pings_delivery_state_check'
  ) THEN
    ALTER TABLE public.partner_thought_pings
      ADD CONSTRAINT partner_thought_pings_delivery_state_check
      CHECK (delivery_state IN ('queued', 'delivered', 'failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_scheduled_at
  ON public.partner_thought_pings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_delivery_state
  ON public.partner_thought_pings(delivery_state);
CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_priority
  ON public.partner_thought_pings(priority);

-- Reactions
CREATE TABLE IF NOT EXISTS public.partner_thought_ping_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ping_id UUID NOT NULL REFERENCES public.partner_thought_pings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ping_id, user_id, emoji)
);

ALTER TABLE public.partner_thought_ping_reactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_thought_ping_reactions'
      AND policyname = 'Partner ping reactions access'
  ) THEN
    CREATE POLICY "Partner ping reactions access"
      ON public.partner_thought_ping_reactions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_thought_pings ptp
          JOIN public.partner_connections pc ON pc.id = ptp.connection_id
          WHERE ptp.id = partner_thought_ping_reactions.ping_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.partner_thought_pings ptp
          JOIN public.partner_connections pc ON pc.id = ptp.connection_id
          WHERE ptp.id = partner_thought_ping_reactions.ping_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;
END $$;

-- Thought ping templates
CREATE TABLE IF NOT EXISTS public.partner_thought_ping_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  detailed_message TEXT,
  tone_tags TEXT[] DEFAULT '{}'::text[],
  intensity TEXT DEFAULT 'medium' CHECK (intensity IN ('soft', 'playful', 'medium', 'intense', 'wild')),
  theme TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_thought_ping_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_thought_ping_templates'
      AND policyname = 'Users manage own ping templates'
  ) THEN
    CREATE POLICY "Users manage own ping templates"
      ON public.partner_thought_ping_templates
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Quick reply templates
CREATE TABLE IF NOT EXISTS public.partner_quick_reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  message TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_quick_reply_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_quick_reply_templates'
      AND policyname = 'Users manage own quick replies'
  ) THEN
    CREATE POLICY "Users manage own quick replies"
      ON public.partner_quick_reply_templates
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ==================== Partner Sync Preferences ====================
CREATE TABLE IF NOT EXISTS public.partner_sync_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  timezone TEXT DEFAULT 'UTC',
  rate_limit_per_hour INTEGER DEFAULT 12,
  allow_push_notifications BOOLEAN DEFAULT true,
  allow_scheduled_pings BOOLEAN DEFAULT true,
  allow_media BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_sync_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_preferences'
      AND policyname = 'Users manage own sync preferences'
  ) THEN
    CREATE POLICY "Users manage own sync preferences"
      ON public.partner_sync_preferences
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ==================== Partner Sync Consent ====================
CREATE TABLE IF NOT EXISTS public.partner_sync_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, user_id, consent_version)
);

ALTER TABLE public.partner_sync_consent ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_consent'
      AND policyname = 'Partner consent access'
  ) THEN
    CREATE POLICY "Partner consent access"
      ON public.partner_sync_consent
      FOR ALL
      USING (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_sync_consent.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
        )
      )
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ==================== Partner Sync Events & Audit ====================
CREATE TABLE IF NOT EXISTS public.partner_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_sync_events_connection_id
  ON public.partner_sync_events(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_sync_events_actor_id
  ON public.partner_sync_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_partner_sync_events_created_at
  ON public.partner_sync_events(created_at DESC);

CREATE TABLE IF NOT EXISTS public.partner_sync_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_sync_audit_connection_id
  ON public.partner_sync_audit_log(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_sync_audit_actor_id
  ON public.partner_sync_audit_log(actor_id);

ALTER TABLE public.partner_sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sync_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_events'
      AND policyname = 'Partner sync events access'
  ) THEN
    CREATE POLICY "Partner sync events access"
      ON public.partner_sync_events
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_sync_events.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_events'
      AND policyname = 'Partner sync events insert'
  ) THEN
    CREATE POLICY "Partner sync events insert"
      ON public.partner_sync_events
      FOR INSERT
      WITH CHECK (actor_id = auth.uid());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_audit_log'
      AND policyname = 'Partner audit log access'
  ) THEN
    CREATE POLICY "Partner audit log access"
      ON public.partner_sync_audit_log
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_sync_audit_log.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
        )
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'super_admin')
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_audit_log'
      AND policyname = 'Partner audit log insert'
  ) THEN
    CREATE POLICY "Partner audit log insert"
      ON public.partner_sync_audit_log
      FOR INSERT
      WITH CHECK (actor_id = auth.uid());
  END IF;
END $$;

-- ==================== Partner Sync Abuse Signals ====================
CREATE TABLE IF NOT EXISTS public.partner_sync_abuse_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES public.partner_connections(id) ON DELETE SET NULL,
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_sync_abuse_signals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_abuse_signals'
      AND policyname = 'Partner abuse signals access'
  ) THEN
    CREATE POLICY "Partner abuse signals access"
      ON public.partner_sync_abuse_signals
      FOR SELECT
      USING (
        auth.uid() = actor_id
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'super_admin')
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_abuse_signals'
      AND policyname = 'Partner abuse signals insert'
  ) THEN
    CREATE POLICY "Partner abuse signals insert"
      ON public.partner_sync_abuse_signals
      FOR INSERT
      WITH CHECK (actor_id = auth.uid());
  END IF;
END $$;

-- ==================== Partner Sync Retention Policies ====================
CREATE TABLE IF NOT EXISTS public.partner_sync_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  set_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retention_days_pings INTEGER DEFAULT 180,
  retention_days_selections INTEGER DEFAULT 365,
  retention_days_plans INTEGER DEFAULT 365,
  retention_days_events INTEGER DEFAULT 365,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id)
);

ALTER TABLE public.partner_sync_retention_policies ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_sync_retention_policies'
      AND policyname = 'Partner retention policies access'
  ) THEN
    CREATE POLICY "Partner retention policies access"
      ON public.partner_sync_retention_policies
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_sync_retention_policies.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_sync_retention_policies.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
        )
      );
  END IF;
END $$;

-- ==================== Partner Position Selection Enhancements ====================
ALTER TABLE public.partner_position_selections
  ADD COLUMN IF NOT EXISTS safety_checklist JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS constraints JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS availability_tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS boundary_tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS try_later BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS favorite_together BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tried_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS success_notes TEXT,
  ADD COLUMN IF NOT EXISTS success_tags TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS swap_group_id UUID,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS rating INTEGER,
  ADD COLUMN IF NOT EXISTS private_note_encrypted TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_position_priority_check'
  ) THEN
    ALTER TABLE public.partner_position_selections
      ADD CONSTRAINT partner_position_priority_check
      CHECK (priority IN ('normal', 'high'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partner_position_privacy_check'
  ) THEN
    ALTER TABLE public.partner_position_selections
      ADD CONSTRAINT partner_position_privacy_check
      CHECK (privacy_level IN ('private', 'shared', 'public'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'partner_position_selections_swap_group_id_fkey'
  ) THEN
    ALTER TABLE public.partner_position_selections
      ADD CONSTRAINT partner_position_selections_swap_group_id_fkey
      FOREIGN KEY (swap_group_id)
      REFERENCES public.partner_position_selections(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.partner_position_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.nsfw_positions_gallery(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('suggested', 'accepted', 'declined', 'tried', 'swap_requested', 'swap_accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_position_activity_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_position_activity_log'
      AND policyname = 'Partner position activity access'
  ) THEN
    CREATE POLICY "Partner position activity access"
      ON public.partner_position_activity_log
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_position_activity_log.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_position_activity_log'
      AND policyname = 'Partner position activity insert'
  ) THEN
    CREATE POLICY "Partner position activity insert"
      ON public.partner_position_activity_log
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ==================== Date Night Plan Items ====================
CREATE TABLE IF NOT EXISTS public.intimate_date_itinerary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  segment TEXT NOT NULL CHECK (segment IN ('night_out', 'dinner', 'night_in')),
  title TEXT NOT NULL,
  time TEXT,
  location TEXT,
  notes TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_itinerary_proposal
  ON public.intimate_date_itinerary_items(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  category TEXT DEFAULT 'prep' CHECK (category IN ('prep', 'during', 'aftercare')),
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_checklist_proposal
  ON public.intimate_date_checklist_items(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_packing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_packing_proposal
  ON public.intimate_date_packing_items(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_distractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_distractions_proposal
  ON public.intimate_date_distractions(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.nsfw_positions_gallery(id) ON DELETE SET NULL,
  position_label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_positions_proposal
  ON public.intimate_date_positions(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('reservation', 'travel', 'checkin', 'custom')),
  remind_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_reminders_proposal
  ON public.intimate_date_reminders(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_aftercare_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_aftercare_proposal
  ON public.intimate_date_aftercare_items(proposal_id);

CREATE TABLE IF NOT EXISTS public.intimate_date_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.intimate_date_proposals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intimate_date_reflections_proposal
  ON public.intimate_date_reflections(proposal_id);

ALTER TABLE public.intimate_date_itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_distractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_aftercare_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intimate_date_reflections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_itinerary_items'
      AND policyname = 'Partner date items access'
  ) THEN
    CREATE POLICY "Partner date items access"
      ON public.intimate_date_itinerary_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_itinerary_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_itinerary_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_checklist_items'
      AND policyname = 'Partner date checklist access'
  ) THEN
    CREATE POLICY "Partner date checklist access"
      ON public.intimate_date_checklist_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_checklist_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_checklist_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_packing_items'
      AND policyname = 'Partner date packing access'
  ) THEN
    CREATE POLICY "Partner date packing access"
      ON public.intimate_date_packing_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_packing_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_packing_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_distractions'
      AND policyname = 'Partner date distractions access'
  ) THEN
    CREATE POLICY "Partner date distractions access"
      ON public.intimate_date_distractions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_distractions.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_distractions.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_positions'
      AND policyname = 'Partner date positions access'
  ) THEN
    CREATE POLICY "Partner date positions access"
      ON public.intimate_date_positions
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_positions.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_positions.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_reminders'
      AND policyname = 'Partner date reminders access'
  ) THEN
    CREATE POLICY "Partner date reminders access"
      ON public.intimate_date_reminders
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_reminders.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_reminders.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_aftercare_items'
      AND policyname = 'Partner date aftercare access'
  ) THEN
    CREATE POLICY "Partner date aftercare access"
      ON public.intimate_date_aftercare_items
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_aftercare_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_aftercare_items.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'intimate_date_reflections'
      AND policyname = 'Partner date reflections access'
  ) THEN
    CREATE POLICY "Partner date reflections access"
      ON public.intimate_date_reflections
      FOR ALL
      USING (
        auth.uid() = user_id OR EXISTS (
          SELECT 1 FROM public.intimate_date_proposals p
          WHERE p.id = intimate_date_reflections.proposal_id
            AND (p.creator_id = auth.uid() OR p.partner_id = auth.uid())
        )
      )
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ==================== Updated_at Triggers ====================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_thought_pings_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_thought_pings_updated_at
      BEFORE UPDATE ON public.partner_thought_pings
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_position_selections_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_position_selections_updated_at
      BEFORE UPDATE ON public.partner_position_selections
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_sync_preferences_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_sync_preferences_updated_at
      BEFORE UPDATE ON public.partner_sync_preferences
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_thought_ping_templates_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_thought_ping_templates_updated_at
      BEFORE UPDATE ON public.partner_thought_ping_templates
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_quick_reply_templates_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_quick_reply_templates_updated_at
      BEFORE UPDATE ON public.partner_quick_reply_templates
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_sync_consent_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_sync_consent_updated_at
      BEFORE UPDATE ON public.partner_sync_consent
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_sync_retention_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_sync_retention_updated_at
      BEFORE UPDATE ON public.partner_sync_retention_policies
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_date_itinerary_updated_at'
  ) THEN
    CREATE TRIGGER trg_date_itinerary_updated_at
      BEFORE UPDATE ON public.intimate_date_itinerary_items
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_date_checklist_updated_at'
  ) THEN
    CREATE TRIGGER trg_date_checklist_updated_at
      BEFORE UPDATE ON public.intimate_date_checklist_items
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ==================== Stored Procedures ====================
CREATE OR REPLACE FUNCTION public.partner_sync_create_thought_ping(
  p_connection_id UUID,
  p_recipient_id UUID,
  p_message TEXT,
  p_detailed_message TEXT DEFAULT NULL,
  p_tone_tags TEXT[] DEFAULT '{}'::text[],
  p_intensity TEXT DEFAULT 'medium',
  p_theme TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal',
  p_is_pinned BOOLEAN DEFAULT false,
  p_read_receipt_requested BOOLEAN DEFAULT true,
  p_private_note_encrypted TEXT DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
  p_remind_at TIMESTAMPTZ DEFAULT NULL,
  p_images_urls TEXT[] DEFAULT NULL,
  p_gifs_urls TEXT[] DEFAULT NULL,
  p_voice_message_url TEXT DEFAULT NULL
) RETURNS public.partner_thought_pings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender UUID := auth.uid();
  v_rate_limit INTEGER := 12;
  v_count INTEGER := 0;
  v_now TIMESTAMPTZ := NOW();
  v_quiet_enabled BOOLEAN := false;
  v_quiet_start TIME;
  v_quiet_end TIME;
  v_timezone TEXT := 'UTC';
  v_local_time TIME;
  v_row public.partner_thought_pings;
BEGIN
  IF v_sender IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.partner_connections pc
    WHERE pc.id = p_connection_id
      AND (pc.user_id = v_sender OR pc.partner_id = v_sender)
      AND pc.status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Connection not active';
  END IF;

  SELECT rate_limit_per_hour, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone
    INTO v_rate_limit, v_quiet_enabled, v_quiet_start, v_quiet_end, v_timezone
  FROM public.partner_sync_preferences
  WHERE user_id = p_recipient_id;

  v_rate_limit := COALESCE(v_rate_limit, 12);
  v_quiet_enabled := COALESCE(v_quiet_enabled, false);
  v_timezone := COALESCE(v_timezone, 'UTC');

  IF p_message IS NULL OR length(trim(p_message)) = 0 THEN
    RAISE EXCEPTION 'Message required';
  END IF;

  IF v_quiet_enabled AND p_scheduled_at IS NULL THEN
    v_local_time := (v_now AT TIME ZONE v_timezone)::time;
    IF v_quiet_start < v_quiet_end THEN
      IF v_local_time BETWEEN v_quiet_start AND v_quiet_end THEN
        RAISE EXCEPTION 'Recipient quiet hours enabled';
      END IF;
    ELSE
      IF v_local_time >= v_quiet_start OR v_local_time <= v_quiet_end THEN
        RAISE EXCEPTION 'Recipient quiet hours enabled';
      END IF;
    END IF;
  END IF;

  SELECT COUNT(1) INTO v_count
  FROM public.partner_thought_pings
  WHERE sender_id = v_sender
    AND created_at >= (v_now - INTERVAL '1 hour');

  IF v_count >= v_rate_limit THEN
    INSERT INTO public.partner_sync_abuse_signals(connection_id, actor_id, signal_type, severity, metadata)
    VALUES (p_connection_id, v_sender, 'ping_rate_limit', 'medium', jsonb_build_object('count', v_count));
    RAISE EXCEPTION 'Rate limit exceeded';
  END IF;

  INSERT INTO public.partner_thought_pings (
    connection_id,
    sender_id,
    recipient_id,
    tone_tags,
    intensity,
    theme,
    message,
    detailed_message,
    status,
    delivery_state,
    priority,
    is_pinned,
    read_receipt_requested,
    private_note_encrypted,
    scheduled_at,
    remind_at,
    images_urls,
    gifs_urls,
    voice_message_url,
    created_at,
    updated_at
  ) VALUES (
    p_connection_id,
    v_sender,
    p_recipient_id,
    COALESCE(p_tone_tags, '{}'::text[]),
    p_intensity,
    p_theme,
    p_message,
    p_detailed_message,
    CASE WHEN p_scheduled_at IS NOT NULL AND p_scheduled_at > v_now THEN 'scheduled' ELSE 'sent' END,
    CASE WHEN p_scheduled_at IS NOT NULL AND p_scheduled_at > v_now THEN 'queued' ELSE 'delivered' END,
    p_priority,
    p_is_pinned,
    p_read_receipt_requested,
    p_private_note_encrypted,
    p_scheduled_at,
    p_remind_at,
    p_images_urls,
    p_gifs_urls,
    p_voice_message_url,
    v_now,
    v_now
  ) RETURNING * INTO v_row;

  INSERT INTO public.partner_sync_events(connection_id, actor_id, event_type, metadata)
  VALUES (p_connection_id, v_sender, 'thought_ping_sent', jsonb_build_object('ping_id', v_row.id));

  RETURN v_row;
END $$;

CREATE OR REPLACE FUNCTION public.partner_sync_create_date_plan(
  p_partner_id UUID,
  p_title TEXT,
  p_date DATE,
  p_time TIME,
  p_location_name TEXT DEFAULT NULL,
  p_location_address TEXT DEFAULT NULL,
  p_location_type TEXT DEFAULT 'home',
  p_is_location_private BOOLEAN DEFAULT true,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_activities JSONB DEFAULT '{}'::jsonb,
  p_positions TEXT[] DEFAULT '{}'::text[],
  p_message TEXT DEFAULT NULL,
  p_special_requests TEXT DEFAULT NULL,
  p_itinerary JSONB DEFAULT '[]'::jsonb,
  p_checklist TEXT[] DEFAULT '{}'::text[],
  p_packing_list TEXT[] DEFAULT '{}'::text[],
  p_distractions TEXT[] DEFAULT '{}'::text[],
  p_aftercare TEXT[] DEFAULT '{}'::text[],
  p_budget NUMERIC DEFAULT NULL,
  p_travel_minutes INTEGER DEFAULT NULL,
  p_reminders JSONB DEFAULT '[]'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_conn public.partner_connections;
  v_proposal_id UUID;
  v_idx INTEGER := 0;
  v_item JSONB;
  v_text TEXT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_conn
  FROM public.partner_connections
  WHERE ((user_id = v_user AND partner_id = p_partner_id)
     OR (user_id = p_partner_id AND partner_id = v_user))
    AND status = 'accepted'
  LIMIT 1;

  IF v_conn.id IS NULL THEN
    RAISE EXCEPTION 'No active connection';
  END IF;

  INSERT INTO public.intimate_date_proposals (
    creator_id,
    partner_id,
    proposal_title,
    proposed_date,
    proposed_time,
    location_name,
    location_address,
    location_type,
    is_location_private,
    duration_minutes,
    activities,
    specialty_intimacy,
    text_message,
    special_requests,
    proposal_status,
    created_at,
    updated_at
  ) VALUES (
    v_user,
    p_partner_id,
    p_title,
    p_date,
    p_time,
    p_location_name,
    p_location_address,
    p_location_type,
    p_is_location_private,
    p_duration_minutes,
    jsonb_set(
      jsonb_set(p_activities, '{budget}', to_jsonb(p_budget), true),
      '{travel_minutes}', to_jsonb(p_travel_minutes), true
    ),
    p_positions,
    p_message,
    p_special_requests,
    'pending',
    NOW(),
    NOW()
  ) RETURNING id INTO v_proposal_id;

  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_itinerary)
  LOOP
    INSERT INTO public.intimate_date_itinerary_items (
      proposal_id, created_by, segment, title, time, location, notes, order_index
    ) VALUES (
      v_proposal_id,
      v_user,
      COALESCE(v_item->>'segment', 'dinner'),
      COALESCE(v_item->>'title', ''),
      v_item->>'time',
      v_item->>'location',
      v_item->>'notes',
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_reminders)
  LOOP
    IF (v_item->>'remindAt') IS NOT NULL AND length(v_item->>'remindAt') > 0 THEN
      INSERT INTO public.intimate_date_reminders (
        proposal_id, created_by, reminder_type, remind_at, notes
      ) VALUES (
        v_proposal_id,
        v_user,
        COALESCE(v_item->>'reminderType', 'custom'),
        (v_item->>'remindAt')::timestamptz,
        v_item->>'notes'
      );
    END IF;
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOREACH v_text IN ARRAY p_checklist
  LOOP
    INSERT INTO public.intimate_date_checklist_items (
      proposal_id, created_by, item, category, order_index
    ) VALUES (
      v_proposal_id,
      v_user,
      v_text,
      'prep',
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOREACH v_text IN ARRAY p_packing_list
  LOOP
    INSERT INTO public.intimate_date_packing_items (
      proposal_id, created_by, item, order_index
    ) VALUES (
      v_proposal_id,
      v_user,
      v_text,
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOREACH v_text IN ARRAY p_distractions
  LOOP
    INSERT INTO public.intimate_date_distractions (
      proposal_id, created_by, label
    ) VALUES (
      v_proposal_id,
      v_user,
      v_text
    );
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOREACH v_text IN ARRAY p_aftercare
  LOOP
    INSERT INTO public.intimate_date_aftercare_items (
      proposal_id, created_by, item, order_index
    ) VALUES (
      v_proposal_id,
      v_user,
      v_text,
      v_idx
    );
    v_idx := v_idx + 1;
  END LOOP;

  v_idx := 0;
  FOREACH v_text IN ARRAY p_positions
  LOOP
    INSERT INTO public.intimate_date_positions (
      proposal_id, created_by, position_label
    ) VALUES (
      v_proposal_id,
      v_user,
      v_text
    );
    v_idx := v_idx + 1;
  END LOOP;

  INSERT INTO public.partner_sync_events(connection_id, actor_id, event_type, metadata)
  VALUES (v_conn.id, v_user, 'date_plan_created', jsonb_build_object('proposal_id', v_proposal_id));

  RETURN v_proposal_id;
END $$;

-- ==================== Retention & Panic Delete ====================
CREATE OR REPLACE FUNCTION public.partner_sync_apply_retention(p_connection_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_policy public.partner_sync_retention_policies;
BEGIN
  SELECT * INTO v_policy FROM public.partner_sync_retention_policies
  WHERE connection_id = p_connection_id;

  IF v_policy.id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.partner_thought_pings
  WHERE connection_id = p_connection_id
    AND created_at < NOW() - (COALESCE(v_policy.retention_days_pings, 0) || ' days')::interval;

  DELETE FROM public.partner_position_selections
  WHERE connection_id = p_connection_id
    AND created_at < NOW() - (COALESCE(v_policy.retention_days_selections, 0) || ' days')::interval;

  DELETE FROM public.partner_sync_events
  WHERE connection_id = p_connection_id
    AND created_at < NOW() - (COALESCE(v_policy.retention_days_events, 0) || ' days')::interval;

  DELETE FROM public.partner_sync_audit_log
  WHERE connection_id = p_connection_id
    AND created_at < NOW() - (COALESCE(v_policy.retention_days_events, 0) || ' days')::interval;

  DELETE FROM public.intimate_date_proposals p
  USING public.partner_connections pc
  WHERE pc.id = p_connection_id
    AND (
      (p.creator_id = pc.user_id AND p.partner_id = pc.partner_id)
      OR (p.creator_id = pc.partner_id AND p.partner_id = pc.user_id)
    )
    AND p.created_at < NOW() - (COALESCE(v_policy.retention_days_plans, 0) || ' days')::interval;
END $$;

CREATE OR REPLACE FUNCTION public.partner_sync_panic_delete(p_connection_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_conn public.partner_connections;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_conn
  FROM public.partner_connections
  WHERE id = p_connection_id
    AND (user_id = v_user OR partner_id = v_user);

  IF v_conn.id IS NULL THEN
    RAISE EXCEPTION 'Connection not found';
  END IF;

  DELETE FROM public.partner_thought_pings WHERE connection_id = p_connection_id;
  DELETE FROM public.partner_thought_ping_reactions
  WHERE ping_id IN (
    SELECT id FROM public.partner_thought_pings WHERE connection_id = p_connection_id
  );
  DELETE FROM public.partner_position_selections WHERE connection_id = p_connection_id;
  DELETE FROM public.partner_position_activity_log WHERE connection_id = p_connection_id;
  DELETE FROM public.partner_sync_events WHERE connection_id = p_connection_id;
  DELETE FROM public.partner_sync_audit_log WHERE connection_id = p_connection_id;
  DELETE FROM public.partner_sync_consent WHERE connection_id = p_connection_id;
  DELETE FROM public.partner_sync_retention_policies WHERE connection_id = p_connection_id;

  DELETE FROM public.intimate_date_proposals
  WHERE (creator_id = v_conn.user_id AND partner_id = v_conn.partner_id)
     OR (creator_id = v_conn.partner_id AND partner_id = v_conn.user_id);

  UPDATE public.partner_connections
  SET status = 'blocked', updated_at = NOW()
  WHERE id = p_connection_id;
END $$;

-- ==================== Response Latency Triggers ====================
CREATE OR REPLACE FUNCTION public.partner_sync_log_latency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_latency_ms BIGINT;
BEGIN
  IF TG_TABLE_NAME = 'partner_thought_pings' AND NEW.status = 'responded' THEN
    IF NEW.responded_at IS NULL THEN
      RETURN NEW;
    END IF;
    v_latency_ms := EXTRACT(EPOCH FROM (NEW.responded_at - NEW.created_at)) * 1000;
    INSERT INTO public.partner_sync_events(connection_id, actor_id, event_type, metadata)
    VALUES (NEW.connection_id, NEW.recipient_id, 'thought_ping_responded', jsonb_build_object('latency_ms', v_latency_ms));
  ELSIF TG_TABLE_NAME = 'partner_position_selections' AND NEW.selection_status IN ('accepted', 'declined', 'tried') THEN
    IF NEW.responded_at IS NULL THEN
      RETURN NEW;
    END IF;
    v_latency_ms := EXTRACT(EPOCH FROM (NEW.responded_at - NEW.created_at)) * 1000;
    INSERT INTO public.partner_sync_events(connection_id, actor_id, event_type, metadata)
    VALUES (NEW.connection_id, NEW.suggested_for, 'position_selection_' || NEW.selection_status, jsonb_build_object('latency_ms', v_latency_ms));
  ELSIF TG_TABLE_NAME = 'intimate_date_proposals' AND NEW.proposal_status IN ('accepted', 'declined', 'modified', 'resubmitted') THEN
    IF NEW.responded_at IS NULL THEN
      RETURN NEW;
    END IF;
    v_latency_ms := EXTRACT(EPOCH FROM (NEW.responded_at - NEW.created_at)) * 1000;
    INSERT INTO public.partner_sync_events(connection_id, actor_id, event_type, metadata)
    VALUES (
      (SELECT pc.id FROM public.partner_connections pc
        WHERE (pc.user_id = NEW.creator_id AND pc.partner_id = NEW.partner_id)
           OR (pc.user_id = NEW.partner_id AND pc.partner_id = NEW.creator_id)
        LIMIT 1),
      NEW.partner_id,
      'date_plan_' || NEW.proposal_status,
      jsonb_build_object('latency_ms', v_latency_ms)
    );
  END IF;
  RETURN NEW;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_thought_pings_latency') THEN
    CREATE TRIGGER trg_partner_thought_pings_latency
      AFTER UPDATE ON public.partner_thought_pings
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION public.partner_sync_log_latency();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_position_latency') THEN
    CREATE TRIGGER trg_partner_position_latency
      AFTER UPDATE ON public.partner_position_selections
      FOR EACH ROW
      WHEN (OLD.selection_status IS DISTINCT FROM NEW.selection_status)
      EXECUTE FUNCTION public.partner_sync_log_latency();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_date_latency') THEN
    CREATE TRIGGER trg_partner_date_latency
      AFTER UPDATE ON public.intimate_date_proposals
      FOR EACH ROW
      WHEN (OLD.proposal_status IS DISTINCT FROM NEW.proposal_status)
      EXECUTE FUNCTION public.partner_sync_log_latency();
  END IF;
END $$;

-- ==================== Audit Trigger ====================
CREATE OR REPLACE FUNCTION public.partner_sync_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_connection UUID;
  v_target UUID;
  v_payload JSONB;
BEGIN
  IF TG_TABLE_NAME = 'partner_thought_pings' THEN
    v_connection := COALESCE(NEW.connection_id, OLD.connection_id);
    v_target := COALESCE(NEW.recipient_id, OLD.recipient_id);
  ELSIF TG_TABLE_NAME = 'partner_position_selections' THEN
    v_connection := COALESCE(NEW.connection_id, OLD.connection_id);
    v_target := COALESCE(NEW.suggested_for, OLD.suggested_for);
  ELSIF TG_TABLE_NAME = 'intimate_date_proposals' THEN
    SELECT pc.id INTO v_connection
    FROM public.partner_connections pc
    WHERE (pc.user_id = COALESCE(NEW.creator_id, OLD.creator_id)
      AND pc.partner_id = COALESCE(NEW.partner_id, OLD.partner_id))
      OR (pc.user_id = COALESCE(NEW.partner_id, OLD.partner_id)
      AND pc.partner_id = COALESCE(NEW.creator_id, OLD.creator_id))
    LIMIT 1;
    v_target := COALESCE(NEW.partner_id, OLD.partner_id);
  END IF;

  v_payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'record_id', COALESCE(NEW.id, OLD.id)
  );

  IF v_connection IS NOT NULL AND v_actor IS NOT NULL THEN
    INSERT INTO public.partner_sync_audit_log(
      connection_id,
      actor_id,
      target_user_id,
      action_type,
      payload
    ) VALUES (
      v_connection,
      v_actor,
      v_target,
      lower(TG_TABLE_NAME || '_' || TG_OP),
      v_payload
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_thought_pings_audit') THEN
    CREATE TRIGGER trg_partner_thought_pings_audit
      AFTER INSERT OR UPDATE OR DELETE ON public.partner_thought_pings
      FOR EACH ROW EXECUTE FUNCTION public.partner_sync_audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_position_audit') THEN
    CREATE TRIGGER trg_partner_position_audit
      AFTER INSERT OR UPDATE OR DELETE ON public.partner_position_selections
      FOR EACH ROW EXECUTE FUNCTION public.partner_sync_audit_trigger();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_date_audit') THEN
    CREATE TRIGGER trg_partner_date_audit
      AFTER INSERT OR UPDATE OR DELETE ON public.intimate_date_proposals
      FOR EACH ROW EXECUTE FUNCTION public.partner_sync_audit_trigger();
  END IF;
END $$;
