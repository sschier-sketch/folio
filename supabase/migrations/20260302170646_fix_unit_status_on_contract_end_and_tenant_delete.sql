/*
  # Fix unit status cleanup on all contract/tenant lifecycle events

  1. New Trigger Function: `cleanup_units_on_contract_end()`
    - Fires AFTER UPDATE on `rental_contracts`
    - When contract status changes to 'terminated' or 'archived':
      Deletes all `rental_contract_units` rows for that contract,
      which cascades the existing `trigger_rcu_set_vacant` to reset
      property_units.status to 'vacant'

  2. New Trigger Function: `cleanup_units_on_tenant_delete()`
    - Fires BEFORE DELETE on `tenants`
    - Deletes all `rental_contract_units` linked to the tenant's contracts,
      triggering the existing vacant-reset trigger on each unit
    - This prevents orphaned 'rented' units when a tenant is hard-deleted

  3. New Daily Cron Safety Net
    - Runs daily at 00:15 UTC
    - Resets any property_units stuck at 'rented' that have no active
      rental_contract_units link (catches edge cases)

  4. Important Notes
    - All unit status resets go through the existing trigger chain
    - No changes to existing trigger_rcu_set_vacant logic
    - This is a defense-in-depth approach covering all lifecycle paths
*/

-- ==========================================================
-- 1. Trigger: clean up units when contract is terminated/archived
-- ==========================================================
CREATE OR REPLACE FUNCTION cleanup_units_on_contract_end()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('terminated', 'archived')
     AND (OLD.status IS NULL OR OLD.status NOT IN ('terminated', 'archived'))
  THEN
    DELETE FROM rental_contract_units
    WHERE contract_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

DROP TRIGGER IF EXISTS trigger_cleanup_units_on_contract_end ON rental_contracts;
CREATE TRIGGER trigger_cleanup_units_on_contract_end
  AFTER UPDATE ON rental_contracts
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_units_on_contract_end();

-- ==========================================================
-- 2. Trigger: clean up units BEFORE tenant is deleted
-- ==========================================================
CREATE OR REPLACE FUNCTION cleanup_units_on_tenant_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM rental_contract_units
  WHERE contract_id IN (
    SELECT id FROM rental_contracts WHERE tenant_id = OLD.id
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

DROP TRIGGER IF EXISTS trigger_cleanup_units_on_tenant_delete ON tenants;
CREATE TRIGGER trigger_cleanup_units_on_tenant_delete
  BEFORE DELETE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_units_on_tenant_delete();

-- ==========================================================
-- 3. Safety net function: fix any orphaned 'rented' units
-- ==========================================================
CREATE OR REPLACE FUNCTION fix_orphaned_rented_units()
RETURNS integer AS $$
DECLARE
  fixed_count integer := 0;
BEGIN
  UPDATE property_units
  SET status = 'vacant', updated_at = now()
  WHERE status = 'rented'
    AND id NOT IN (
      SELECT rcu.unit_id
      FROM rental_contract_units rcu
      INNER JOIN rental_contracts rc ON rcu.contract_id = rc.id
      WHERE rc.status = 'active'
    );

  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RETURN fixed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- The trigger_prevent_manual_rented fires on UPDATE OF status
-- but fix_orphaned_rented_units changes rented -> vacant, which
-- the prevention trigger only blocks for manual rented -> rented.
-- Setting to 'vacant' is always allowed, so no conflict.

-- Schedule daily safety net at 00:15 UTC
SELECT cron.schedule(
  'daily-fix-orphaned-rented-units',
  '15 0 * * *',
  $$SELECT fix_orphaned_rented_units();$$
);

-- ==========================================================
-- 4. Update admin_get_system_health with new cron job
-- ==========================================================
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
    ('daily-activate-planned-rent-periods', 'Aktiviert geplante Mietperioden, deren Gueltigkeitsdatum erreicht wurde, und aktualisiert die Vertragsdaten', 'pg_cron'),
    ('daily-analytics-snapshot', 'Erstellt taeglichen Snapshot der Nutzungsstatistiken (Benutzer, Pro-Nutzer, Umsatz)', 'pg_cron'),
    ('daily-fix-orphaned-rented-units', 'Sicherheitsnetz: Setzt verwaiste Einheiten mit Status "vermietet" ohne aktiven Mietvertrag auf "frei"', 'pg_cron'),
    ('daily-index-rent-calculations', 'Berechnet Indexmieten-Anpassungen basierend auf dem VPI', 'pg_cron'),
    ('daily-rent-increase-reminders', 'Erstellt Erinnerungen fuer faellige Mieterhoehungen', 'pg_cron'),
    ('daily-sitemap-generation', 'Generiert die sitemap.xml fuer Suchmaschinen via Edge Function', 'pg_cron'),
    ('process-email-queue', 'Verarbeitet die E-Mail-Warteschlange und versendet ausstehende E-Mails via Edge Function', 'pg_cron'),
    ('cleanup-bank-import-files-daily', 'Bereinigt abgelaufene Bank-Import-Dateien aus dem Storage', 'pg_cron'),
    ('sync-stripe-invoices-daily', 'Synchronisiert Stripe-Rechnungen und Gutschriften in die lokale Datenbank', 'pg_cron'),
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
