-- Migration: Enhanced DLC System
-- Creates tables for modular DLC, bundles, previews, streaming, downloads, and content library organization

-- DLC Packs
CREATE TABLE IF NOT EXISTS dlc_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  pack_name TEXT NOT NULL,
  description TEXT NOT NULL,
  pack_type TEXT NOT NULL CHECK (pack_type IN ('positions', 'videos', 'education', 'bundle', 'premium_content')),
  
  -- Content
  content_items JSONB NOT NULL, -- Array of content items (positions, videos, etc.)
  item_count INTEGER DEFAULT 0,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  is_subscription BOOLEAN DEFAULT false,
  subscription_duration_days INTEGER, -- If subscription
  
  -- Preview
  preview_images TEXT[],
  preview_video_url TEXT,
  preview_description TEXT,
  
  -- Metadata
  tags TEXT[],
  category TEXT,
  difficulty_level TEXT,
  content_rating TEXT,
  
  -- Access
  requires_base_pack BOOLEAN DEFAULT false,
  base_pack_id UUID REFERENCES dlc_packs(id),
  is_standalone BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  release_date DATE,
  
  -- Sales
  sales_count INTEGER DEFAULT 0,
  revenue_total DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Bundles (packages of multiple DLC packs)
CREATE TABLE IF NOT EXISTS dlc_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  bundle_name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Bundle contents
  pack_ids UUID[] NOT NULL, -- Array of DLC pack IDs
  pack_count INTEGER DEFAULT 0,
  
  -- Pricing
  bundle_price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2), -- Sum of individual pack prices
  discount_percentage DECIMAL(5, 2), -- Calculated discount
  
  -- Preview
  preview_image_url TEXT,
  preview_description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_limited_time BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Purchases
CREATE TABLE IF NOT EXISTS dlc_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES dlc_packs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  purchase_type TEXT DEFAULT 'one_time' CHECK (purchase_type IN ('one_time', 'subscription')),
  price_paid DECIMAL(10, 2) NOT NULL,
  payment_intent_id TEXT,
  
  -- Access
  access_granted_at TIMESTAMPTZ DEFAULT NOW(),
  access_expires_at TIMESTAMPTZ, -- NULL for lifetime access
  is_active BOOLEAN DEFAULT true,
  
  -- Download/Stream
  download_enabled BOOLEAN DEFAULT true,
  stream_enabled BOOLEAN DEFAULT true,
  
  purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Download Queue
CREATE TABLE IF NOT EXISTS dlc_download_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES dlc_purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Download details
  content_item_id TEXT NOT NULL, -- ID of item being downloaded
  content_type TEXT NOT NULL CHECK (content_type IN ('position', 'video', 'image', '3d_model', 'other')),
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  
  -- Status
  download_status TEXT DEFAULT 'queued' CHECK (download_status IN ('queued', 'downloading', 'paused', 'completed', 'failed', 'cancelled')),
  download_priority INTEGER DEFAULT 5, -- 1-10, higher = more priority
  
  -- Progress
  downloaded_bytes INTEGER DEFAULT 0,
  download_progress DECIMAL(5, 2) DEFAULT 0,
  download_speed_bytes_per_sec INTEGER,
  estimated_time_remaining_seconds INTEGER,
  
  -- Metadata
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3
);

