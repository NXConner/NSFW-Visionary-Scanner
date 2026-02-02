-- Migration: Add scan foreign keys after scans table exists
-- Ensures scan-related tables are linked to scans(id) once available

DO $$
BEGIN
  IF to_regclass('public.scans') IS NOT NULL AND to_regclass('public.time_lapse_comparisons') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'time_lapse_comparisons_start_scan_id_fkey'
    ) THEN
      ALTER TABLE public.time_lapse_comparisons
        ADD CONSTRAINT time_lapse_comparisons_start_scan_id_fkey
        FOREIGN KEY (start_scan_id) REFERENCES public.scans(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'time_lapse_comparisons_end_scan_id_fkey'
    ) THEN
      ALTER TABLE public.time_lapse_comparisons
        ADD CONSTRAINT time_lapse_comparisons_end_scan_id_fkey
        FOREIGN KEY (end_scan_id) REFERENCES public.scans(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.scans') IS NOT NULL AND to_regclass('public.batch_scan_entries') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'batch_scan_entries_scan_id_fkey'
    ) THEN
      ALTER TABLE public.batch_scan_entries
        ADD CONSTRAINT batch_scan_entries_scan_id_fkey
        FOREIGN KEY (scan_id) REFERENCES public.scans(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.scans') IS NOT NULL AND to_regclass('public.ai_scan_analysis') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'ai_scan_analysis_scan_id_fkey'
    ) THEN
      ALTER TABLE public.ai_scan_analysis
        ADD CONSTRAINT ai_scan_analysis_scan_id_fkey
        FOREIGN KEY (scan_id) REFERENCES public.scans(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'ai_scan_analysis_previous_scan_id_fkey'
    ) THEN
      ALTER TABLE public.ai_scan_analysis
        ADD CONSTRAINT ai_scan_analysis_previous_scan_id_fkey
        FOREIGN KEY (previous_scan_id) REFERENCES public.scans(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.scans') IS NOT NULL AND to_regclass('public.measurement_suggestions') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'measurement_suggestions_scan_id_fkey'
    ) THEN
      ALTER TABLE public.measurement_suggestions
        ADD CONSTRAINT measurement_suggestions_scan_id_fkey
        FOREIGN KEY (scan_id) REFERENCES public.scans(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.scans') IS NOT NULL AND to_regclass('public.quality_assessment_history') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'quality_assessment_history_scan_id_fkey'
    ) THEN
      ALTER TABLE public.quality_assessment_history
        ADD CONSTRAINT quality_assessment_history_scan_id_fkey
        FOREIGN KEY (scan_id) REFERENCES public.scans(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.scans') IS NOT NULL AND to_regclass('public.anomaly_detection_log') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'anomaly_detection_log_scan_id_fkey'
    ) THEN
      ALTER TABLE public.anomaly_detection_log
        ADD CONSTRAINT anomaly_detection_log_scan_id_fkey
        FOREIGN KEY (scan_id) REFERENCES public.scans(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'anomaly_detection_log_previous_scan_id_fkey'
    ) THEN
      ALTER TABLE public.anomaly_detection_log
        ADD CONSTRAINT anomaly_detection_log_previous_scan_id_fkey
        FOREIGN KEY (previous_scan_id) REFERENCES public.scans(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;
