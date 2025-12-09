-- Migration: Add 2K (1440p) Video and Image Quality Support
-- Adds 2K quality option for videos and images

-- Add video_url_2k column to nsfw_video_content
ALTER TABLE nsfw_video_content 
ADD COLUMN IF NOT EXISTS video_url_2k TEXT;

-- Update quality_preference CHECK constraint in nsfw_video_progress
ALTER TABLE nsfw_video_progress
DROP CONSTRAINT IF EXISTS nsfw_video_progress_quality_preference_check;

ALTER TABLE nsfw_video_progress
ADD CONSTRAINT nsfw_video_progress_quality_preference_check 
CHECK (quality_preference IN ('sd', 'hd', '2k', '4k', 'auto'));

-- Update quality CHECK constraint in nsfw_video_downloads
ALTER TABLE nsfw_video_downloads
DROP CONSTRAINT IF EXISTS nsfw_video_downloads_quality_check;

ALTER TABLE nsfw_video_downloads
ADD CONSTRAINT nsfw_video_downloads_quality_check 
CHECK (quality IN ('sd', 'hd', '2k', '4k'));

-- Update quality CHECK constraint in dlc_streaming_sessions
ALTER TABLE dlc_streaming_sessions
DROP CONSTRAINT IF EXISTS dlc_streaming_sessions_quality_check;

ALTER TABLE dlc_streaming_sessions
ADD CONSTRAINT dlc_streaming_sessions_quality_check 
CHECK (quality IN ('sd', 'hd', '2k', '4k', 'auto'));

-- Add image quality columns for 2K support
-- Add image_url_2k to relevant tables if needed
-- (This is optional, depends on your image quality requirements)

-- Add comment
COMMENT ON COLUMN nsfw_video_content.video_url_2k IS '2K (1440p) quality video URL';

