/*
  # Remove email queue entry from handle_new_user trigger

  1. Modified Functions
    - `handle_new_user` - removed the email_logs INSERT for admin notifications
    - Admin notification emails are now sent directly from the frontend via
      the send-email edge function, which is reliable and immediate
    - The DB trigger cannot call edge functions, and the cron-based email queue
      is not guaranteed to run, causing emails to stay stuck as "queued"

  2. Notes
    - The notify_on_new_registration setting is still read by the frontend
    - No data loss: existing queued entries are cleaned up below
*/

UPDATE email_logs
SET status = 'skipped', error_message = 'Migrated to direct send via frontend'
WHERE mail_type = 'admin_new_registration' AND status = 'queued';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  RETURN NEW;
END;
$function$;
