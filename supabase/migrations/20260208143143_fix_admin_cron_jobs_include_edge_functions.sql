/*
  # Fix admin_get_cron_jobs: Alle Cron-Quellen zusammenfuehren

  1. Aenderungen
    - search_path um auth, extensions erweitert (behebt auth.uid()-Fehler)
    - Neue RPC: admin_get_all_cron_jobs() 
      - Kombiniert pg_cron Jobs UND Edge-Function Cron Jobs (aus cron_runs)
      - Gibt einheitliches Format zurueck
    - Alte Funktion admin_get_cron_jobs() wird durch neue ersetzt

  2. Datenquellen
    - cron.job + cron.job_run_details: pg_cron Jobs (Index-Rent, Rent-Increase-Reminders)
    - cron_runs: Edge Function Jobs (trial-ending, trial-ended, process-email-queue, process-loan-reminders)

  3. Sicherheit
    - Nur Admins koennen die Funktion aufrufen (admin_users-Pruefung)
    - SECURITY DEFINER fuer cron-Schema-Zugriff
*/

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
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Zugriff verweigert: Nur Administratoren koennen Cron-Jobs einsehen';
  END IF;

  RETURN QUERY

  -- pg_cron jobs
  SELECT
    j.jobid,
    j.jobname,
    j.schedule,
    j.command,
    j.active,
    latest.start_time AS last_run_at,
    latest.status AS last_status,
    latest.return_message AS last_return_message,
    CASE
      WHEN latest.end_time IS NOT NULL AND latest.start_time IS NOT NULL
      THEN EXTRACT(EPOCH FROM (latest.end_time - latest.start_time)) * 1000
      ELSE NULL
    END AS last_duration_ms,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'runid', r.runid,
            'status', r.status,
            'return_message', r.return_message,
            'start_time', r.start_time,
            'end_time', r.end_time,
            'duration_ms', CASE
              WHEN r.end_time IS NOT NULL AND r.start_time IS NOT NULL
              THEN EXTRACT(EPOCH FROM (r.end_time - r.start_time)) * 1000
              ELSE NULL
            END
          ) ORDER BY r.start_time DESC
        )
        FROM (
          SELECT rd.*
          FROM cron.job_run_details rd
          WHERE rd.jobid = j.jobid
          ORDER BY rd.start_time DESC
          LIMIT 20
        ) r
      ),
      '[]'::jsonb
    ) AS recent_runs
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT jrd.start_time, jrd.end_time, jrd.status, jrd.return_message
    FROM cron.job_run_details jrd
    WHERE jrd.jobid = j.jobid
    ORDER BY jrd.start_time DESC
    LIMIT 1
  ) latest ON true

  UNION ALL

  -- Edge Function cron jobs (from cron_runs table)
  SELECT
    (ROW_NUMBER() OVER (ORDER BY ef.job_name) + 10000)::bigint AS jobid,
    ef.job_name AS jobname,
    CASE ef.job_name
      WHEN 'cron-trial-ending' THEN 'extern (taeglich)'
      WHEN 'cron-trial-ended' THEN 'extern (taeglich)'
      WHEN 'process-email-queue' THEN 'extern (alle 5-15 min)'
      WHEN 'process-loan-reminders' THEN 'extern (taeglich)'
      ELSE 'extern'
    END AS schedule,
    'Edge Function: ' || ef.job_name AS command,
    true AS active,
    ef_latest.started_at AS last_run_at,
    ef_latest.status AS last_status,
    ef_latest.error_message AS last_return_message,
    CASE
      WHEN ef_latest.finished_at IS NOT NULL AND ef_latest.started_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ef_latest.finished_at - ef_latest.started_at)) * 1000
      ELSE NULL
    END AS last_duration_ms,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'runid', row_number,
            'status', cr.status,
            'return_message', COALESCE(cr.error_message, 
              'Verarbeitet: ' || COALESCE(cr.processed_count, 0) || 
              ', Gesendet: ' || COALESCE(cr.sent_count, 0) || 
              ', Fehler: ' || COALESCE(cr.failed_count, 0) ||
              ', Uebersprungen: ' || COALESCE(cr.skipped_count, 0)
            ),
            'start_time', cr.started_at,
            'end_time', cr.finished_at,
            'duration_ms', CASE
              WHEN cr.finished_at IS NOT NULL AND cr.started_at IS NOT NULL
              THEN EXTRACT(EPOCH FROM (cr.finished_at - cr.started_at)) * 1000
              ELSE NULL
            END
          ) ORDER BY cr.started_at DESC
        )
        FROM (
          SELECT cr2.*, ROW_NUMBER() OVER (ORDER BY cr2.started_at DESC) AS row_number
          FROM public.cron_runs cr2
          WHERE cr2.job_name = ef.job_name
          ORDER BY cr2.started_at DESC
          LIMIT 20
        ) cr
      ),
      '[]'::jsonb
    ) AS recent_runs
  FROM (
    SELECT DISTINCT job_name FROM public.cron_runs
  ) ef
  LEFT JOIN LATERAL (
    SELECT cr3.started_at, cr3.finished_at, cr3.status, cr3.error_message
    FROM public.cron_runs cr3
    WHERE cr3.job_name = ef.job_name
    ORDER BY cr3.started_at DESC
    LIMIT 1
  ) ef_latest ON true

  ORDER BY jobname;
END;
$$;
