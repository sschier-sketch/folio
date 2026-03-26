/*
  # Engagement-E-Mail Cron Jobs

  1. Neue Funktionen
    - `trigger_cron_inactive_user_with_property()` -- ruft die Edge Function auf
    - `trigger_cron_no_property_reminder()` -- ruft die Edge Function auf

  2. Neue Cron Jobs (beide PAUSIERT)
    - `daily-inactive-user-with-property` -- täglich 08:00 UTC, INAKTIV
    - `daily-no-property-reminder` -- täglich 08:15 UTC, INAKTIV

  3. Wichtige Hinweise
    - Beide Jobs starten PAUSIERT damit die Templates vor Versand geprüft werden
    - admin_get_cron_jobs aktualisiert um neue Edge Functions korrekt auszuschließen
*/

-- 1. Trigger function for cron-inactive-user-with-property
CREATE OR REPLACE FUNCTION public.trigger_cron_inactive_user_with_property()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_headers jsonb;
BEGIN
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json'
  );

  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/cron-inactive-user-with-property',
    headers := v_headers,
    body := '{}'::jsonb
  );
END;
$$;

-- 2. Trigger function for cron-no-property-reminder
CREATE OR REPLACE FUNCTION public.trigger_cron_no_property_reminder()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_headers jsonb;
BEGIN
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json'
  );

  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/cron-no-property-reminder',
    headers := v_headers,
    body := '{}'::jsonb
  );
END;
$$;

-- 3. Schedule cron jobs (PAUSED)
SELECT cron.schedule(
  'daily-inactive-user-with-property',
  '0 8 * * *',
  $$SELECT public.trigger_cron_inactive_user_with_property()$$
);

SELECT cron.schedule(
  'daily-no-property-reminder',
  '15 8 * * *',
  $$SELECT public.trigger_cron_no_property_reminder()$$
);

-- Deactivate both
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'daily-inactive-user-with-property'),
  active := false
);

SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'daily-no-property-reminder'),
  active := false
);

-- 4. Update admin_get_cron_jobs to exclude new Edge Functions from ef_result
DROP FUNCTION IF EXISTS public.admin_get_cron_jobs();

CREATE OR REPLACE FUNCTION public.admin_get_cron_jobs()
RETURNS TABLE(
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
    RAISE EXCEPTION 'Zugriff verweigert: Nur Administratoren können Cron-Jobs einsehen';
  END IF;

  RETURN QUERY

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

  pgcron_triggered_ef_names AS (
    SELECT unnest(ARRAY[
      'cron-trial-ending',
      'cron-trial-ended',
      'process-loan-reminders',
      'cron-inactive-user-with-property',
      'cron-no-property-reminder'
    ]) AS job_name
  ),

  ef_names AS (
    SELECT DISTINCT cr.job_name
    FROM public.cron_runs cr
    WHERE cr.job_name NOT IN (SELECT job_name FROM pgcron_triggered_ef_names)
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
    WHERE cr.job_name NOT IN (SELECT job_name FROM pgcron_triggered_ef_names)
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
            ', Übersprungen: ' || COALESCE(eh.skipped_count, 0)
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
      WHERE cr2.job_name NOT IN (SELECT job_name FROM pgcron_triggered_ef_names)
    ) eh
    WHERE eh.rn <= 20
    GROUP BY eh.job_name
  ),
  ef_result AS (
    SELECT
      (ROW_NUMBER() OVER (ORDER BY efn.job_name) + 10000)::bigint AS r_jobid,
      efn.job_name::text AS r_jobname,
      ('extern')::text AS r_schedule,
      ('Edge Function: ' || efn.job_name)::text AS r_command,
      true::boolean AS r_active,
      efl.started_at::timestamptz AS r_last_run_at,
      efl.status::text AS r_last_status,
      (COALESCE(efl.error_message,
        'Verarbeitet: ' || COALESCE(efl.processed_count, 0) ||
        ', Gesendet: ' || COALESCE(efl.sent_count, 0) ||
        ', Fehler: ' || COALESCE(efl.failed_count, 0) ||
        ', Übersprungen: ' || COALESCE(efl.skipped_count, 0)
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
