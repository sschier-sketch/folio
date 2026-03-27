/*
  # Fix all cron jobs: add proper timeout and auth headers

  1. Problem
    - Cron jobs using net.http_post to call edge functions have default timeout of 5 seconds
    - 5 seconds is too short for any edge function that does real work
    - Some cron jobs missing Authorization headers
    - pg_cron reports "succeeded" when it enqueues the request, regardless of edge function outcome

  2. Fix
    - Update all trigger functions to include auth headers AND 60-second timeout
    - Create new trigger functions for jobs that previously used inline SQL
    - Use cron.alter_job to update commands

  3. Affected Jobs (all edge-function-calling cron jobs)
    - banksapi-daily-sync, daily-sitemap-generation, process-letterxpress-queue
    - sync-letterxpress-jobs, resolve-geo-data, signup-healthcheck
    - weekly-interest-rate-fetch, daily-trial-ending-emails, daily-trial-ended-emails
    - daily-inactive-user-with-property, daily-no-property-reminder
    - cleanup-bank-import-files-daily, daily-loan-reminders, sync-stripe-invoices-daily
*/

-- ============================================================
-- TRIGGER FUNCTIONS (with auth headers + 60s timeout)
-- ============================================================

-- banksapi-daily-sync
CREATE OR REPLACE FUNCTION public.trigger_banksapi_daily_sync()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/banksapi-daily-sync',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- sitemap
CREATE OR REPLACE FUNCTION public.trigger_sitemap_generation()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/sitemap',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{"action":"regenerate"}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- process-letterxpress-queue
CREATE OR REPLACE FUNCTION public.trigger_process_letterxpress_queue()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/process-letterxpress-queue',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- sync-letterxpress-jobs
CREATE OR REPLACE FUNCTION public.trigger_sync_letterxpress_jobs()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/sync-letterxpress-jobs',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- resolve-geo
CREATE OR REPLACE FUNCTION public.trigger_resolve_geo()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/resolve-geo',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- signup-healthcheck
CREATE OR REPLACE FUNCTION public.trigger_signup_healthcheck()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/signup-healthcheck',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- fetch-interest-rates
CREATE OR REPLACE FUNCTION public.trigger_fetch_interest_rates()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/fetch-interest-rates',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- Fix existing trigger functions that were missing auth or timeout:

-- trigger_cron_trial_ending
CREATE OR REPLACE FUNCTION trigger_cron_trial_ending()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/cron-trial-ending',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- trigger_cron_trial_ended
CREATE OR REPLACE FUNCTION trigger_cron_trial_ended()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/cron-trial-ended',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- trigger_cron_inactive_user_with_property
CREATE OR REPLACE FUNCTION trigger_cron_inactive_user_with_property()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/cron-inactive-user-with-property',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- trigger_cron_no_property_reminder
CREATE OR REPLACE FUNCTION trigger_cron_no_property_reminder()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/cron-no-property-reminder',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- trigger_cleanup_bank_import_files (already had auth, adding timeout)
CREATE OR REPLACE FUNCTION trigger_cleanup_bank_import_files()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/cleanup-bank-import-files',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- trigger_process_loan_reminders (already had auth, adding timeout)
CREATE OR REPLACE FUNCTION trigger_process_loan_reminders()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/process-loan-reminders',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

-- trigger_sync_stripe_invoices_daily (had service_role attempt, fixing to use anon + timeout)
CREATE OR REPLACE FUNCTION trigger_sync_stripe_invoices_daily()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
BEGIN
  PERFORM net.http_post(
    url := v_url || '/functions/v1/sync-stripe-invoices',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_key,'apikey',v_key),
    body := '{"source":"cron"}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;


-- ============================================================
-- UPDATE CRON JOBS to use trigger functions instead of inline SQL
-- ============================================================

SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'banksapi-daily-sync'),
  command := 'SELECT public.trigger_banksapi_daily_sync()'
);

SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'daily-sitemap-generation'),
  command := 'SELECT public.trigger_sitemap_generation()'
);

SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'process-letterxpress-queue'),
  command := 'SELECT public.trigger_process_letterxpress_queue()'
);

SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'sync-letterxpress-jobs'),
  command := 'SELECT public.trigger_sync_letterxpress_jobs()'
);

SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'resolve-geo-data'),
  command := 'SELECT public.trigger_resolve_geo()'
);

SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'signup-healthcheck'),
  command := 'SELECT public.trigger_signup_healthcheck()'
);

SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'weekly-interest-rate-fetch'),
  command := 'SELECT public.trigger_fetch_interest_rates()'
);
