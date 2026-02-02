-- Migration: Admin DLC content import pipeline (idempotent)
-- - Adds audit tables for imports
-- - Adds stable slug key for nsfw_video_content

-- Import job ledger
CREATE TABLE IF NOT EXISTS public.dlc_content_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  import_type text NOT NULL CHECK (import_type IN ('positions', 'videos')),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),

  source_file_name text,
  source_sha256 text,

  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_dlc_content_import_jobs_created_at ON public.dlc_content_import_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_dlc_content_import_jobs_type ON public.dlc_content_import_jobs(import_type);
CREATE INDEX IF NOT EXISTS idx_dlc_content_import_jobs_status ON public.dlc_content_import_jobs(status);

ALTER TABLE public.dlc_content_import_jobs ENABLE ROW LEVEL SECURITY;

-- Keep import jobs service-only (admin tools should use edge/service role)
DROP POLICY IF EXISTS "No public access to dlc_content_import_jobs" ON public.dlc_content_import_jobs;
CREATE POLICY "No public access to dlc_content_import_jobs"
  ON public.dlc_content_import_jobs FOR ALL
  USING (false);

-- Per-item results
CREATE TABLE IF NOT EXISTS public.dlc_content_import_job_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  job_id uuid NOT NULL REFERENCES public.dlc_content_import_jobs(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'skipped', 'failed')),
  error_message text,

  UNIQUE(job_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_dlc_content_import_job_items_job_id ON public.dlc_content_import_job_items(job_id);
CREATE INDEX IF NOT EXISTS idx_dlc_content_import_job_items_status ON public.dlc_content_import_job_items(status);

ALTER TABLE public.dlc_content_import_job_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access to dlc_content_import_job_items" ON public.dlc_content_import_job_items;
CREATE POLICY "No public access to dlc_content_import_job_items"
  ON public.dlc_content_import_job_items FOR ALL
  USING (false);

-- Stable key for NSFW video content to support idempotent imports
DO $$
BEGIN
  IF to_regclass('public.nsfw_video_content') IS NOT NULL THEN
    ALTER TABLE public.nsfw_video_content
      ADD COLUMN IF NOT EXISTS content_slug text;

    ALTER TABLE public.nsfw_video_content
      ADD COLUMN IF NOT EXISTS source_import_key text;

    -- Unique slug (nullable until populated)
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_nsfw_video_content_content_slug_unique ON public.nsfw_video_content(content_slug) WHERE content_slug IS NOT NULL';

    -- Optional unique source key for fully idempotent multi-source imports
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_nsfw_video_content_source_import_key_unique ON public.nsfw_video_content(source_import_key) WHERE source_import_key IS NOT NULL';
  END IF;
END $$;
