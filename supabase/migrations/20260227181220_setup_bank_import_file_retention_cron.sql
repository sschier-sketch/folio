/*
  # Bank Import File Retention Cron Job

  ## Overview
  Sets up a daily cron job that invokes the cleanup-bank-import-files
  edge function to delete raw import files older than 15 days from storage.

  ## Details
  - Runs daily at 03:00 UTC
  - Only deletes the raw file from storage; import metadata remains
  - Rollback remains possible as long as transactions still exist
  - Uses pg_cron + pg_net to call the edge function
*/

SELECT cron.schedule(
  'cleanup-bank-import-files-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1)
           || '/functions/v1/cleanup-bank-import-files',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
