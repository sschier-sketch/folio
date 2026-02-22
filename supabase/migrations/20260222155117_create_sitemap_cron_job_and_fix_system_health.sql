/*
  # Create Sitemap Cron Job & Fix System Health Dashboard

  1. New Cron Job
    - `daily-sitemap-generation` - Calls the sitemap edge function daily at 5:00 AM UTC
    - Uses pg_net to POST to the sitemap edge function
    - No auth required (verifyJWT is disabled on the sitemap function)

  2. Modified Functions
    - `admin_get_system_health` - Completely rewritten to:
      - Show all actual pg_cron jobs with their real run history
      - Includes the new sitemap cron job
      - Uses pg_cron run_details as single source of truth
      - Eliminates dependency on empty cron_runs table

  3. Important Notes
    - The original sitemap cron job was never created because vault secrets were unavailable during migration
    - The cron_runs table was empty because edge functions never wrote to it
    - The new approach uses pg_cron run_details as the source of truth for all jobs
*/

-- 1. Create the sitemap cron job using pg_net (no auth needed, verifyJWT=false)
DO $outer$
DECLARE
  v_job_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'daily-sitemap-generation'
  ) INTO v_job_exists;

  IF v_job_exists THEN
    PERFORM cron.unschedule('daily-sitemap-generation');
  END IF;

  PERFORM cron.schedule(
    'daily-sitemap-generation',
    '0 5 * * *',
    format(
      'SELECT net.http_post(url := %L, headers := %L::jsonb, body := %L::jsonb)',
      'https://mypuvkzsgwanilduniup.supabase.co/functions/v1/sitemap',
      '{"Content-Type": "application/json"}',
      '{"action": "regenerate"}'
    )
  );
END $outer$;

-- 2. Drop old function and recreate with correct return type
DROP FUNCTION IF EXISTS public.admin_get_system_health();

CREATE OR REPLACE FUNCTION public.admin_get_system_health()
RETURNS TABLE(
  r_name text,
  r_type text,
  r_desc text,
  r_schedule text,
  r_active boolean,
  r_health text,
  r_last_run timestamptz,
  r_last_status text,
  r_last_msg text,
  r_duration double precision,
  r_24h bigint,
  r_7d bigint,
  r_fail7d bigint,
  r_runs jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
IF NOT EXISTS (
  SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
) THEN
  RAISE EXCEPTION 'Zugriff verweigert';
END IF;

RETURN QUERY

WITH
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

job_meta (jname, jdesc, jtype) AS (
  VALUES
    ('daily-index-rent-calculations', 'Berechnet Indexmieten-Anpassungen basierend auf dem VPI', 'pg_cron'),
    ('daily-rent-increase-reminders', 'Erstellt Erinnerungen fuer faellige Mieterhoehungen', 'pg_cron'),
    ('process-email-queue', 'Verarbeitet die E-Mail-Warteschlange und versendet ausstehende E-Mails via Edge Function', 'pg_cron'),
    ('daily-sitemap-generation', 'Generiert die sitemap.xml fuer Suchmaschinen via Edge Function', 'pg_cron')
),

all_jobs AS (
  SELECT
    pj.jobname::text AS o_name,
    COALESCE(jm.jtype, 'pg_cron')::text AS o_type,
    COALESCE(jm.jdesc, 'pg_cron Job: ' || pj.jobname)::text AS o_desc,
    pj.schedule::text AS o_schedule,
    pj.active AS o_active,
    pl.start_time AS o_last_run,
    pl.status::text AS o_last_status,
    pl.return_message::text AS o_last_msg,
    (CASE
      WHEN pl.end_time IS NOT NULL AND pl.start_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (pl.end_time - pl.start_time)) * 1000
      ELSE NULL
    END)::double precision AS o_duration,
    COALESCE(pc.cnt_24h, 0)::bigint AS o_24h,
    COALESCE(pc.cnt_7d, 0)::bigint AS o_7d,
    COALESCE(pc.fail_7d, 0)::bigint AS o_fail7d,
    COALESCE(ph.runs, '[]'::jsonb) AS o_runs,
    (CASE
      WHEN pl.status = 'failed' THEN 'error'
      WHEN pl.start_time IS NULL THEN 'unknown'
      WHEN pj.active = false THEN 'warning'
      WHEN pj.schedule = '* * * * *' AND pl.start_time < now() - interval '5 minutes' THEN 'warning'
      WHEN pj.schedule != '* * * * *' AND pl.start_time < now() - interval '26 hours' THEN 'warning'
      ELSE 'healthy'
    END)::text AS o_health
  FROM cron.job pj
  LEFT JOIN job_meta jm ON jm.jname = pj.jobname
  LEFT JOIN pgcron_latest pl ON pl.jobname = pj.jobname
  LEFT JOIN pgcron_counts pc ON pc.jobname = pj.jobname
  LEFT JOIN pgcron_history ph ON ph.jobname = pj.jobname
)

SELECT
  o_name, o_type, o_desc, o_schedule, o_active, o_health,
  o_last_run, o_last_status, o_last_msg, o_duration,
  o_24h, o_7d, o_fail7d, o_runs
FROM all_jobs
ORDER BY o_name;

END;
$fn$;
