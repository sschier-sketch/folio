/*
  # Fix monthly feature count - add realtime trigger

  1. Problem
    - The monthly_feature_count in system_settings was only updated by a daily
      cron job (00:05 UTC), so it could be stale for up to 24 hours after a
      system update was published or unpublished.
    - This caused the landing page to show "2 neue Funktionen" when there were
      actually 3 published updates in the current month.

  2. Solution
    - Add a trigger on the system_updates table that recalculates the count
      immediately whenever a row is inserted, updated, or deleted.
    - The daily cron job is kept as a safety net, but the trigger ensures the
      count is always up-to-date in real time.

  3. Immediate Fix
    - Run the count function once to correct the current stale value.
*/

CREATE OR REPLACE FUNCTION public.sync_monthly_feature_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM system_updates
  WHERE is_published = true
    AND published_at >= date_trunc('month', now());

  UPDATE system_settings
  SET monthly_feature_count = v_count
  WHERE id = 1;

  RETURN NULL;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_sync_monthly_feature_count ON system_updates;

CREATE TRIGGER trg_sync_monthly_feature_count
  AFTER INSERT OR UPDATE OR DELETE ON system_updates
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.sync_monthly_feature_count();

-- Immediately fix the stale value
SELECT update_monthly_feature_count();
