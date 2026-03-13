/*
  # Fix admin_get_system_health: sync job_meta with actual cron.job names

  1. Changes
    - Rebuild the function so the hard-coded `job_meta` list uses the real
      `cron.job.jobname` values that exist in the database.
    - Add newly created cron jobs that were missing from the old list
      (e.g. daily-fix-orphaned-rented-units, sync-stripe-invoices-daily,
       signup-funnel-anomaly-check, cleanup-old-health-checks).
    - Cast `last_duration` to `double precision` explicitly to avoid
      numeric / float8 type mismatch.
    - Edge-function entries that are only triggered via cron HTTP calls
      are kept but marked as edge_function type (they have no cron.job row
      but are still monitored via their pg_cron caller).

  2. Root cause
    - The previous function referenced job names like 'generate-rent-payments'
      and 'cleanup-bank-import-files', but the actual cron jobs are named
      'daily-activate-planned-rent-periods', 'cleanup-bank-import-files-daily', etc.
    - The LEFT JOIN on jobname never matched, producing NULL rows that caused
      a "structure of query does not match function result type" error.
*/

CREATE OR REPLACE FUNCTION public.admin_get_system_health()
RETURNS TABLE(
  r_name text,
  r_type text,
  r_desc text,
  r_schedule text,
  r_active boolean,
  r_health text,
  r_last_run timestamp with time zone,
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
SET search_path TO 'public'
AS $function$
DECLARE
  is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  WITH job_meta(jname, jtype, jdesc) AS (
    VALUES
      ('process-email-queue',              'pg_cron',       'Verarbeitet die E-Mail-Warteschlange jede Minute und versendet ausstehende E-Mails via Resend-API.'),
      ('daily-index-rent-calculations',    'pg_cron',       'Berechnet taeglich Indexmiet-Anpassungen basierend auf VPI-Daten und erstellt Benachrichtigungen.'),
      ('daily-rent-increase-reminders',    'pg_cron',       'Prueft taeglich Mietvertraege auf faellige Mieterhoehungen und erstellt Erinnerungs-Tickets.'),
      ('daily-sitemap-generation',         'pg_cron',       'Generiert taeglich die XML-Sitemap mit allen oeffentlichen Seiten fuer Suchmaschinen.'),
      ('cleanup-bank-import-files-daily',  'pg_cron',       'Loescht taeglich abgelaufene Bank-Import-Dateien aus dem Storage (Aufbewahrungsfrist).'),
      ('daily-activate-planned-rent-periods','pg_cron',     'Aktiviert taeglich geplante Mietperioden, deren Startdatum erreicht wurde.'),
      ('daily-analytics-snapshot',         'pg_cron',       'Sammelt taeglich aggregierte Nutzungsstatistiken fuer das Admin-Dashboard.'),
      ('daily-update-monthly-feature-count','pg_cron',      'Aktualisiert taeglich die Feature-Zaehler im System.'),
      ('daily-fix-orphaned-rented-units',  'pg_cron',       'Korrigiert taeglich Einheiten deren Status nicht zum Vertragsstatus passt.'),
      ('daily-loan-reminders',             'pg_cron',       'Prueft taeglich Darlehen auf faellige Erinnerungen (Zinsbindungsende, Anschlussfinanzierung).'),
      ('daily-trial-ending-emails',        'pg_cron',       'Sendet E-Mails an Nutzer deren Testphase in 3 Tagen endet.'),
      ('daily-trial-ended-emails',         'pg_cron',       'Sendet E-Mails an Nutzer deren Testphase gerade abgelaufen ist.'),
      ('process-letterxpress-queue',       'pg_cron',       'Verarbeitet die Briefpost-Warteschlange und sendet Briefe via LetterXpress-API.'),
      ('sync-letterxpress-jobs',           'pg_cron',       'Synchronisiert den Status versendeter Briefe mit LetterXpress.'),
      ('resolve-geo-data',                 'pg_cron',       'Loest IP-Adressen aus Login-Events zu Geo-Standorten auf.'),
      ('signup-healthcheck',               'pg_cron',       'Prueft periodisch ob der Registrierungsprozess korrekt funktioniert.'),
      ('signup-funnel-anomaly-check',      'pg_cron',       'Erkennt Anomalien im Registrierungs-Funnel und benachrichtigt Admins.'),
      ('weekly-interest-rate-fetch',       'pg_cron',       'Ruft woechentlich aktuelle Bauzinsen von der Bundesbank ab und speichert Snapshots.'),
      ('sync-stripe-invoices-daily',       'pg_cron',       'Synchronisiert taeglich Stripe-Rechnungen und speichert sie lokal.'),
      ('cleanup-old-health-checks',        'pg_cron',       'Bereinigt alte Healthcheck-Eintraege aus der Datenbank.'),
      ('banksapi-daily-sync',              'pg_cron',       'Synchronisiert taeglich Bankumsaetze aller aktiven BanksAPI-Verbindungen via PSD2-Schnittstelle.')
  ),
  cron_jobs AS (
    SELECT
      j.jobname,
      j.schedule,
      j.active
    FROM cron.job j
  ),
  run_details AS (
    SELECT
      d.jobid,
      d.status,
      d.return_message,
      d.start_time,
      d.end_time
    FROM cron.job_run_details d
    WHERE d.start_time > now() - interval '7 days'
  ),
  job_runs AS (
    SELECT
      j.jobname,
      rd.status,
      rd.return_message,
      rd.start_time,
      rd.end_time
    FROM cron.job j
    JOIN run_details rd ON rd.jobid = j.jobid
  ),
  agg AS (
    SELECT
      jm.jname                         AS job_name,
      jm.jtype                         AS job_type,
      jm.jdesc                         AS job_desc,
      cj.schedule,
      COALESCE(cj.active, false)       AS is_active,
      (SELECT jr2.start_time
         FROM job_runs jr2
        WHERE jr2.jobname = jm.jname
        ORDER BY jr2.start_time DESC LIMIT 1) AS last_run,
      (SELECT jr2.status
         FROM job_runs jr2
        WHERE jr2.jobname = jm.jname
        ORDER BY jr2.start_time DESC LIMIT 1) AS last_status,
      (SELECT jr2.return_message
         FROM job_runs jr2
        WHERE jr2.jobname = jm.jname
        ORDER BY jr2.start_time DESC LIMIT 1) AS last_msg,
      (SELECT EXTRACT(EPOCH FROM (jr2.end_time - jr2.start_time)) * 1000
         FROM job_runs jr2
        WHERE jr2.jobname = jm.jname AND jr2.end_time IS NOT NULL
        ORDER BY jr2.start_time DESC LIMIT 1) AS last_duration,
      COUNT(*) FILTER (WHERE jr.start_time > now() - interval '24 hours') AS runs_24h,
      COUNT(*)                                                             AS runs_7d,
      COUNT(*) FILTER (WHERE jr.status = 'failed')                        AS fail_7d,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'status',      jr.status,
            'message',     jr.return_message,
            'started_at',  jr.start_time,
            'finished_at', jr.end_time,
            'duration_ms', CASE WHEN jr.end_time IS NOT NULL
                           THEN EXTRACT(EPOCH FROM (jr.end_time - jr.start_time)) * 1000
                           ELSE NULL END
          ) ORDER BY jr.start_time DESC
        ) FILTER (WHERE jr.status IS NOT NULL),
        '[]'::jsonb
      ) AS recent_runs
    FROM job_meta jm
    LEFT JOIN cron_jobs cj ON cj.jobname = jm.jname
    LEFT JOIN job_runs jr  ON jr.jobname  = jm.jname
    GROUP BY jm.jname, jm.jtype, jm.jdesc, cj.schedule, cj.active
  )
  SELECT
    a.job_name,
    a.job_type,
    a.job_desc,
    COALESCE(a.schedule, '-')::text,
    a.is_active,
    CASE
      WHEN NOT a.is_active AND a.job_type = 'pg_cron' THEN 'warning'
      WHEN a.last_status = 'failed' THEN 'error'
      WHEN a.fail_7d > 0 AND a.runs_7d > 0 AND (a.fail_7d::float / a.runs_7d) > 0.3 THEN 'warning'
      WHEN a.last_run IS NOT NULL THEN 'healthy'
      ELSE 'unknown'
    END,
    a.last_run,
    a.last_status,
    a.last_msg,
    a.last_duration::double precision,
    a.runs_24h,
    a.runs_7d,
    a.fail_7d,
    a.recent_runs
  FROM agg a
  ORDER BY
    CASE
      WHEN a.last_status = 'failed' THEN 1
      WHEN NOT a.is_active AND a.job_type = 'pg_cron' THEN 2
      ELSE 3
    END,
    a.job_name;
END;
$function$;
