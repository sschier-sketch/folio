/*
  # Fix resolve-geo-data cron job - remove vault dependency

  1. Problem
    - The cron job used vault.decrypted_secrets to get SUPABASE_URL
      and SUPABASE_SERVICE_ROLE_KEY, but these secrets are not stored
      in the vault, causing null URL errors
    - Error: null value in column "url" of relation "http_request_queue"

  2. Fix
    - Replace vault lookups with direct URL (matching the pattern
      used by all other working edge function cron jobs)
    - The resolve-geo edge function has verify_jwt disabled so no
      Authorization header is needed

  3. Notes
    - Drops and recreates the cron job with corrected command
    - Schedule remains at every 5 minutes
*/

SELECT cron.unschedule('resolve-geo-data');

SELECT cron.schedule(
  'resolve-geo-data',
  '*/5 * * * *',
  $$SELECT net.http_post(
    url := 'https://mypuvkzsgwanilduniup.supabase.co/functions/v1/resolve-geo',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )$$
);
