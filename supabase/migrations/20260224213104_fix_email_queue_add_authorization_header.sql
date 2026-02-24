/*
  # Fix email queue: add Authorization header to pg_net call

  1. Problem
    - The `process_email_queue_via_pg_net` function calls the `send-email`
      edge function via pg_net but does NOT include an Authorization header.
    - The `send-email` edge function has `verify_jwt: true`, so every call
      returns HTTP 401 "Missing authorization header".
    - This causes all queued emails (including admin registration
      notifications) to remain stuck in 'queued' status forever.

  2. Fix
    - Add the `Authorization: Bearer <anon_key>` and `apikey` headers to the
      pg_net HTTP POST call so the edge function accepts the request.
    - The anon key is safe to embed because it is a public key that only
      grants access controlled by RLS policies. The send-email function
      uses its own service role client internally.

  3. Important Notes
    - Previous emails that were sent successfully went through when the
      function was deployed with verify_jwt: false or via a different
      code path.
    - This migration also processes any currently stuck 'queued' emails
      by updating the function and relying on the next cron tick.
*/

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

  FOR v_email IN
    SELECT id, mail_type, category, to_email, user_id, subject,
           idempotency_key, metadata
    FROM public.email_logs
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 20
  LOOP
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
