-- Migration: In-App Messaging System
-- Creates tables for direct messaging, support tickets, expert consultations, and group chats

-- Ensure support_staff role exists in app_role enum for policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'app_role'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'support_staff'
      AND enumtypid = 'app_role'::regtype
  ) THEN
    ALTER TYPE app_role ADD VALUE 'support_staff';
  END IF;
END $$;

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'feature_request', 'bug_report', 'account', 'general', 'premium_support')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  
  assigned_to UUID REFERENCES auth.users(id), -- Support staff
  assigned_at TIMESTAMPTZ,
  
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  -- User feedback
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback_text TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Ticket Messages (conversation thread)
CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for system messages
  is_staff BOOLEAN DEFAULT false,
  
  content TEXT NOT NULL,
  attachments JSONB, -- Array of file URLs/metadata
  
  is_internal BOOLEAN DEFAULT false, -- Internal notes visible only to staff
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expert Consultation Bookings
CREATE TABLE IF NOT EXISTS expert_consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('video_call', 'voice_call', 'text_chat', 'email')),
  topic TEXT NOT NULL,
  description TEXT,
  
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  
  -- Payment
  price DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_intent_id TEXT,
  
  -- Session details
  meeting_link TEXT, -- Video call URL
  meeting_id TEXT, -- Meeting room ID
  notes TEXT, -- Post-consultation notes
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Chats (Support Groups)
CREATE TABLE IF NOT EXISTS group_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('support', 'health_condition', 'treatment', 'recovery', 'general', 'premium')),
  
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  member_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  
  avatar_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group Chat Members
CREATE TABLE IF NOT EXISTS group_chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'moderator')),
  is_muted BOOLEAN DEFAULT false,
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  UNIQUE(group_id, user_id)
);

-- Group Chat Messages
CREATE TABLE IF NOT EXISTS group_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  attachments JSONB, -- Array of file URLs/metadata
  
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  reply_to_message_id UUID REFERENCES group_chat_messages(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Reactions (for group chats)
CREATE TABLE IF NOT EXISTS group_chat_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES group_chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- File Attachments (for messages)
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_type TEXT NOT NULL CHECK (message_type IN ('direct', 'group', 'ticket', 'consultation')),
  message_id UUID NOT NULL,
  
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER, -- bytes
  thumbnail_url TEXT,
  
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_user_id ON expert_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_expert_id ON expert_consultations(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_consultations_status ON expert_consultations(status);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_group_id ON group_chat_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_members_user_id ON group_chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_group_id ON group_chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_messages_created_at ON group_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_recipient ON direct_messages(sender_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at);

-- RLS Policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Ensure policies are idempotent if rerun
DROP POLICY IF EXISTS "Users can view own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets, staff can update all" ON support_tickets;
DROP POLICY IF EXISTS "Users can view messages in own tickets" ON support_ticket_messages;
DROP POLICY IF EXISTS "Users can create messages in own tickets" ON support_ticket_messages;
DROP POLICY IF EXISTS "Users can view own consultations" ON expert_consultations;
DROP POLICY IF EXISTS "Users can create consultations" ON expert_consultations;
DROP POLICY IF EXISTS "Users can update own consultations" ON expert_consultations;
DROP POLICY IF EXISTS "Members can view their groups" ON group_chats;
DROP POLICY IF EXISTS "Users can create groups" ON group_chats;
DROP POLICY IF EXISTS "Admins can update their groups" ON group_chats;
DROP POLICY IF EXISTS "Members can view group members" ON group_chat_members;
DROP POLICY IF EXISTS "Users can join public groups or be added to private groups" ON group_chat_members;
DROP POLICY IF EXISTS "Members can view group messages" ON group_chat_messages;
DROP POLICY IF EXISTS "Members can send group messages" ON group_chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON group_chat_messages;
DROP POLICY IF EXISTS "Members can view reactions" ON group_chat_message_reactions;
DROP POLICY IF EXISTS "Members can add reactions" ON group_chat_message_reactions;
DROP POLICY IF EXISTS "Users can view message attachments" ON message_attachments;
DROP POLICY IF EXISTS "Users can upload attachments" ON message_attachments;

-- Support Tickets: Users can view their own tickets, staff can view all
CREATE POLICY "Users can view own support tickets"
  ON support_tickets FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role::text IN ('admin', 'support_staff')
  ));

