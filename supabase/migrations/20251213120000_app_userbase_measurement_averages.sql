-- App userbase measurement averages (aggregate only)
-- Provides privacy-safe length/girth averages across all users' scans
-- NOTE: Returns NULL averages until k-anonymity threshold is met.

CREATE OR REPLACE FUNCTION public.get_app_userbase_measurement_averages(p_days integer DEFAULT 3650, p_min_sample integer DEFAULT 25)
RETURNS TABLE (
  sample_size integer,
  is_sufficient boolean,
  avg_length numeric,
  avg_girth numeric,
  window_days integer,
  computed_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT
      s.length::numeric AS length,
      s.girth::numeric AS girth
    FROM public.scans s
    WHERE
      s.scanned_at >= (now() - (p_days::text || ' days')::interval)
      AND (s.scan_type IS NULL OR s.scan_type <> 'ai_analysis')
      AND (s.length IS NOT NULL OR s.girth IS NOT NULL)
  ),
  stats AS (
    SELECT
      COUNT(*)::integer AS n,
      AVG(length) FILTER (WHERE length IS NOT NULL) AS avg_len,
      AVG(girth) FILTER (WHERE girth IS NOT NULL) AS avg_gir
    FROM filtered
  )
  SELECT
    stats.n AS sample_size,
    (stats.n >= GREATEST(1, p_min_sample)) AS is_sufficient,
    CASE WHEN stats.n >= GREATEST(1, p_min_sample) THEN stats.avg_len ELSE NULL END AS avg_length,
    CASE WHEN stats.n >= GREATEST(1, p_min_sample) THEN stats.avg_gir ELSE NULL END AS avg_girth,
    p_days AS window_days,
    now() AS computed_at
  FROM stats;
$$;

REVOKE ALL ON FUNCTION public.get_app_userbase_measurement_averages(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_app_userbase_measurement_averages(integer, integer) TO authenticated;

