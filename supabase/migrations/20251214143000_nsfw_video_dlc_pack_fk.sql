-- Migration: Add FK from nsfw_video_content.dlc_pack_id -> dlc_packages.id
-- Idempotent via catalog check.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'nsfw_video_content_dlc_pack_id_fkey'
  ) THEN
    ALTER TABLE nsfw_video_content
      ADD CONSTRAINT nsfw_video_content_dlc_pack_id_fkey
      FOREIGN KEY (dlc_pack_id) REFERENCES dlc_packages(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_nsfw_video_content_dlc_pack_id ON nsfw_video_content(dlc_pack_id);

