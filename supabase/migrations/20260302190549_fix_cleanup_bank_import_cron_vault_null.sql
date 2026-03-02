/*
  # Fix cleanup-bank-import-files cron job null URL error

  1. Problem
    - The `cleanup-bank-import-files-daily` cron job uses
      `vault.decrypted_secrets` to look up `supabase_url` and
      `service_role_key`, but no vault secrets are configured.
    - This causes a NULL url in `net.http_post`, which violates the
      NOT NULL constraint on the `http_request_queue.url` column.

  2. Fix
    - Replace the inline cron command with a wrapper PL/pgSQL function
      `trigger_cleanup_bank_import_files()` that uses the same pattern
      as other working cron-to-edge-function bridges:
      hardcoded Supabase URL + anon key in headers.
    - The edge function itself creates its own service-role client
      internally, so the anon key is sufficient for the HTTP call.

  3. Important Notes
    - Unschedules the broken job and reschedules with the wrapper function
    - No schema changes
*/

-- 1. Create wrapper function
CREATE OR REPLACE FUNCTION public.trigger_cleanup_bank_import_files()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/cleanup-bank-import-files',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_anon_key,
      'apikey', v_anon_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- 2. Unschedule the broken job
SELECT cron.unschedule('cleanup-bank-import-files-daily');

-- 3. Reschedule with the wrapper function
SELECT cron.schedule(
  'cleanup-bank-import-files-daily',
  '0 3 * * *',
  $$SELECT public.trigger_cleanup_bank_import_files()$$
);
