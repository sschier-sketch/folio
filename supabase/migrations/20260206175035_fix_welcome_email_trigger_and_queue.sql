/*
  # Fix Welcome Email System

  1. Changes
    - Restore welcome email queuing in handle_new_user() trigger
    - Uses correct template key 'registration' instead of 'welcome'
    - Queues email in email_logs for processing by edge function

  2. Notes
    - The frontend also calls send-welcome-email directly as primary path
    - The trigger queue is a backup in case the frontend call fails
    - Idempotency key prevents duplicate emails
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  BEGIN
    INSERT INTO public.email_logs (
      mail_type,
      category,
      to_email,
      user_id,
      subject,
      provider,
      status,
      idempotency_key,
      metadata
    )
    VALUES (
      'registration',
      'transactional',
      NEW.email,
      NEW.id,
      'Willkommen bei rentab.ly',
      'resend',
      'queued',
      'welcome:' || NEW.id::text,
      jsonb_build_object(
        'template_key', 'registration',
        'user_email', NEW.email,
        'user_id', NEW.id::text,
        'dashboard_link', 'https://rentab.ly/dashboard'
      )
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to queue welcome email for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;
