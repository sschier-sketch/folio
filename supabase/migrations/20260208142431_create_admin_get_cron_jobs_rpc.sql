/*
  # Admin RPC Funktion fuer Cron-Job Uebersicht

  1. Neue Funktionen
    - `admin_get_cron_jobs()` - Gibt alle Cron-Jobs mit letztem Ausfuehrungsstatus zurueck
    - Nur fuer Admin-Benutzer zugaenglich (prueft admin_users Tabelle)

  2. Rueckgabe
    - jobid, jobname, schedule, command, active
    - last_run_at: Zeitpunkt der letzten Ausfuehrung
    - last_status: Status der letzten Ausfuehrung (succeeded/failed)
    - last_return_message: Rueckgabemeldung
    - last_duration_ms: Dauer in Millisekunden
    - recent_runs: JSON-Array der letzten 10 Ausfuehrungen

  3. Sicherheit
    - Funktion ist SECURITY DEFINER um auf cron-Schema zuzugreifen
    - Prueft ob aufrufender Nutzer in admin_users eingetragen ist
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
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Zugriff verweigert: Nur Administratoren koennen Cron-Jobs einsehen';
  END IF;

  RETURN QUERY
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
  ORDER BY j.jobname;
END;
$$;
