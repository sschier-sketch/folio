/*
  # Add Admin Notification Email on New User Registration

  1. Modified Functions
    - `handle_new_user` - updated to check `system_settings.notify_on_new_registration`
      and queue an email to hello@rentab.ly when a new user registers

  2. How it works
    - After creating user_settings and account_profiles, the trigger checks
      if `notify_on_new_registration` is true in system_settings
    - If enabled, it inserts a row into email_logs with status 'queued'
    - The existing process-email-queue cron job picks it up and sends via Resend
    - The email contains the new user's email address and registration timestamp

  3. Security
    - Uses SECURITY DEFINER so the trigger can read system_settings and write email_logs
    - No user data beyond email is included in the notification
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_notify boolean;
BEGIN
  INSERT INTO public.user_settings (
    user_id,
    referral_code,
    theme,
    notifications_enabled,
    language,
    role,
    can_invite_users,
    can_manage_properties,
    can_manage_tenants,
    can_manage_finances,
    can_view_analytics
  )
  VALUES (
    NEW.id,
    generate_referral_code(),
    'light',
    true,
    'de',
    'owner',
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.account_profiles (
    user_id,
    address_country,
    newsletter_opt_in
  )
  VALUES (
    NEW.id,
    'Deutschland',
    COALESCE((NEW.raw_user_meta_data->>'newsletter_opt_in')::boolean, false)
  )
  ON CONFLICT (user_id) DO NOTHING;

  SELECT COALESCE(notify_on_new_registration, false)
    INTO v_notify
    FROM public.system_settings
   WHERE id = 1;

  IF v_notify THEN
    INSERT INTO public.email_logs (
      id,
      mail_type,
      category,
      to_email,
      subject,
      provider,
      status,
      metadata
    ) VALUES (
      gen_random_uuid(),
      'admin_new_registration',
      'informational',
      'hello@rentab.ly',
      'Neue Registrierung: ' || COALESCE(NEW.email, 'Unbekannt'),
      'resend',
      'queued',
      jsonb_build_object(
        'user_email', NEW.email,
        'user_id', NEW.id::text,
        'registered_at', now()::text,
        'trigger', 'handle_new_user',
        'send_raw', true,
        'raw_html', '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">'
          || '<h2 style="color:#1a1a2e;margin-bottom:16px">Neue Registrierung</h2>'
          || '<p style="color:#4a4a4a;font-size:15px;line-height:1.6">Ein neuer Benutzer hat sich bei Rentably registriert:</p>'
          || '<div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:16px 0">'
          || '<p style="margin:0 0 8px;color:#1a1a2e"><strong>E-Mail:</strong> ' || COALESCE(NEW.email, 'Unbekannt') || '</p>'
          || '<p style="margin:0;color:#1a1a2e"><strong>Zeitpunkt:</strong> ' || to_char(now() AT TIME ZONE 'Europe/Berlin', 'DD.MM.YYYY "um" HH24:MI "Uhr"') || '</p>'
          || '</div>'
          || '<p style="color:#888;font-size:12px;margin-top:24px">Diese Benachrichtigung wurde automatisch gesendet, weil die Admin-Benachrichtigung bei neuen Registrierungen aktiviert ist.</p>'
          || '</div>'
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;
