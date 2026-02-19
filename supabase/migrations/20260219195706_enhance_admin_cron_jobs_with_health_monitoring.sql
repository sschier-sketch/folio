/*
  # Enhance Admin Cron Jobs with Health Monitoring

  1. New Function
    - `admin_get_system_health` - comprehensive health dashboard data
    - Combines pg_cron jobs, cron_runs edge function data, and email_logs activity
    - Shows last activity timestamps even for edge functions without cron_runs entries
    - Provides health status: 'healthy', 'warning', 'error', 'unknown'

  2. How it works
    - pg_cron jobs: read from cron.job + cron.job_run_details (same as before)
    - Edge functions with cron_runs: read from cron_runs table
    - Edge functions without cron_runs: infer last activity from email_logs
      (e.g., process-email-queue activity visible from email sends)
    - Expected schedule is used to determine if a job is overdue

  3. Security
    - Admin-only access via admin_users check
    - SECURITY DEFINER for cron schema access
*/

CREATE OR REPLACE FUNCTION admin_get_system_health()
RETURNS TABLE (
  job_name text,
  job_type text,
  description text,
  schedule text,
  is_active boolean,
  health_status text,
  last_run_at timestamptz,
  last_status text,
  last_message text,
  last_duration_ms double precision,
  runs_last_24h bigint,
  runs_last_7d bigint,
  failures_last_7d bigint,
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
    RAISE EXCEPTION 'Zugriff verweigert';
  END IF;

  RETURN QUERY

  WITH
  -- pg_cron jobs with run details
  pgcron_jobs AS (
    SELECT
      j.jobname,
      j.schedule AS sched,
      j.active,
      j.command
    FROM cron.job j
  ),
  pgcron_latest AS (
    SELECT DISTINCT ON (jrd.jobid)
      j.jobname,
      jrd.start_time,
      jrd.end_time,
      jrd.status,
      jrd.return_message
    FROM cron.job_run_details jrd
    JOIN cron.job j ON j.jobid = jrd.jobid
    ORDER BY jrd.jobid, jrd.start_time DESC
  ),
  pgcron_counts AS (
    SELECT
      j.jobname,
      COUNT(*) FILTER (WHERE jrd.start_time > now() - interval '24 hours') AS cnt_24h,
      COUNT(*) FILTER (WHERE jrd.start_time > now() - interval '7 days') AS cnt_7d,
      COUNT(*) FILTER (WHERE jrd.start_time > now() - interval '7 days' AND jrd.status = 'failed') AS fail_7d
    FROM cron.job_run_details jrd
    JOIN cron.job j ON j.jobid = jrd.jobid
    GROUP BY j.jobname
  ),
  pgcron_history AS (
    SELECT
      sub.jobname,
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'status', sub.status,
          'message', sub.return_message,
          'started_at', sub.start_time,
          'finished_at', sub.end_time,
          'duration_ms', CASE
            WHEN sub.end_time IS NOT NULL AND sub.start_time IS NOT NULL
            THEN EXTRACT(EPOCH FROM (sub.end_time - sub.start_time)) * 1000
            ELSE NULL
          END
        ) ORDER BY sub.start_time DESC
      ), '[]'::jsonb) AS runs
    FROM (
      SELECT j.jobname, jrd.status, jrd.return_message, jrd.start_time, jrd.end_time,
             ROW_NUMBER() OVER (PARTITION BY j.jobname ORDER BY jrd.start_time DESC) AS rn
      FROM cron.job_run_details jrd
      JOIN cron.job j ON j.jobid = jrd.jobid
    ) sub
    WHERE sub.rn <= 15
    GROUP BY sub.jobname
  ),
  pgcron_result AS (
    SELECT
      pj.jobname::text AS r_name,
      'pg_cron'::text AS r_type,
      (CASE pj.jobname
        WHEN 'daily-index-rent-calculations' THEN 'Berechnet Indexmieten-Anpassungen basierend auf dem VPI'
        WHEN 'daily-rent-increase-reminders' THEN 'Erstellt Erinnerungen fuer faellige Mieterhoehungen'
        ELSE 'pg_cron Job'
      END)::text AS r_desc,
      pj.sched::text AS r_schedule,
      pj.active AS r_active,
      pl.start_time AS r_last_run,
      pl.status::text AS r_last_status,
      pl.return_message::text AS r_last_msg,
      (CASE
        WHEN pl.end_time IS NOT NULL AND pl.start_time IS NOT NULL
        THEN EXTRACT(EPOCH FROM (pl.end_time - pl.start_time)) * 1000
        ELSE NULL
      END)::double precision AS r_duration,
      COALESCE(pc.cnt_24h, 0)::bigint AS r_24h,
      COALESCE(pc.cnt_7d, 0)::bigint AS r_7d,
      COALESCE(pc.fail_7d, 0)::bigint AS r_fail7d,
      COALESCE(ph.runs, '[]'::jsonb) AS r_runs,
      (CASE
        WHEN pl.status = 'failed' THEN 'error'
        WHEN pl.start_time IS NULL THEN 'unknown'
        WHEN pl.start_time < now() - interval '26 hours' THEN 'warning'
        ELSE 'healthy'
      END)::text AS r_health
    FROM pgcron_jobs pj
    LEFT JOIN pgcron_latest pl ON pl.jobname = pj.jobname
    LEFT JOIN pgcron_counts pc ON pc.jobname = pj.jobname
    LEFT JOIN pgcron_history ph ON ph.jobname = pj.jobname
  ),

  -- Edge function cron jobs from cron_runs table
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
  ef_counts AS (
    SELECT
      cr.job_name,
      COUNT(*) FILTER (WHERE cr.started_at > now() - interval '24 hours') AS cnt_24h,
      COUNT(*) FILTER (WHERE cr.started_at > now() - interval '7 days') AS cnt_7d,
      COUNT(*) FILTER (WHERE cr.started_at > now() - interval '7 days' AND cr.status = 'failed') AS fail_7d
    FROM public.cron_runs cr
    GROUP BY cr.job_name
  ),
  ef_history AS (
    SELECT
      sub.job_name,
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'status', sub.status,
          'message', COALESCE(sub.error_message,
            'Verarbeitet: ' || COALESCE(sub.processed_count, 0) ||
            ', Gesendet: ' || COALESCE(sub.sent_count, 0) ||
            ', Fehler: ' || COALESCE(sub.failed_count, 0)
          ),
          'started_at', sub.started_at,
          'finished_at', sub.finished_at,
          'duration_ms', CASE
            WHEN sub.finished_at IS NOT NULL AND sub.started_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (sub.finished_at - sub.started_at)) * 1000
            ELSE NULL
          END
        ) ORDER BY sub.started_at DESC
      ), '[]'::jsonb) AS runs
    FROM (
      SELECT cr2.job_name, cr2.status, cr2.error_message,
             cr2.processed_count, cr2.sent_count, cr2.failed_count,
             cr2.started_at, cr2.finished_at,
             ROW_NUMBER() OVER (PARTITION BY cr2.job_name ORDER BY cr2.started_at DESC) AS rn
      FROM public.cron_runs cr2
    ) sub
    WHERE sub.rn <= 15
    GROUP BY sub.job_name
  ),

  -- email_logs activity to infer edge function health when no cron_runs data
  email_activity AS (
    SELECT
      max(sent_at) FILTER (WHERE status = 'sent') AS last_email_sent,
      count(*) FILTER (WHERE sent_at > now() - interval '24 hours' AND status = 'sent') AS emails_24h,
      count(*) FILTER (WHERE sent_at > now() - interval '7 days' AND status = 'sent') AS emails_7d
    FROM email_logs
  ),

  -- All expected edge function jobs
  all_ef_jobs (ef_name, ef_desc, ef_schedule) AS (
    VALUES
      ('process-email-queue', 'Verarbeitet die E-Mail-Warteschlange und versendet ausstehende E-Mails', 'Alle 5 Minuten'),
      ('cron-trial-ending', 'Warnt Nutzer deren Testphase bald ablaeuft (7 Tage vorher)', 'Taeglich'),
      ('cron-trial-ended', 'Benachrichtigt Nutzer deren Testphase abgelaufen ist', 'Taeglich'),
      ('process-loan-reminders', 'Sendet Erinnerungen fuer Darlehensereignisse (Zinsbindung, Laufzeit, Sondertilgung)', 'Taeglich'),
      ('create-rent-increase-reminders', 'Erstellt Tickets fuer anstehende Mieterhoehungen', 'Taeglich'),
      ('run-index-rent-calculations', 'Fuehrt Indexmieten-Berechnungen durch und aktualisiert Mietpreise', 'Taeglich'),
      ('daily-sitemap-generation', 'Generiert die sitemap.xml fuer Suchmaschinen', 'Taeglich')
  ),
  ef_result AS (
    SELECT
      aej.ef_name::text AS r_name,
      'edge_function'::text AS r_type,
      aej.ef_desc::text AS r_desc,
      aej.ef_schedule::text AS r_schedule,
      true AS r_active,
      COALESCE(efl.started_at,
        CASE WHEN aej.ef_name = 'process-email-queue' THEN ea.last_email_sent ELSE NULL END
      ) AS r_last_run,
      COALESCE(efl.status,
        CASE WHEN aej.ef_name = 'process-email-queue' AND ea.last_email_sent IS NOT NULL THEN 'completed' ELSE NULL END
      )::text AS r_last_status,
      COALESCE(
        efl.error_message,
        CASE WHEN efl.started_at IS NOT NULL THEN
          'Verarbeitet: ' || COALESCE(efl.processed_count, 0) ||
          ', Gesendet: ' || COALESCE(efl.sent_count, 0) ||
          ', Fehler: ' || COALESCE(efl.failed_count, 0)
        WHEN aej.ef_name = 'process-email-queue' AND ea.last_email_sent IS NOT NULL THEN
          'Letzte E-Mail gesendet: ' || to_char(ea.last_email_sent AT TIME ZONE 'Europe/Berlin', 'DD.MM.YYYY HH24:MI')
        ELSE NULL END
      )::text AS r_last_msg,
      (CASE
        WHEN efl.finished_at IS NOT NULL AND efl.started_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (efl.finished_at - efl.started_at)) * 1000
        ELSE NULL
      END)::double precision AS r_duration,
      COALESCE(efc.cnt_24h,
        CASE WHEN aej.ef_name = 'process-email-queue' THEN ea.emails_24h ELSE 0 END
      )::bigint AS r_24h,
      COALESCE(efc.cnt_7d,
        CASE WHEN aej.ef_name = 'process-email-queue' THEN ea.emails_7d ELSE 0 END
      )::bigint AS r_7d,
      COALESCE(efc.fail_7d, 0)::bigint AS r_fail7d,
      COALESCE(efh.runs, '[]'::jsonb) AS r_runs,
      (CASE
        WHEN efl.status = 'failed' THEN 'error'
        WHEN efl.started_at IS NOT NULL AND efl.started_at > now() - interval '26 hours' THEN 'healthy'
        WHEN efl.started_at IS NOT NULL AND efl.started_at <= now() - interval '26 hours' THEN 'warning'
        WHEN aej.ef_name = 'process-email-queue' AND ea.last_email_sent IS NOT NULL AND ea.last_email_sent > now() - interval '1 hour' THEN 'healthy'
        WHEN aej.ef_name = 'process-email-queue' AND ea.last_email_sent IS NOT NULL THEN 'warning'
        ELSE 'unknown'
      END)::text AS r_health
    FROM all_ef_jobs aej
    LEFT JOIN ef_latest efl ON efl.job_name = aej.ef_name
    LEFT JOIN ef_counts efc ON efc.job_name = aej.ef_name
    LEFT JOIN ef_history efh ON efh.job_name = aej.ef_name
    CROSS JOIN email_activity ea
  )

  SELECT r_name, r_type, r_desc, r_schedule, r_active, r_health,
         r_last_run, r_last_status, r_last_msg, r_duration,
         r_24h, r_7d, r_fail7d, r_runs
  FROM pgcron_result
  UNION ALL
  SELECT r_name, r_type, r_desc, r_schedule, r_active, r_health,
         r_last_run, r_last_status, r_last_msg, r_duration,
         r_24h, r_7d, r_fail7d, r_runs
  FROM ef_result
  ORDER BY 1;

END;
$$;
