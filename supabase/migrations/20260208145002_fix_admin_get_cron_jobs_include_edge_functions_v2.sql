/*
  # Fix admin_get_cron_jobs: Include edge function runs from cron_runs table

  1. Changes
    - Extends admin_get_cron_jobs() to UNION pg_cron jobs WITH edge function cron runs
    - Uses CTEs for clean type handling to avoid type mismatch errors
    - Edge function runs are read from public.cron_runs table
    - All columns explicitly cast to match RETURNS TABLE declaration

  2. Data Sources
    - cron.job + cron.job_run_details: pg_cron jobs (index-rent, rent-increase-reminders)
    - public.cron_runs: Edge function cron jobs (trial-ending, trial-ended, email-queue, loan-reminders)

  3. Security
    - Admin-only access via admin_users check
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

  -- Part 1: pg_cron jobs
  WITH latest_runs AS (
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
  ),
  pgcron_result AS (
    SELECT
      pj.jobid::bigint AS r_jobid,
      pj.jobname::text AS r_jobname,
      pj.schedule::text AS r_schedule,
      pj.command::text AS r_command,
      pj.active::boolean AS r_active,
      lr.start_time::timestamptz AS r_last_run_at,
      lr.status::text AS r_last_status,
      lr.return_message::text AS r_last_return_message,
      (CASE
        WHEN lr.end_time IS NOT NULL AND lr.start_time IS NOT NULL
        THEN EXTRACT(EPOCH FROM (lr.end_time - lr.start_time)) * 1000
        ELSE NULL
      END)::double precision AS r_last_duration_ms,
      COALESCE(rhi.runs, '[]'::jsonb)::jsonb AS r_recent_runs
    FROM cron.job pj
    LEFT JOIN latest_runs lr ON lr.jid = pj.jobid
    LEFT JOIN run_history rhi ON rhi.jid = pj.jobid
  ),

  -- Part 2: Edge function cron jobs from cron_runs table
  ef_names AS (
    SELECT DISTINCT cr.job_name FROM public.cron_runs cr
  ),
  ef_latest AS (
    SELECT DISTINCT ON (cr.job_name)
      cr.job_name,
      cr.started_at,
      cr.finished_at,
      cr.status,
      cr.error_message,
      cr.processed_count,
      cr.sent_count,
      cr.failed_count,
      cr.skipped_count
    FROM public.cron_runs cr
    ORDER BY cr.job_name, cr.started_at DESC
  ),
  ef_history AS (
    SELECT
      eh.job_name,
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'runid', eh.rn,
          'status', eh.status,
          'return_message', COALESCE(eh.error_message,
            'Verarbeitet: ' || COALESCE(eh.processed_count, 0) ||
            ', Gesendet: ' || COALESCE(eh.sent_count, 0) ||
            ', Fehler: ' || COALESCE(eh.failed_count, 0) ||
            ', Uebersprungen: ' || COALESCE(eh.skipped_count, 0)
          ),
          'start_time', eh.started_at,
          'end_time', eh.finished_at,
          'duration_ms', CASE
            WHEN eh.finished_at IS NOT NULL AND eh.started_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (eh.finished_at - eh.started_at)) * 1000
            ELSE NULL
          END
        ) ORDER BY eh.started_at DESC
      ), '[]'::jsonb) AS runs
    FROM (
      SELECT cr2.job_name, cr2.status, cr2.error_message,
             cr2.processed_count, cr2.sent_count, cr2.failed_count, cr2.skipped_count,
             cr2.started_at, cr2.finished_at,
             ROW_NUMBER() OVER (PARTITION BY cr2.job_name ORDER BY cr2.started_at DESC) AS rn
      FROM public.cron_runs cr2
    ) eh
    WHERE eh.rn <= 20
    GROUP BY eh.job_name
  ),
  ef_result AS (
    SELECT
      (ROW_NUMBER() OVER (ORDER BY efn.job_name) + 10000)::bigint AS r_jobid,
      efn.job_name::text AS r_jobname,
      (CASE efn.job_name
        WHEN 'cron-trial-ending' THEN 'extern (taeglich)'
        WHEN 'cron-trial-ended' THEN 'extern (taeglich)'
        WHEN 'process-email-queue' THEN 'extern (alle 5 min)'
        WHEN 'process-loan-reminders' THEN 'extern (taeglich)'
        ELSE 'extern'
      END)::text AS r_schedule,
      ('Edge Function: ' || efn.job_name)::text AS r_command,
      true::boolean AS r_active,
      efl.started_at::timestamptz AS r_last_run_at,
      efl.status::text AS r_last_status,
      (COALESCE(efl.error_message,
        'Verarbeitet: ' || COALESCE(efl.processed_count, 0) ||
        ', Gesendet: ' || COALESCE(efl.sent_count, 0) ||
        ', Fehler: ' || COALESCE(efl.failed_count, 0) ||
        ', Uebersprungen: ' || COALESCE(efl.skipped_count, 0)
      ))::text AS r_last_return_message,
      (CASE
        WHEN efl.finished_at IS NOT NULL AND efl.started_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (efl.finished_at - efl.started_at)) * 1000
        ELSE NULL
      END)::double precision AS r_last_duration_ms,
      COALESCE(efh.runs, '[]'::jsonb)::jsonb AS r_recent_runs
    FROM ef_names efn
    LEFT JOIN ef_latest efl ON efl.job_name = efn.job_name
    LEFT JOIN ef_history efh ON efh.job_name = efn.job_name
  )

  -- Combine both sources
  SELECT p.r_jobid, p.r_jobname, p.r_schedule, p.r_command, p.r_active,
         p.r_last_run_at, p.r_last_status, p.r_last_return_message,
         p.r_last_duration_ms, p.r_recent_runs
  FROM pgcron_result p

  UNION ALL

  SELECT e.r_jobid, e.r_jobname, e.r_schedule, e.r_command, e.r_active,
         e.r_last_run_at, e.r_last_status, e.r_last_return_message,
         e.r_last_duration_ms, e.r_recent_runs
  FROM ef_result e

  ORDER BY 2;
END;
$$;
