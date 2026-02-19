/*
  # Add Configurable Notification Email to System Settings

  1. Modified Tables
    - `system_settings`
      - Added `notification_email` (text, default 'hello@rentab.ly') - the email address
        that receives admin notifications such as new registration alerts

  2. Updated Functions
    - `get_system_settings` - recreated to include the new column
    - `handle_new_user` - updated to read notification_email from system_settings
      instead of using a hardcoded address

  3. Notes
    - Default value is hello@rentab.ly so existing behavior is preserved
    - Admins can change the recipient in the Systeminfos tab
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'notification_email'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN notification_email text DEFAULT 'hello@rentab.ly' NOT NULL;
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.get_system_settings();

CREATE OR REPLACE FUNCTION public.get_system_settings()
RETURNS TABLE (
  id integer,
  gtm_enabled boolean,
  gtm_container_id text,
  gtm_custom_head_html text,
  default_affiliate_commission_rate numeric,
  signup_custom_tracking_script text,
  notify_on_new_registration boolean,
  notification_email text,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    id,
    gtm_enabled,
    gtm_container_id,
    gtm_custom_head_html,
    default_affiliate_commission_rate,
    signup_custom_tracking_script,
    notify_on_new_registration,
    notification_email,
    updated_at
  FROM system_settings
  WHERE id = 1
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_notify boolean;
  v_email text;
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

  SELECT
    COALESCE(notify_on_new_registration, false),
    COALESCE(notification_email, 'hello@rentab.ly')
  INTO v_notify, v_email
  FROM public.system_settings
  WHERE id = 1;

  IF v_notify AND v_email IS NOT NULL AND v_email <> '' THEN
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
      v_email,
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
