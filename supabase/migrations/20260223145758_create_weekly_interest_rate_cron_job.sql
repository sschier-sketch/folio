/*
  # Create Weekly Interest Rate Fetch Cron Job

  1. New Cron Job
    - `weekly-interest-rate-fetch` - Calls the fetch-interest-rates edge function
    - Schedule: Every Monday at 05:00 UTC (06:00 CET / 07:00 CEST)
    - Uses pg_net to POST to the edge function with service role auth

  2. SQL Wrapper Function
    - `trigger_interest_rate_fetch()` - Builds the pg_net call with proper auth headers
    - Uses current_setting to read service role key at runtime (not hardcoded)

  3. Modified Functions
    - `admin_get_system_health` - Updated job_meta CTE to include the new cron job

  4. Important Notes
    - The edge function also accepts CRON_SECRET for manual/external triggers
    - Rate limiting: the edge function skips if last successful run was < 24h ago
    - No data is ever deleted; only new snapshots are inserted if data changed
*/

-- 1. Create wrapper function that builds the pg_net call with auth
CREATE OR REPLACE FUNCTION public.trigger_interest_rate_fetch()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text;
  v_service_key text;
BEGIN
  v_supabase_url := current_setting('app.supabase_url', true);
  v_service_key := current_setting('app.service_role_key', true);

  IF v_supabase_url IS NULL THEN
    v_supabase_url := 'https://mypuvkzsgwanilduniup.supabase.co';
  END IF;

  IF v_service_key IS NOT NULL THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/fetch-interest-rates',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := '{}'::jsonb
    );
  ELSE
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/fetch-interest-rates',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  END IF;
END;
$$;

-- 2. Schedule the cron job: Monday 05:00 UTC
DO $outer$
DECLARE
  v_job_exists boolean;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    SELECT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'weekly-interest-rate-fetch'
    ) INTO v_job_exists;

    IF v_job_exists THEN
      PERFORM cron.unschedule('weekly-interest-rate-fetch');
    END IF;

    PERFORM cron.schedule(
      'weekly-interest-rate-fetch',
      '0 5 * * 1',
      'SELECT public.trigger_interest_rate_fetch()'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create cron job weekly-interest-rate-fetch: %. Manual setup required.', SQLERRM;
END $outer$;

-- 3. Update admin_get_system_health to include the new job
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
    ('daily-sitemap-generation', 'Generiert die sitemap.xml fuer Suchmaschinen via Edge Function', 'pg_cron'),
    ('weekly-interest-rate-fetch', 'Importiert woechentlich Bauzinsen-Zeitreihen der Deutschen Bundesbank (BBIM1)', 'pg_cron')
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
      WHEN pj.schedule LIKE '0 _ * * 1' AND pl.start_time < now() - interval '8 days' THEN 'warning'
      WHEN pj.schedule != '* * * * *' AND pj.schedule NOT LIKE '0 _ * * 1' AND pl.start_time < now() - interval '26 hours' THEN 'warning'
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
