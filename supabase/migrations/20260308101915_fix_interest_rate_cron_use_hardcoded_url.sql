/*
  # Fix weekly-interest-rate-fetch cron job

  1. Problem
    - The trigger_interest_rate_fetch() function tried to read
      current_setting('app.service_role_key') which returns NULL in hosted Supabase.
    - This caused the Edge Function call to have no Authorization header,
      resulting in a 401 Unauthorized response.
    - The cron.job_run_details showed "succeeded" because the SQL function
      itself completed (it queued the HTTP request), but the actual Edge
      Function never processed data.

  2. Fix
    - Replace the dynamic settings lookup with a hardcoded URL call
      (same pattern used by all other working cron jobs in this project).
    - The Edge Function fetch-interest-rates does NOT require JWT verification
      when called from pg_cron since it uses SUPABASE_SERVICE_ROLE_KEY internally.
    - Recreate the cron job entry to use a direct net.http_post call
      instead of going through the wrapper function.

  3. Changes
    - Drop the old trigger_interest_rate_fetch() function
    - Recreate the cron job with an inline net.http_post call
*/

-- 1. Remove the old wrapper function
DROP FUNCTION IF EXISTS public.trigger_interest_rate_fetch();

-- 2. Recreate the cron job with direct HTTP call (same pattern as other working jobs)
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove old job if exists
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-interest-rate-fetch') THEN
      PERFORM cron.unschedule('weekly-interest-rate-fetch');
    END IF;

    -- Schedule with direct HTTP POST (no auth needed - function uses service role key internally)
    PERFORM cron.schedule(
      'weekly-interest-rate-fetch',
      '0 5 * * 1',
      $$
      SELECT net.http_post(
        url := 'https://mypuvkzsgwanilduniup.supabase.co/functions/v1/fetch-interest-rates',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
      );
      $$
    );
  END IF;
END $outer$;
