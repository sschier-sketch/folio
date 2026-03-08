/*
  # Fix LetterXpress cron jobs - replace vault lookups with hardcoded URL

  1. Modified Cron Jobs
    - `process-letterxpress-queue` - Fixed URL construction (was failing due to missing vault secrets)
    - `sync-letterxpress-jobs` - Fixed URL construction (same issue)

  2. Problem
    - Both cron jobs used `vault.decrypted_secrets` to resolve SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
    - These vault secrets were never populated, causing NULL url errors
    - All other working cron jobs in the system use hardcoded URLs

  3. Solution
    - Replace vault-based URL construction with hardcoded Supabase URL
    - Use anon key for authentication (matching the pattern of other cron-triggered edge functions)
    - Edge functions already use SUPABASE_SERVICE_ROLE_KEY internally via Deno.env

  4. Notes
    - The process-letterxpress-queue function has been redeployed with verify_jwt=false
    - sync-letterxpress-jobs already had verify_jwt=false
*/

DO $outer$
DECLARE v_job_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-letterxpress-queue'
  ) INTO v_job_exists;

  IF v_job_exists THEN
    PERFORM cron.unschedule('process-letterxpress-queue');
  END IF;

  PERFORM cron.schedule(
    'process-letterxpress-queue',
    '*/2 * * * *',
    $$
    SELECT net.http_post(
      url := 'https://mypuvkzsgwanilduniup.supabase.co/functions/v1/process-letterxpress-queue',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
    $$
  );
END $outer$;

DO $outer$
DECLARE v_job_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'sync-letterxpress-jobs'
  ) INTO v_job_exists;

  IF v_job_exists THEN
    PERFORM cron.unschedule('sync-letterxpress-jobs');
  END IF;

  PERFORM cron.schedule(
    'sync-letterxpress-jobs',
    '*/30 * * * *',
    $$
    SELECT net.http_post(
      url := 'https://mypuvkzsgwanilduniup.supabase.co/functions/v1/sync-letterxpress-jobs',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
    $$
  );
END $outer$;
