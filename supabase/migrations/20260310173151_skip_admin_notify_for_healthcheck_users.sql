/*
  # Skip admin registration notification for healthcheck test users

  1. Changes
    - Updates `notify_admin_on_new_registration()` to skip sending
      admin notification emails when the new user is a healthcheck probe
    - Detected via raw_user_meta_data->>'is_healthcheck_user' = 'true'

  2. Important Notes
    - This prevents the synthetic healthcheck (runs every 10 minutes)
      from flooding the admin inbox with "Neue Registrierung" emails
    - Real user registrations continue to trigger notifications as before
*/

CREATE OR REPLACE FUNCTION notify_admin_on_new_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notify boolean;
  v_email text;
  v_user_email text;
  v_now_text text;
  v_html text;
  v_subject text;
  v_idempotency_key text;
  v_existing_id uuid;
BEGIN
  IF NEW.raw_user_meta_data->>'is_healthcheck_user' = 'true' THEN
    RETURN NEW;
  END IF;

  SELECT notify_on_new_registration, notification_email
  INTO v_notify, v_email
  FROM public.system_settings
  WHERE id = 1;

  IF v_notify IS NOT TRUE OR v_email IS NULL OR v_email = '' THEN
    RETURN NEW;
  END IF;

  v_user_email := COALESCE(NEW.email, 'unbekannt');

  v_idempotency_key := 'admin_notify_registration:' || NEW.id::text;

  SELECT id INTO v_existing_id
  FROM public.email_logs
  WHERE idempotency_key = v_idempotency_key
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_now_text := to_char(
    NOW() AT TIME ZONE 'Europe/Berlin',
    'DD.MM.YYYY, HH24:MI'
  ) || ' Uhr';

  v_subject := 'Neue Registrierung: ' || v_user_email;

  v_html := '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">'
    || '<h2 style="color:#1a1a2e;margin-bottom:16px">Neue Registrierung</h2>'
    || '<p style="color:#4a4a4a;font-size:15px;line-height:1.6">Ein neuer Benutzer hat sich bei Rentably registriert:</p>'
    || '<div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:16px 0">'
    || '<p style="margin:0 0 8px;color:#1a1a2e"><strong>E-Mail:</strong> ' || v_user_email || '</p>'
    || '<p style="margin:0;color:#1a1a2e"><strong>Zeitpunkt:</strong> ' || v_now_text || '</p>'
    || '</div>'
    || '<p style="color:#888;font-size:12px;margin-top:24px">Diese Benachrichtigung wurde automatisch gesendet.</p>'
    || '</div>';

  INSERT INTO public.email_logs (
    id,
    mail_type,
    category,
    to_email,
    user_id,
    subject,
    provider,
    status,
    idempotency_key,
    metadata,
    created_at
  ) VALUES (
    gen_random_uuid(),
    'admin_new_registration',
    'transactional',
    v_email,
    NEW.id,
    v_subject,
    'resend',
    'queued',
    v_idempotency_key,
    jsonb_build_object(
      'send_raw', true,
      'raw_html', v_html,
      'trigger', 'db_trigger'
    ),
    NOW()
  );

  RETURN NEW;
END;
$$;
