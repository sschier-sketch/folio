/*
  # Create daily loan reminders cron job

  1. New Function
    - `trigger_process_loan_reminders()` - calls the process-loan-reminders
      Edge Function via pg_net with proper Authorization headers

  2. New Cron Job
    - `daily-loan-reminders` - runs daily at 08:00 UTC (09:00 MEZ / 10:00 MESZ)
    - Checks for pending loan reminders (Zinsbindung-Ende, Kreditende, Sondertilgung)
    - Sends email notifications to users who have email_notification_enabled on their loans

  3. Important Notes
    - The process-loan-reminders Edge Function already existed but was never
      scheduled via cron - it was only callable manually
    - Uses the anon key for Authorization since the Edge Function handles
      service role access internally
    - Non-destructive: only adds new function and cron job
*/

CREATE OR REPLACE FUNCTION public.trigger_process_loan_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
  v_headers jsonb;
BEGIN
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_anon_key,
    'apikey', v_anon_key
  );

  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/process-loan-reminders',
    headers := v_headers,
    body := '{}'::jsonb
  );
END;
$$;

DO $outer$
DECLARE
  v_job_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'daily-loan-reminders'
  ) INTO v_job_exists;

  IF v_job_exists THEN
    PERFORM cron.unschedule('daily-loan-reminders');
  END IF;

  PERFORM cron.schedule(
    'daily-loan-reminders',
    '0 8 * * *',
    $$SELECT public.trigger_process_loan_reminders()$$
  );
END $outer$;
