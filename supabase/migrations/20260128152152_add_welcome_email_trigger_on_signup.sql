/*
  # Add Welcome Email Trigger on Signup

  1. Changes
    - Update `handle_new_user()` to call send-welcome-email function
    - Sends welcome email asynchronously after user registration
    - Non-blocking: signup succeeds even if email fails

  2. Notes
    - Email sending happens via Edge Function
    - Uses idempotency key to prevent duplicates
    - Email is logged in email_logs table
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_trial_start timestamptz;
  v_trial_end timestamptz;
  v_supabase_url text;
  v_service_role_key text;
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
  
  -- Send welcome email (async, non-blocking)
  BEGIN
    v_supabase_url := current_setting('app.supabase_url', true);
    v_service_role_key := current_setting('app.service_role_key', true);
    
    IF v_supabase_url IS NOT NULL AND v_service_role_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/send-welcome-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_role_key
        ),
        body := jsonb_build_object(
          'userId', NEW.id::text,
          'email', NEW.email
        )
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail signup
    RAISE WARNING 'Failed to send welcome email for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;