CREATE POLICY "Users can create own support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets, staff can update all"
  ON support_tickets FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role::text IN ('admin', 'support_staff')
  ));

-- Support Ticket Messages: Users can view messages in their tickets, staff can view all
CREATE POLICY "Users can view messages in own tickets"
  ON support_ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets st 
      WHERE st.id = support_ticket_messages.ticket_id 
      AND (st.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role::text IN ('admin', 'support_staff')
      ))
    )
  );

CREATE POLICY "Users can create messages in own tickets"
  ON support_ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets st 
      WHERE st.id = support_ticket_messages.ticket_id 
      AND (st.user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.role::text IN ('admin', 'support_staff')
      ))
    )
  );

-- Expert Consultations: Users can view their own consultations
CREATE POLICY "Users can view own consultations"
  ON expert_consultations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = expert_id);

CREATE POLICY "Users can create consultations"
  ON expert_consultations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consultations"
  ON expert_consultations FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = expert_id);

-- Group Chats: Members can view their groups
CREATE POLICY "Members can view their groups"
  ON group_chats FOR SELECT
  USING (
    is_private = false OR EXISTS (
      SELECT 1 FROM group_chat_members gcm 
      WHERE gcm.group_id = group_chats.id 
      AND gcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON group_chats FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their groups"
  ON group_chats FOR UPDATE
  USING (
    auth.uid() = created_by OR EXISTS (
      SELECT 1 FROM group_chat_members gcm 
      WHERE gcm.group_id = group_chats.id 
      AND gcm.user_id = auth.uid() 
      AND gcm.role IN ('admin', 'moderator')
    )
  );

-- Group Chat Members: Members can view members of their groups
CREATE POLICY "Members can view group members"
  ON group_chat_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_chat_members gcm 
      WHERE gcm.group_id = group_chat_members.group_id 
      AND gcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join public groups or be added to private groups"
  ON group_chat_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      EXISTS (
        SELECT 1 FROM group_chats gc 
        WHERE gc.id = group_chat_members.group_id 
        AND gc.is_private = false
      )
    )
  );

-- Group Chat Messages: Members can view and send messages
CREATE POLICY "Members can view group messages"
  ON group_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_chat_members gcm 
      WHERE gcm.group_id = group_chat_messages.group_id 
      AND gcm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send group messages"
  ON group_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM group_chat_members gcm 
      WHERE gcm.group_id = group_chat_messages.group_id 
      AND gcm.user_id = auth.uid()
      AND gcm.is_muted = false
    )
  );

CREATE POLICY "Users can update own messages"
  ON group_chat_messages FOR UPDATE
  USING (auth.uid() = user_id);

-- Message Reactions: Members can react
CREATE POLICY "Members can view reactions"
  ON group_chat_message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_chat_messages gcm 
      JOIN group_chat_members gcm2 ON gcm2.group_id = gcm.group_id
      WHERE gcm.id = group_chat_message_reactions.message_id 
      AND gcm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add reactions"
  ON group_chat_message_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM group_chat_messages gcm 
      JOIN group_chat_members gcm2 ON gcm2.group_id = gcm.group_id
      WHERE gcm.id = group_chat_message_reactions.message_id 
      AND gcm2.user_id = auth.uid()
    )
  );

-- Message Attachments: Users can view attachments in their messages
CREATE POLICY "Users can view message attachments"
  ON message_attachments FOR SELECT
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can upload attachments"
  ON message_attachments FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

