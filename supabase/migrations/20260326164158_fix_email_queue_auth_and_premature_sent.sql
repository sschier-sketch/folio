/*
  # Fix critical email queue processing function

  1. Problem
    - The `process_email_queue_via_pg_net` function has two critical bugs:
      a) No Authorization header in the pg_net HTTP call to send-email.
         The send-email edge function has verifyJWT=true, so all requests
         are rejected with HTTP 401. Emails never reach Resend.
      b) The function immediately marks emails as 'sent' BEFORE the async
         pg_net HTTP response is received. This creates false positives
         in email_logs -- emails appear as "sent" but were never delivered.
    - This caused admin registration notification emails (and potentially
      other queued emails) to silently fail since approximately March 20.

  2. Fix
    - Add Authorization Bearer and apikey headers using the anon key
      (which is a public key, safe to embed in server-side functions)
    - Change the post-dispatch status to 'processing' instead of 'sent'
      so the send-email edge function can update to 'sent' on success
      or 'failed' on error
    - Add a stale 'processing' recovery: emails stuck in 'processing'
      for >10 minutes are reset to 'queued' for retry
    - Add the 'processing' value to the email_logs status check constraint
      if it doesn't already exist

  3. Affected emails
    - admin_new_registration emails from March 24 and 25 were marked as
      'sent' but never delivered to Resend
    - Any other email that went through the queue in this period

  4. Important Notes
    - The anon key is already publicly visible in the frontend .env
    - send-email uses its own service role client internally
    - pg_net is fire-and-forget, so we cannot wait for the response
    - The send-email function handles idempotency and final status updates
*/

-- Step 1: Ensure 'processing' is a valid status in email_logs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name LIKE '%email_logs%status%'
  ) THEN
    ALTER TABLE email_logs DROP CONSTRAINT IF EXISTS email_logs_status_check;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'email_logs_status_check'
  ) THEN
    ALTER TABLE email_logs ADD CONSTRAINT email_logs_status_check
      CHECK (status IN ('queued', 'processing', 'sent', 'failed', 'skipped'));
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint already exists or could not be added: %', SQLERRM;
END $$;

-- Step 2: Fix the function with auth headers and correct status handling
CREATE OR REPLACE FUNCTION public.process_email_queue_via_pg_net()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email record;
  v_payload jsonb;
  v_supabase_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
  v_anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cHV2a3pzZ3dhbmlsZHVuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NjY2NTgsImV4cCI6MjA4MDU0MjY1OH0.N-N2Vs8QrlOmWeA0CxJmAXyVs0JClqbWb3Tm5Ze15WA';
  v_headers jsonb;
BEGIN
  v_headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || v_anon_key,
    'apikey', v_anon_key
  );

  UPDATE public.email_logs
  SET status = 'queued'
  WHERE status = 'processing'
    AND created_at < NOW() - INTERVAL '10 minutes';

  FOR v_email IN
    SELECT id, mail_type, category, to_email, user_id, subject,
           idempotency_key, metadata
    FROM public.email_logs
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 20
  LOOP
    UPDATE public.email_logs
    SET status = 'processing'
    WHERE id = v_email.id;

    IF (v_email.metadata->>'send_raw')::boolean IS TRUE
       AND v_email.metadata->>'raw_html' IS NOT NULL THEN
      v_payload := jsonb_build_object(
        'to', v_email.to_email,
        'subject', v_email.subject,
        'html', v_email.metadata->>'raw_html',
        'mailType', v_email.mail_type,
        'category', COALESCE(v_email.category, 'transactional'),
        'idempotencyKey', v_email.idempotency_key
      );
    ELSE
      v_payload := jsonb_build_object(
        'to', v_email.to_email,
        'subject', v_email.subject,
        'templateKey', COALESCE(v_email.metadata->>'template_key', v_email.mail_type),
        'mailType', v_email.mail_type,
        'category', COALESCE(v_email.category, 'transactional'),
        'userId', v_email.user_id,
        'variables', COALESCE(v_email.metadata->'variables', '{}'::jsonb),
        'idempotencyKey', v_email.idempotency_key
      );
    END IF;

    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-email',
      headers := v_headers,
      body := v_payload
    );
  END LOOP;
END;
$$;
