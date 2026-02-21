/*
  # Move admin registration notification to a reliable DB trigger

  1. Changes
    - Creates a new trigger function `notify_admin_on_new_registration()`
      that fires AFTER INSERT on `auth.users`
    - Reads `notify_on_new_registration` and `notification_email` from
      `system_settings` (row id=1)
    - If enabled, inserts a row into `email_logs` with status='queued',
      `mail_type='admin_new_registration'`, containing a pre-rendered HTML
      body in `metadata->raw_html` and `metadata->send_raw = true`
    - The existing `process-email-queue` cron job picks it up and sends it
      via the `send-email` edge function
    - This replaces the previous frontend-based approach which was unreliable
      (browser could close/navigate away before the fetch completed)

  2. Security
    - Function runs as SECURITY DEFINER with fixed search_path to access
      system_settings (which has admin-only RLS)
    - No new tables or RLS changes needed

  3. Important Notes
    - The trigger fires after user_settings and account_profiles are created
      (ordering is alphabetical by trigger name, 'n' > 'o' so this fires
      after on_auth_user_created). We use a distinct trigger name starting
      with 'on_auth_user_created_notify' to ensure consistent ordering.
    - Idempotency key prevents duplicate notifications
*/

CREATE OR REPLACE FUNCTION public.notify_admin_on_new_registration()
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

DROP TRIGGER IF EXISTS on_auth_user_created_notify_admin ON auth.users;

CREATE TRIGGER on_auth_user_created_notify_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_new_registration();
