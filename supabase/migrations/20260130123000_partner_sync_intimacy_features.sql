-- Migration: Partner Sync Intimacy Features
-- Adds thought pings and partner position selections with RLS.

-- ==================== Partner Thought Pings ====================
CREATE TABLE IF NOT EXISTS public.partner_thought_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tone_tags TEXT[] DEFAULT '{}'::text[],
  intensity TEXT DEFAULT 'medium' CHECK (intensity IN ('soft', 'playful', 'medium', 'intense', 'wild')),
  theme TEXT,
  message TEXT NOT NULL,
  detailed_message TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'read', 'archived', 'responded')),
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_connection_id
  ON public.partner_thought_pings(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_recipient_id
  ON public.partner_thought_pings(recipient_id);
CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_status
  ON public.partner_thought_pings(status);
CREATE INDEX IF NOT EXISTS idx_partner_thought_pings_created_at
  ON public.partner_thought_pings(created_at DESC);

ALTER TABLE public.partner_thought_pings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_thought_pings'
      AND policyname = 'Partner pings select'
  ) THEN
    CREATE POLICY "Partner pings select"
      ON public.partner_thought_pings
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_thought_pings.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_thought_pings'
      AND policyname = 'Partner pings insert'
  ) THEN
    CREATE POLICY "Partner pings insert"
      ON public.partner_thought_pings
      FOR INSERT
      WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_thought_pings.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_thought_pings'
      AND policyname = 'Partner pings update'
  ) THEN
    CREATE POLICY "Partner pings update"
      ON public.partner_thought_pings
      FOR UPDATE
      USING (
        (sender_id = auth.uid() OR recipient_id = auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_thought_pings.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      )
      WITH CHECK (
        (sender_id = auth.uid() OR recipient_id = auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_thought_pings.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_thought_pings'
      AND policyname = 'Partner pings delete'
  ) THEN
    CREATE POLICY "Partner pings delete"
      ON public.partner_thought_pings
      FOR DELETE
      USING (
        sender_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_thought_pings.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;
END $$;

-- ==================== Partner Position Selections ====================
CREATE TABLE IF NOT EXISTS public.partner_position_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.partner_connections(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.nsfw_positions_gallery(id) ON DELETE SET NULL,
  custom_position_name TEXT,
  custom_description TEXT,
  suggested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_for UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selection_status TEXT DEFAULT 'pending' CHECK (selection_status IN ('pending', 'accepted', 'declined', 'tried', 'archived')),
  theme_tags TEXT[] DEFAULT '{}'::text[],
  intensity TEXT DEFAULT 'medium' CHECK (intensity IN ('soft', 'playful', 'medium', 'intense', 'wild')),
  note TEXT,
  partner_note TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (position_id IS NOT NULL OR custom_position_name IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_partner_position_selections_connection_id
  ON public.partner_position_selections(connection_id);
CREATE INDEX IF NOT EXISTS idx_partner_position_selections_suggested_by
  ON public.partner_position_selections(suggested_by);
CREATE INDEX IF NOT EXISTS idx_partner_position_selections_suggested_for
  ON public.partner_position_selections(suggested_for);
CREATE INDEX IF NOT EXISTS idx_partner_position_selections_status
  ON public.partner_position_selections(selection_status);
CREATE INDEX IF NOT EXISTS idx_partner_position_selections_created_at
  ON public.partner_position_selections(created_at DESC);

ALTER TABLE public.partner_position_selections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_position_selections'
      AND policyname = 'Partner position selections select'
  ) THEN
    CREATE POLICY "Partner position selections select"
      ON public.partner_position_selections
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_position_selections.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_position_selections'
      AND policyname = 'Partner position selections insert'
  ) THEN
    CREATE POLICY "Partner position selections insert"
      ON public.partner_position_selections
      FOR INSERT
      WITH CHECK (
        suggested_by = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_position_selections.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_position_selections'
      AND policyname = 'Partner position selections update'
  ) THEN
    CREATE POLICY "Partner position selections update"
      ON public.partner_position_selections
      FOR UPDATE
      USING (
        (suggested_by = auth.uid() OR suggested_for = auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_position_selections.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      )
      WITH CHECK (
        (suggested_by = auth.uid() OR suggested_for = auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_position_selections.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'partner_position_selections'
      AND policyname = 'Partner position selections delete'
  ) THEN
    CREATE POLICY "Partner position selections delete"
      ON public.partner_position_selections
      FOR DELETE
      USING (
        suggested_by = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.partner_connections pc
          WHERE pc.id = partner_position_selections.connection_id
            AND (pc.user_id = auth.uid() OR pc.partner_id = auth.uid())
            AND pc.status = 'accepted'
        )
      );
  END IF;
END $$;
