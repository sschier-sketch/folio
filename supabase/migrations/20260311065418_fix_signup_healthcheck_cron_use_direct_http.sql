/*
  # Fix signup healthcheck cron job - use direct HTTP call without auth

  1. Changes
    - Unschedules the old `signup-healthcheck` cron job that called `trigger_signup_healthcheck()`
    - Reschedules it as a direct `net.http_post()` call without Authorization header
    - Matches the pattern used by all other working cron-to-edge-function jobs
      (sitemap, resolve-geo, letterxpress, interest-rates, etc.)
    - The edge function has been redeployed with `verify_jwt: false`

  2. Root Cause
    - The old `trigger_signup_healthcheck()` function tried to read the service_role_key
      from `app.settings` and `vault.decrypted_secrets`, both of which are empty
    - This caused the function to silently return without making any HTTP call
    - The cron job reported "succeeded" because the SQL function itself ran fine,
      but the edge function was never actually invoked

  3. Important Notes
    - The edge function itself uses SUPABASE_SERVICE_ROLE_KEY from its own env
      (auto-populated by Supabase) - no need to pass it via the cron caller
    - The wrapper function `trigger_signup_healthcheck()` is dropped as it is no longer needed
*/

DO $$ BEGIN
  PERFORM cron.unschedule('signup-healthcheck');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'signup-healthcheck',
  '*/10 * * * *',
  $$SELECT net.http_post(
    url := 'https://mypuvkzsgwanilduniup.supabase.co/functions/v1/signup-healthcheck',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);

DROP FUNCTION IF EXISTS trigger_signup_healthcheck();
