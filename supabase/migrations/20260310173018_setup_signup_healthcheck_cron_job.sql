/*
  # Setup signup healthcheck cron job

  1. New Cron Jobs
    - `signup-healthcheck` - Runs every 10 minutes
      Calls the signup-healthcheck edge function which performs a synthetic
      signup test and verifies the entire registration pipeline is working.
    - `signup-funnel-anomaly-check` - Runs every 15 minutes
      Analyzes real signup patterns to detect anomalies (high failure rate,
      zero successes despite attempts) and sends alert emails.
    - `cleanup-old-health-checks` - Runs daily at 2:00 AM
      Removes health check records older than 30 days.

  2. Updates
    - Recreates `admin_get_system_health()` to include the new cron jobs
      in the admin dashboard with proper German descriptions.

  3. Important Notes
    - The healthcheck creates a test user, verifies all DB records were created,
      then cleans up the test user immediately.
    - The anomaly check examines registration_error_logs and auth.users
      to detect patterns indicating a broken signup funnel.
    - Alert emails are rate-limited to max once per hour via idempotency keys.
*/

DO $$ BEGIN
  PERFORM cron.unschedule('signup-healthcheck');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  PERFORM cron.unschedule('signup-funnel-anomaly-check');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  PERFORM cron.unschedule('cleanup-old-health-checks');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION trigger_signup_healthcheck()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  v_url := 'https://bnbqqfigdsijhikigcwl.supabase.co/functions/v1/signup-healthcheck';
  v_key := current_setting('app.settings.service_role_key', true);

  IF v_key IS NULL OR v_key = '' THEN
    SELECT decrypted_secret INTO v_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;
  END IF;

  IF v_key IS NULL OR v_key = '' THEN
    RAISE WARNING 'signup-healthcheck: service_role_key not found';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

SELECT cron.schedule(
  'signup-healthcheck',
  '*/10 * * * *',
  $$SELECT trigger_signup_healthcheck()$$
);

SELECT cron.schedule(
  'signup-funnel-anomaly-check',
  '3,18,33,48 * * * *',
  $$SELECT check_signup_funnel_anomaly()$$
);

SELECT cron.schedule(
  'cleanup-old-health-checks',
  '0 2 * * *',
  $$SELECT cleanup_old_health_checks()$$
);

DROP FUNCTION IF EXISTS admin_get_system_health();

