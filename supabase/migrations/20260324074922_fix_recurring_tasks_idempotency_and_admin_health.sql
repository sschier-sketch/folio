/*
  # Fix recurring task generator: idempotency, robustness, admin monitoring

  ## Changes
  1. Rewrite `generate_recurring_maintenance_tasks()` with:
     - Explicit idempotency: before inserting a child, check if one already exists
       for that parent + due_date combination (prevents duplicates on re-run)
     - Source field set to 'recurring' (not 'manual') for generated children
     - Proper catch-up: if cron was offline for N days, it will generate up to
       one task per missed interval, advancing the schedule each time
     - Single-pass loop with a safety cap of 100 generations per parent per run
       (prevents infinite loops if schedule is badly configured)
     - Exception handling per task (one failure doesn't abort the entire batch)
     - Return value now reports how many tasks were generated

  2. Update `admin_get_system_health()` to include the
     `daily-recurring-maintenance-tasks` cron job in the job_meta CTE
     so it appears in the admin monitoring dashboard

  ## Idempotency Strategy
  - Each generated child is unique by (parent_task_id, due_date)
  - Before INSERT, a SELECT checks if that combination already exists
  - If it does, the generation is skipped and the schedule is still advanced
  - This means the cron can run multiple times per day with zero duplicates

  ## Catch-up Behavior
  - If next_recurrence_date is 5 days in the past for a daily task,
    ONE run of the cron will generate all 5 missed instances (each with
    its correct due_date) and advance the schedule to tomorrow
  - Safety cap: max 100 catch-up instances per parent per cron run

  ## Security
  - Function runs as SECURITY DEFINER (unchanged)
  - No RLS changes needed
  - No new tables
*/

-- 1. Rewrite the recurring task generator with idempotency and robustness
CREATE OR REPLACE FUNCTION public.generate_recurring_maintenance_tasks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task record;
  v_next_date date;
  v_count integer := 0;
  v_safety integer;
  v_exists boolean;
BEGIN
  FOR v_task IN
    SELECT *
    FROM maintenance_tasks
    WHERE is_recurring = true
      AND next_recurrence_date IS NOT NULL
      AND next_recurrence_date <= CURRENT_DATE
      AND recurrence_interval IS NOT NULL
  LOOP
    BEGIN
      v_safety := 0;
      v_next_date := v_task.next_recurrence_date;

      WHILE v_next_date <= CURRENT_DATE AND v_safety < 100 LOOP
        v_safety := v_safety + 1;

        SELECT EXISTS (
          SELECT 1 FROM maintenance_tasks
          WHERE parent_task_id = v_task.id
            AND due_date = v_next_date
        ) INTO v_exists;

        IF NOT v_exists THEN
          INSERT INTO maintenance_tasks (
            id, property_id, unit_id, user_id, title, description,
            status, priority, category, source,
            cost, due_date, notes,
            tenant_id, assigned_user_id, ticket_id,
            parent_task_id,
            is_recurring, recurrence_interval, next_recurrence_date,
            notify_tenant_on_status, notify_assignee,
            email_notification_enabled, notification_days_before,
            created_at, updated_at
          ) VALUES (
            gen_random_uuid(),
            v_task.property_id,
            v_task.unit_id,
            v_task.user_id,
            v_task.title,
            v_task.description,
            'open',
            v_task.priority,
            v_task.category,
            'recurring',
            v_task.cost,
            v_next_date,
            v_task.notes,
            v_task.tenant_id,
            v_task.assigned_user_id,
            NULL,
            v_task.id,
            false,
            NULL,
            NULL,
            v_task.notify_tenant_on_status,
            v_task.notify_assignee,
            v_task.email_notification_enabled,
            v_task.notification_days_before,
            now(),
            now()
          );
          v_count := v_count + 1;
        END IF;

        v_next_date := CASE v_task.recurrence_interval
          WHEN 'daily'     THEN v_next_date + INTERVAL '1 day'
          WHEN 'weekly'    THEN v_next_date + INTERVAL '1 week'
          WHEN 'monthly'   THEN v_next_date + INTERVAL '1 month'
          WHEN 'quarterly' THEN v_next_date + INTERVAL '3 months'
          WHEN 'yearly'    THEN v_next_date + INTERVAL '1 year'
          ELSE v_next_date + INTERVAL '1 month'
        END;
      END LOOP;

      UPDATE maintenance_tasks
      SET next_recurrence_date = v_next_date,
          updated_at = now()
      WHERE id = v_task.id;

    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'generate_recurring_maintenance_tasks: error for task %: %', v_task.id, SQLERRM;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 2. Update admin_get_system_health to include the recurring tasks cron job
CREATE OR REPLACE FUNCTION admin_get_system_health()
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
('banksapi-daily-sync',              'pg_cron',       'Synchronisiert taeglich Bankumsaetze aller aktiven BanksAPI-Verbindungen via PSD2-Schnittstelle.'),
('daily-recurring-maintenance-tasks','pg_cron',       'Generiert taeglich neue Aufgaben-Instanzen aus wiederkehrenden Vorlagen (Wartung, Reparatur, etc.).')
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
$$;