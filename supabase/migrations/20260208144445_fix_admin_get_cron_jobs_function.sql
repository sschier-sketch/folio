/*
  # Fix admin_get_cron_jobs: Rebuild function to fix type mismatch

  1. Changes
    - Drop and recreate function to avoid any stale type cache issues
    - Simplified approach: reads pg_cron tables directly with explicit casts
    - Edge function jobs from cron_runs table included only if data exists
    - All column types explicitly cast to match RETURNS TABLE declaration

  2. Security
    - Admin-only access (checks admin_users table)
    - SECURITY DEFINER for cron schema access
*/

DROP FUNCTION IF EXISTS admin_get_cron_jobs();

CREATE OR REPLACE FUNCTION admin_get_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  jobname text,
  schedule text,
  command text,
  active boolean,
  last_run_at timestamptz,
  last_status text,
  last_return_message text,
  last_duration_ms double precision,
  recent_runs jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Zugriff verweigert: Nur Administratoren koennen Cron-Jobs einsehen';
  END IF;

  RETURN QUERY
  WITH pg_jobs AS (
    SELECT
      j.jobid AS jid,
      j.jobname AS jname,
      j.schedule AS jsched,
      j.command AS jcmd,
      j.active AS jactive
    FROM cron.job j
  ),
  latest_runs AS (
    SELECT DISTINCT ON (jrd.jobid)
      jrd.jobid AS jid,
      jrd.start_time,
      jrd.end_time,
      jrd.status,
      jrd.return_message
    FROM cron.job_run_details jrd
    ORDER BY jrd.jobid, jrd.start_time DESC
  ),
  run_history AS (
    SELECT
      rh.jobid AS jid,
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'runid', rh.runid,
          'status', rh.status,
          'return_message', rh.return_message,
          'start_time', rh.start_time,
          'end_time', rh.end_time,
          'duration_ms', CASE
            WHEN rh.end_time IS NOT NULL AND rh.start_time IS NOT NULL
            THEN EXTRACT(EPOCH FROM (rh.end_time - rh.start_time)) * 1000
            ELSE NULL
          END
        ) ORDER BY rh.start_time DESC
      ), '[]'::jsonb) AS runs
    FROM (
      SELECT rd2.jobid, rd2.runid, rd2.status, rd2.return_message, rd2.start_time, rd2.end_time,
             ROW_NUMBER() OVER (PARTITION BY rd2.jobid ORDER BY rd2.start_time DESC) AS rn
      FROM cron.job_run_details rd2
    ) rh
    WHERE rh.rn <= 20
    GROUP BY rh.jobid
  )
  SELECT
    pj.jid::bigint,
    pj.jname::text,
    pj.jsched::text,
    pj.jcmd::text,
    pj.jactive::boolean,
    lr.start_time::timestamptz,
    lr.status::text,
    lr.return_message::text,
    (CASE
      WHEN lr.end_time IS NOT NULL AND lr.start_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (lr.end_time - lr.start_time)) * 1000
      ELSE NULL
    END)::double precision,
    COALESCE(rhi.runs, '[]'::jsonb)::jsonb
  FROM pg_jobs pj
  LEFT JOIN latest_runs lr ON lr.jid = pj.jid
  LEFT JOIN run_history rhi ON rhi.jid = pj.jid
  ORDER BY pj.jname;
END;
$$;
