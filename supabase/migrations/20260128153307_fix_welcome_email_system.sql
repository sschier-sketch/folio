/*
  # Fix Welcome Email System

  1. Enable pg_net extension for HTTP requests
  2. Configure app settings for welcome email function
  3. Improve handle_new_user function to send welcome emails
*/

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Update handle_new_user function to properly send welcome emails
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_trial_start timestamptz;
  v_trial_end timestamptz;
  v_request_id bigint;
BEGIN
  -- Calculate trial dates (30 days)
  v_trial_start := now();
  v_trial_end := now() + interval '30 days';

  -- Create user_settings
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

  -- Create account_profiles
  INSERT INTO public.account_profiles (
    user_id,
    address_country
  )
  VALUES (
    NEW.id,
    'Deutschland'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Create billing_info with 30-day trial
  INSERT INTO public.billing_info (
    user_id,
    subscription_plan,
    subscription_status,
    trial_started_at,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    'free',
    'active',
    v_trial_start,
    v_trial_end
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Send welcome email via send-email function (async, non-blocking)
  BEGIN
    SELECT extensions.http_post(
      url := (SELECT current_setting('app.settings')::json->>'supabase_url') || '/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT current_setting('app.settings')::json->>'service_role_key')
      ),
      body := jsonb_build_object(
        'to', NEW.email,
        'templateKey', 'welcome',
        'userId', NEW.id::text,
        'mailType', 'welcome',
        'category', 'transactional',
        'idempotencyKey', 'welcome:' || NEW.id::text,
        'variables', jsonb_build_object(
          'dashboard_link', (SELECT current_setting('app.settings')::json->>'app_base_url') || '/dashboard'
        )
      )::text
    ) INTO v_request_id;
    
    RAISE LOG 'Welcome email request sent for user %, request_id: %', NEW.id, v_request_id;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail signup
    RAISE WARNING 'Failed to send welcome email for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- Create app settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Insert default settings (will be overridden by environment)
INSERT INTO public.app_settings (key, value)
VALUES (
  'email_system',
  jsonb_build_object(
    'supabase_url', current_setting('request.header.origin', true),
    'service_role_key', 'CONFIGURED_VIA_SECRETS',
    'app_base_url', current_setting('request.header.origin', true)
  )
)
ON CONFLICT (key) DO NOTHING;

-- Configure app.settings (for trigger function)
-- Note: This needs to be set via ALTER DATABASE or per-session
DO $$
BEGIN
  -- Try to set app.settings if possible
  EXECUTE format(
    'ALTER DATABASE %I SET app.settings = %L',
    current_database(),
    jsonb_build_object(
      'supabase_url', 'https://' || current_database() || '.supabase.co',
      'service_role_key', 'WILL_BE_SET_BY_ENV',
      'app_base_url', 'https://rentab.ly'
    )::text
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Could not set app.settings: %', SQLERRM;
END $$;
