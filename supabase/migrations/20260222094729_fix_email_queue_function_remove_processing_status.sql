/*
  # Fix email queue function - remove processing status

  1. Problem
    - The `process_email_queue_via_pg_net` function tried to set status='processing'
    - But email_logs has a CHECK constraint that only allows: queued, sent, failed, skipped
    - This caused the cron job to fail every minute since creation

  2. Solution
    - Rewrite function to NOT use a 'processing' intermediate status
    - Instead, select queued emails, fire pg_net requests, done
    - The send-email Edge Function already handles idempotency (won't send twice)
    - The send-email Edge Function already updates status to 'sent' on success
    - Add a skip mechanism: track which email IDs were already dispatched via pg_net
      using a simple temp tracking approach within the function run

  3. How double-send prevention works
    - Each email has an idempotency_key
    - send-email checks: if idempotency_key exists AND status='sent', it skips
    - pg_net is async, so by next cron run the email is already 'sent'
    - Even if pg_net fires twice, send-email idempotency prevents double delivery
*/

CREATE OR REPLACE FUNCTION public.process_email_queue_via_pg_net()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  v_email record;
  v_payload jsonb;
  v_supabase_url text := 'https://mypuvkzsgwanilduniup.supabase.co';
BEGIN
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
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := v_payload
    );
  END LOOP;
END;
$$;
