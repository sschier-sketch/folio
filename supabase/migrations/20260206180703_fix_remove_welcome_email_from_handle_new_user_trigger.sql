/*
  # Remove welcome email queue from handle_new_user trigger

  The handle_new_user trigger was inserting a 'queued' entry into email_logs
  with the welcome email idempotency key. However:
  - There is no cron job to process the queue, so the entry stays 'queued' forever
  - The frontend already calls send-welcome-email -> send-email after signup
  - The pre-existing 'queued' entry blocks the real send-email call due to 
    idempotency key collision

  ## Changes
  - Remove the email_logs INSERT from handle_new_user()
  - Welcome email is now handled exclusively by the frontend flow:
    SignupForm -> send-welcome-email edge function -> send-email edge function

  ## Important
  - user_settings and account_profiles creation remain unchanged
  - No data loss - only removes the dead queue entry creation
*/

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
