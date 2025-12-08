-- Migration: Live Support Chat System
-- Creates tables for real-time support chat with AI-powered responses

-- Support Chat Sessions
CREATE TABLE IF NOT EXISTS support_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'waiting', 'assigned', 'resolved', 'closed')),
  
  -- Assignment
  assigned_to UUID REFERENCES auth.users(id), -- Support staff
  assigned_at TIMESTAMPTZ,
  
  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_premium_user BOOLEAN DEFAULT false, -- Premium users get priority
  
  -- AI handling
  ai_handled BOOLEAN DEFAULT true, -- Initially handled by AI
  escalated_to_human BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolution_summary TEXT,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback_text TEXT,
  
  -- Metadata
  user_agent TEXT,
  ip_address TEXT,
  language TEXT DEFAULT 'en',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

-- Support Chat Messages
CREATE TABLE IF NOT EXISTS support_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES support_chat_sessions(id) ON DELETE CASCADE,
  
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai', 'staff')),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for AI messages
  
  content TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  ai_model TEXT, -- Which AI model generated this (e.g., 'gemini-2.5-flash')
  ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00
  
  -- Quick actions/buttons
  quick_actions JSONB, -- Array of action buttons
  
  -- Attachments
  attachments JSONB, -- Array of file URLs/metadata
  
  -- Message metadata
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- For AI messages
  suggested_escalation BOOLEAN DEFAULT false, -- AI suggests escalating to human
  suggested_escalation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Chat Quick Responses (Templates)
CREATE TABLE IF NOT EXISTS support_chat_quick_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK (category IN ('greeting', 'technical', 'billing', 'account', 'feature', 'general')),
  
  is_ai_enabled BOOLEAN DEFAULT true, -- Can AI use this response?
  is_staff_only BOOLEAN DEFAULT false, -- Only staff can use this
  
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(3, 2), -- Resolution rate when this response is used
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Chat AI Training Data (for improving responses)
CREATE TABLE IF NOT EXISTS support_chat_ai_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES support_chat_sessions(id) ON DELETE CASCADE,
  
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  was_helpful BOOLEAN, -- User feedback
  was_escalated BOOLEAN DEFAULT false, -- Was escalated after this response
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Staff Availability
CREATE TABLE IF NOT EXISTS support_staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  is_available BOOLEAN DEFAULT true,
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chat_count INTEGER DEFAULT 0,
  
  -- Working hours
  timezone TEXT DEFAULT 'UTC',
  working_hours JSONB, -- { "monday": { "start": "09:00", "end": "17:00" }, ... }
  
  -- Status
  status_message TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_user_id ON support_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_status ON support_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_assigned_to ON support_chat_sessions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_priority ON support_chat_sessions(priority);
CREATE INDEX IF NOT EXISTS idx_support_chat_messages_session_id ON support_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_messages_created_at ON support_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_support_staff_availability_staff_id ON support_staff_availability(staff_id);
CREATE INDEX IF NOT EXISTS idx_support_staff_availability_is_available ON support_staff_availability(is_available);

-- RLS Policies
ALTER TABLE support_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_quick_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_ai_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_staff_availability ENABLE ROW LEVEL SECURITY;

-- Support Chat Sessions: Users can view their own sessions, staff can view all
CREATE POLICY "Users can view own chat sessions"
  ON support_chat_sessions FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'support_staff')
    )
  );

CREATE POLICY "Users can create chat sessions"
  ON support_chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and staff can update sessions"
  ON support_chat_sessions FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'support_staff')
    )
  );

-- Support Chat Messages: Users can view messages in their sessions
CREATE POLICY "Users can view messages in own sessions"
  ON support_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_chat_sessions scs 
      WHERE scs.id = support_chat_messages.session_id 
      AND (
        scs.user_id = auth.uid() OR 
        scs.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role IN ('admin', 'support_staff')
        )
      )
    )
  );

CREATE POLICY "Users can send messages in own sessions"
  ON support_chat_messages FOR INSERT
  WITH CHECK (
    sender_type = 'user' AND
    EXISTS (
      SELECT 1 FROM support_chat_sessions scs 
      WHERE scs.id = support_chat_messages.session_id 
      AND scs.user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can send messages in assigned sessions"
  ON support_chat_messages FOR INSERT
  WITH CHECK (
    sender_type = 'staff' AND
    EXISTS (
      SELECT 1 FROM support_chat_sessions scs 
      WHERE scs.id = support_chat_messages.session_id 
      AND (
        scs.assigned_to = auth.uid() OR
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() 
          AND ur.role IN ('admin', 'support_staff')
        )
      )
    )
  );

-- Quick Responses: Staff can view and manage
CREATE POLICY "Staff can view quick responses"
  ON support_chat_quick_responses FOR SELECT
  USING (
    is_staff_only = false OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'support_staff')
    )
  );

CREATE POLICY "Staff can manage quick responses"
  ON support_chat_quick_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'support_staff')
    )
  );

-- AI Training Data: Staff can view
CREATE POLICY "Staff can view AI training data"
  ON support_chat_ai_training FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'support_staff')
    )
  );

-- Staff Availability: Staff can manage their own
CREATE POLICY "Staff can manage own availability"
  ON support_staff_availability FOR ALL
  USING (auth.uid() = staff_id);

CREATE POLICY "Admins can view all availability"
  ON support_staff_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'
    )
  );

