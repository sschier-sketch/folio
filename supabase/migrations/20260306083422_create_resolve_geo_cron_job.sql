/*
  # Create cron job for async geo resolution

  1. New Cron Job
    - `resolve-geo-data` - runs every 5 minutes
    - Calls the resolve-geo edge function to fill in city/country
      for login_history and account_profiles entries that have an IP
      but no geo data yet

  2. Notes
    - IP is always saved immediately on login/signup
    - Geo (city + country) is resolved asynchronously by this cron
    - This decouples IP persistence from external API availability
*/

SELECT cron.schedule(
  'resolve-geo-data',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/resolve-geo',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