-- DLC Content Library (user's organized library)
CREATE TABLE IF NOT EXISTS dlc_content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES dlc_purchases(id) ON DELETE CASCADE,
  
  -- Organization
  folder_name TEXT, -- User-created folder
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  custom_notes TEXT,
  
  -- Access
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  -- Download status
  is_downloaded BOOLEAN DEFAULT false,
  download_location TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Updates and Versioning
CREATE TABLE IF NOT EXISTS dlc_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES dlc_packs(id) ON DELETE CASCADE,
  
  version_number TEXT NOT NULL,
  update_type TEXT CHECK (update_type IN ('patch', 'minor', 'major', 'content_add')),
  
  -- Update details
  changelog TEXT[],
  new_content_items JSONB,
  removed_content_items TEXT[],
  modified_content_items JSONB,
  
  -- Files
  update_file_url TEXT,
  update_file_size_bytes INTEGER,
  
  -- Status
  is_required BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  release_date TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Backup Status
CREATE TABLE IF NOT EXISTS dlc_backup_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES dlc_purchases(id) ON DELETE CASCADE,
  
  -- Backup details
  backup_location TEXT, -- 'cloud', 'local', 'both'
  cloud_backup_url TEXT,
  local_backup_path TEXT,
  
  -- Status
  backup_status TEXT DEFAULT 'pending' CHECK (backup_status IN ('pending', 'backing_up', 'completed', 'failed', 'restored')),
  last_backed_up_at TIMESTAMPTZ,
  backup_size_bytes INTEGER,
  
  -- Restore
  last_restored_at TIMESTAMPTZ,
  restore_status TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Streaming Sessions
CREATE TABLE IF NOT EXISTS dlc_streaming_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES dlc_purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Streaming details
  content_item_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  quality TEXT DEFAULT 'auto' CHECK (quality IN ('sd', 'hd', '4k', 'auto')),
  
  -- Session
  session_started_at TIMESTAMPTZ DEFAULT NOW(),
  session_ended_at TIMESTAMPTZ,
  total_watch_time_seconds INTEGER,
  
  -- Streaming metrics
  buffering_count INTEGER DEFAULT 0,
  quality_changes INTEGER DEFAULT 0,
  average_bitrate INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dlc_packs_type ON dlc_packs(pack_type);
CREATE INDEX IF NOT EXISTS idx_dlc_packs_active ON dlc_packs(is_active);
CREATE INDEX IF NOT EXISTS idx_dlc_purchases_user_id ON dlc_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_purchases_pack_id ON dlc_purchases(pack_id);
CREATE INDEX IF NOT EXISTS idx_dlc_download_queue_user_id ON dlc_download_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_download_queue_status ON dlc_download_queue(download_status);
CREATE INDEX IF NOT EXISTS idx_dlc_content_library_user_id ON dlc_content_library(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_updates_pack_id ON dlc_updates(pack_id);
CREATE INDEX IF NOT EXISTS idx_dlc_backup_status_user_id ON dlc_backup_status(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_streaming_sessions_user_id ON dlc_streaming_sessions(user_id);

-- RLS Policies
ALTER TABLE dlc_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_download_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_backup_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_streaming_sessions ENABLE ROW LEVEL SECURITY;

-- DLC Packs: All authenticated users can view active packs
CREATE POLICY "Authenticated users can view active DLC packs"
  ON dlc_packs FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- DLC Bundles: All authenticated users can view active bundles
CREATE POLICY "Authenticated users can view active bundles"
  ON dlc_bundles FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

-- DLC Purchases: Users can view their own
CREATE POLICY "Users can view own DLC purchases"
  ON dlc_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
  ON dlc_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DLC Download Queue: Users can view their own
CREATE POLICY "Users can manage own download queue"
  ON dlc_download_queue FOR ALL
  USING (auth.uid() = user_id);

-- DLC Content Library: Users can view their own
CREATE POLICY "Users can manage own content library"
  ON dlc_content_library FOR ALL
  USING (auth.uid() = user_id);

-- DLC Updates: All authenticated users can view
CREATE POLICY "Authenticated users can view DLC updates"
  ON dlc_updates FOR SELECT
  USING (auth.role() = 'authenticated' AND is_available = true);

-- DLC Backup Status: Users can view their own
CREATE POLICY "Users can manage own backup status"
  ON dlc_backup_status FOR ALL
  USING (auth.uid() = user_id);

-- DLC Streaming Sessions: Users can view their own
CREATE POLICY "Users can view own streaming sessions"
  ON dlc_streaming_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create streaming sessions"
  ON dlc_streaming_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

