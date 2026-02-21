/*
  # Create reliable email queue processing via pg_cron + pg_net

  1. Changes
    - Creates function `process_email_queue_via_pg_net()` that:
      - Selects up to 20 queued emails from `email_logs`
      - Immediately marks them as 'processing' to prevent double-sends
      - For each email, builds the correct payload (raw HTML or template-based)
      - Fires an async HTTP POST to the `send-email` Edge Function via `pg_net`
      - The Edge Function handles actual sending, status updates, and logging
    - Creates a pg_cron job `process-email-queue` that runs every minute
    - This replaces the previous approach where an external cron was supposed
      to call the `process-email-queue` Edge Function (which was never set up)

  2. How it works
    - pg_cron runs the DB function every minute
    - The DB function uses pg_net (async HTTP) to call send-email for each queued mail
    - send-email sends via Resend API and updates email_logs status to 'sent' or 'failed'
    - Idempotency keys prevent duplicate sends
    - If a mail stays in 'processing' for >10 minutes (e.g. edge function crashed),
      it gets reset to 'queued' for retry

  3. Security
    - Function runs as SECURITY DEFINER to access email_logs
    - send-email Edge Function has verifyJWT=false, so pg_net can call it directly
    - No secrets stored in the database

  4. Important Notes
    - This is 100% server-side, no browser/frontend dependency
    - pg_cron is reliable infrastructure managed by Supabase
    - pg_net is async and non-blocking
    - The idempotency_key on send-email prevents any duplicate sends
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
        'category', v_email.category,
        'idempotencyKey', v_email.idempotency_key
      );
    ELSE
      v_payload := jsonb_build_object(
        'to', v_email.to_email,
        'subject', v_email.subject,
        'templateKey', COALESCE(v_email.metadata->>'template_key', v_email.mail_type),
        'mailType', v_email.mail_type,
        'category', v_email.category,
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

SELECT cron.unschedule(jobname)
FROM cron.job
WHERE jobname = 'process-email-queue';

SELECT cron.schedule(
  'process-email-queue',
  '* * * * *',
  $$SELECT public.process_email_queue_via_pg_net()$$
);