CREATE FUNCTION admin_get_system_health()
RETURNS TABLE (
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
AS $$
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
    ('daily-activate-planned-rent-periods', 'Aktiviert geplante Mietperioden, deren Gueltigkeitsdatum erreicht wurde, und aktualisiert die Vertragsdaten', 'pg_cron'),
    ('daily-analytics-snapshot', 'Erstellt taeglichen Snapshot der Nutzungsstatistiken (Benutzer, Pro-Nutzer, Umsatz)', 'pg_cron'),
    ('daily-index-rent-calculations', 'Berechnet Indexmieten-Anpassungen basierend auf dem VPI', 'pg_cron'),
    ('daily-rent-increase-reminders', 'Erstellt Erinnerungen fuer faellige Mieterhoehungen', 'pg_cron'),
    ('daily-sitemap-generation', 'Generiert die sitemap.xml fuer Suchmaschinen via Edge Function', 'pg_cron'),
    ('daily-update-monthly-feature-count', 'Aktualisiert die Anzahl neuer Funktionen im laufenden Monat fuer die Startseite', 'pg_cron'),
    ('process-email-queue', 'Verarbeitet die E-Mail-Warteschlange und versendet ausstehende E-Mails via Edge Function', 'pg_cron'),
    ('process-letterxpress-queue', 'Verarbeitet die Brief-Warteschlange und sendet ausstehende Druckauftraege an LetterXpress (alle 2 Minuten)', 'pg_cron'),
    ('cleanup-bank-import-files-daily', 'Bereinigt abgelaufene Bank-Import-Dateien aus dem Storage', 'pg_cron'),
    ('sync-stripe-invoices-daily', 'Synchronisiert Stripe-Rechnungen und Gutschriften in die lokale Datenbank', 'pg_cron'),
    ('weekly-interest-rate-fetch', 'Importiert woechentlich Bauzinsen-Zeitreihen der Deutschen Bundesbank (BBIM1)', 'pg_cron'),
    ('resolve-geo-data', 'Loest Stadt und Land fuer Login- und Registrierungs-IPs auf (ip-api.com mit Fallback auf ipapi.co)', 'pg_cron'),
    ('daily-process-loan-reminders', 'Prueft faellige Darlehens-Erinnerungen und erstellt Benachrichtigungen', 'pg_cron'),
    ('daily-trial-ending-emails', 'Sendet E-Mails an Nutzer deren Testphase bald endet', 'pg_cron'),
    ('daily-trial-ended-emails', 'Sendet E-Mails an Nutzer deren Testphase abgelaufen ist', 'pg_cron'),
    ('sync-letterxpress-jobs', 'Synchronisiert LetterXpress-Druckauftraege aller aktiven Accounts (Status, Kosten, Tracking)', 'pg_cron'),
    ('signup-healthcheck', 'Synthetischer Registrierungstest: Prueft alle 10 Minuten ob der komplette Signup-Flow funktioniert (User-Erstellung, Trigger, Profile)', 'pg_cron'),
    ('signup-funnel-anomaly-check', 'Analysiert Registrierungsmuster und erkennt Anomalien (hohe Fehlerrate, keine Erfolge trotz Versuchen). Sendet Alarm-E-Mail bei Problemen.', 'pg_cron'),
    ('cleanup-old-health-checks', 'Bereinigt Health-Check-Eintraege aelter als 30 Tage', 'pg_cron'),
    ('daily-fix-orphaned-rented-units', 'Setzt den Status von Wohneinheiten auf leer, wenn kein aktiver Mietvertrag mehr besteht', 'pg_cron')
),

all_jobs AS (
  SELECT
    pj.jobname::text,
    COALESCE(jm.jtype, 'pg_cron')::text,
    COALESCE(jm.jdesc, 'pg_cron Job: ' || pj.jobname)::text,
    pj.schedule::text,
    pj.active,
    pl.start_time,
    pl.status::text,
    pl.return_message::text,
    (CASE
      WHEN pl.end_time IS NOT NULL AND pl.start_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (pl.end_time - pl.start_time)) * 1000
      ELSE NULL
    END)::double precision,
    COALESCE(pc.cnt_24h, 0)::bigint,
    COALESCE(pc.cnt_7d, 0)::bigint,
    COALESCE(pc.fail_7d, 0)::bigint,
    COALESCE(ph.runs, '[]'::jsonb),
    (CASE
      WHEN pl.status = 'failed' THEN 'error'
      WHEN pl.start_time IS NULL THEN 'unknown'
      WHEN pj.active = false THEN 'warning'
      WHEN pj.schedule = '* * * * *' AND pl.start_time < now() - interval '5 minutes' THEN 'warning'
      WHEN pj.schedule ~ '^\*/[0-9]+ \* \* \* \*$' AND pl.start_time < now() - interval '20 minutes' THEN 'warning'
      WHEN pj.schedule LIKE '0 _ * * 1' AND pl.start_time < now() - interval '8 days' THEN 'warning'
      WHEN pl.start_time < now() - interval '26 hours' THEN 'warning'
      ELSE 'healthy'
    END)::text
  FROM cron.job pj
  LEFT JOIN job_meta jm ON jm.jname = pj.jobname
  LEFT JOIN pgcron_latest pl ON pl.jobname = pj.jobname
  LEFT JOIN pgcron_counts pc ON pc.jobname = pj.jobname
  LEFT JOIN pgcron_history ph ON ph.jobname = pj.jobname
)

SELECT * FROM all_jobs
ORDER BY 1;

END;
$$;
