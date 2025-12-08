-- Migration: Conversational AI Enhancement
-- Creates tables for enhanced AI chatbot with voice interaction, multi-modal AI, contextual memory, and emotional intelligence

-- AI Conversation Sessions
CREATE TABLE IF NOT EXISTS ai_conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session details
  session_name TEXT,
  conversation_mode TEXT DEFAULT 'casual' CHECK (conversation_mode IN ('casual', 'expert', 'medical', 'support')),
  language TEXT DEFAULT 'en',
  
  -- Context
  context_summary TEXT, -- Summary of conversation context
  user_preferences JSONB, -- User preferences for AI interaction
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Conversation Messages
CREATE TABLE IF NOT EXISTS ai_conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_conversation_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message content
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'voice', 'image', 'mixed')),
  content_text TEXT,
  content_audio_url TEXT, -- For voice messages
  content_image_url TEXT, -- For image messages
  transcription TEXT, -- For voice messages
  
  -- Sender
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'ai')),
  
  -- AI metadata
  ai_model_version TEXT,
  ai_confidence DECIMAL(3, 2),
  ai_reasoning TEXT,
  emotional_tone TEXT, -- Detected emotional tone
  sentiment_score DECIMAL(3, 2), -- -1.0 to 1.0
  
  -- Context
  context_references UUID[], -- References to previous messages
  referenced_data JSONB, -- Referenced user data (scans, diary entries, etc.)
  
  -- Proactive suggestions
  proactive_suggestions JSONB, -- AI-generated proactive suggestions
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Contextual Memory
CREATE TABLE IF NOT EXISTS ai_contextual_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Memory content
  memory_type TEXT NOT NULL CHECK (memory_type IN ('preference', 'fact', 'goal', 'concern', 'history')),
  memory_key TEXT NOT NULL, -- Key identifier for the memory
  memory_value JSONB NOT NULL, -- The actual memory data
  
  -- Context
  source_session_id UUID REFERENCES ai_conversation_sessions(id),
  source_message_id UUID REFERENCES ai_conversation_messages(id),
  
  -- Importance
  importance_score DECIMAL(3, 2) DEFAULT 0.5, -- 0.0 to 1.0
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Expiration
  expires_at TIMESTAMPTZ, -- NULL for permanent memories
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, memory_key)
);

-- AI Proactive Suggestions
CREATE TABLE IF NOT EXISTS ai_proactive_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Suggestion details
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('health_tip', 'reminder', 'routine_suggestion', 'data_review', 'goal_check', 'other')),
  suggestion_title TEXT NOT NULL,
  suggestion_content TEXT NOT NULL,
  suggestion_action JSONB, -- Action to take if user accepts
  
  -- AI metadata
  ai_confidence DECIMAL(3, 2),
  ai_reasoning TEXT,
  trigger_condition JSONB, -- What triggered this suggestion
  
  -- Status
  suggestion_status TEXT DEFAULT 'pending' CHECK (suggestion_status IN ('pending', 'shown', 'accepted', 'dismissed', 'expired')),
  shown_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Voice Interactions
CREATE TABLE IF NOT EXISTS ai_voice_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES ai_conversation_sessions(id),
  
  -- Voice data
  audio_url TEXT NOT NULL,
  transcription TEXT,
  language_detected TEXT,
  
  -- Processing
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,
  
  -- Analysis
  emotional_tone TEXT,
  sentiment_score DECIMAL(3, 2),
  keywords_extracted TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Multi-Modal Interactions
CREATE TABLE IF NOT EXISTS ai_multimodal_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES ai_conversation_sessions(id),
  
  -- Input types
  has_text BOOLEAN DEFAULT false,
  has_voice BOOLEAN DEFAULT false,
  has_image BOOLEAN DEFAULT false,
  
  -- Content
  text_content TEXT,
  voice_url TEXT,
  image_url TEXT,
  
  -- AI processing
  ai_analysis JSONB, -- Combined analysis of all modalities
  ai_response TEXT,
  ai_response_audio_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI User Preferences
CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Conversation preferences
  preferred_mode TEXT DEFAULT 'casual' CHECK (preferred_mode IN ('casual', 'expert', 'medical', 'support')),
  preferred_language TEXT DEFAULT 'en',
  voice_enabled BOOLEAN DEFAULT false,
  image_analysis_enabled BOOLEAN DEFAULT true,
  
  -- AI behavior
  ai_personality TEXT DEFAULT 'friendly' CHECK (ai_personality IN ('friendly', 'professional', 'casual', 'supportive')),
  ai_response_length TEXT DEFAULT 'medium' CHECK (ai_response_length IN ('short', 'medium', 'detailed')),
  proactive_suggestions_enabled BOOLEAN DEFAULT true,
  
  -- Privacy
  data_sharing_level TEXT DEFAULT 'minimal' CHECK (data_sharing_level IN ('minimal', 'moderate', 'full')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversation_sessions_user_id ON ai_conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_sessions_active ON ai_conversation_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_messages_session_id ON ai_conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_messages_user_id ON ai_conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_contextual_memory_user_id ON ai_contextual_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_contextual_memory_key ON ai_contextual_memory(memory_key);
CREATE INDEX IF NOT EXISTS idx_ai_proactive_suggestions_user_id ON ai_proactive_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_proactive_suggestions_status ON ai_proactive_suggestions(suggestion_status);
CREATE INDEX IF NOT EXISTS idx_ai_voice_interactions_user_id ON ai_voice_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_multimodal_interactions_user_id ON ai_multimodal_interactions(user_id);

-- RLS Policies
ALTER TABLE ai_conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_contextual_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_proactive_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_voice_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_multimodal_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;

-- AI Conversation Sessions: Users can view their own
CREATE POLICY "Users can manage own conversation sessions"
  ON ai_conversation_sessions FOR ALL
  USING (auth.uid() = user_id);

-- AI Conversation Messages: Users can view their own
CREATE POLICY "Users can manage own conversation messages"
  ON ai_conversation_messages FOR ALL
  USING (auth.uid() = user_id);

-- AI Contextual Memory: Users can view their own
CREATE POLICY "Users can manage own contextual memory"
  ON ai_contextual_memory FOR ALL
  USING (auth.uid() = user_id);

-- AI Proactive Suggestions: Users can view their own
CREATE POLICY "Users can manage own proactive suggestions"
  ON ai_proactive_suggestions FOR ALL
  USING (auth.uid() = user_id);

-- AI Voice Interactions: Users can view their own
CREATE POLICY "Users can manage own voice interactions"
  ON ai_voice_interactions FOR ALL
  USING (auth.uid() = user_id);

-- AI Multi-Modal Interactions: Users can view their own
CREATE POLICY "Users can manage own multimodal interactions"
  ON ai_multimodal_interactions FOR ALL
  USING (auth.uid() = user_id);

-- AI User Preferences: Users can view their own
CREATE POLICY "Users can manage own AI preferences"
  ON ai_user_preferences FOR ALL
  USING (auth.uid() = user_id);

