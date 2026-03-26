/*
  # Fix email queue: pass from and replyTo to send-email

  1. Problem
    - The `process_email_queue_via_pg_net` function does not pass
      `from` and `replyTo` fields to the send-email edge function.
    - Engagement emails need to be sent from yvonne@rentab.ly, not
      the default hallo@rentab.ly address.

  2. Fix
    - Read `metadata->>'sender_override'` and `metadata->>'reply_to'`
      from the email_logs entry and include them in the payload as
      `from` and `replyTo` parameters.
    - This allows any queued email to specify a custom sender.

  3. Important Notes
    - Backwards compatible: if the metadata fields are null, no
      `from`/`replyTo` are added and the default sender is used.
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
  v_sender_override text;
  v_reply_to text;
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

    v_sender_override := v_email.metadata->>'sender_override';
    v_reply_to := v_email.metadata->>'reply_to';

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

    IF v_sender_override IS NOT NULL THEN
      v_payload := v_payload || jsonb_build_object('from', v_sender_override);
    END IF;

    IF v_reply_to IS NOT NULL THEN
      v_payload := v_payload || jsonb_build_object('replyTo', v_reply_to);
    END IF;

    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/send-email',
      headers := v_headers,
      body := v_payload
    );
  END LOOP;
END;
$$;
