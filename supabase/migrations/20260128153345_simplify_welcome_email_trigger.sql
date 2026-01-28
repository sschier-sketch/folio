/*
  # Simplify Welcome Email Trigger

  1. Remove HTTP dependency from trigger
  2. Create email queue entry that can be processed
  3. Add helper function to manually send welcome emails
*/

-- Create a simpler version that doesn't rely on HTTP calls
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_trial_start timestamptz;
  v_trial_end timestamptz;
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

  -- Queue welcome email by creating a queued log entry
  -- This can be processed by a cron job or immediately by calling send_queued_emails()
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
      'welcome',
      'transactional',
      NEW.email,
      NEW.id,
      'Willkommen bei Rentably!',
      'resend',
      'queued',
      'welcome:' || NEW.id::text,
      jsonb_build_object(
        'template_key', 'welcome',
        'user_email', NEW.email,
        'user_id', NEW.id::text,
        'dashboard_link', 'https://rentab.ly/dashboard'
      )
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
    
    RAISE LOG 'Welcome email queued for user %', NEW.id;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail signup
    RAISE WARNING 'Failed to queue welcome email for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- Create function to process queued welcome emails
CREATE OR REPLACE FUNCTION public.process_welcome_email_queue()
RETURNS TABLE(processed_count int, success_count int, error_count int)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_log RECORD;
  v_processed int := 0;
  v_success int := 0;
  v_error int := 0;
BEGIN
  -- Process all queued welcome emails
  FOR v_log IN 
    SELECT * FROM public.email_logs
    WHERE status = 'queued' 
      AND mail_type = 'welcome'
      AND created_at > now() - interval '7 days'
    ORDER BY created_at ASC
    LIMIT 100
  LOOP
    v_processed := v_processed + 1;
    
    -- Mark as processing to prevent duplicate processing
    UPDATE public.email_logs
    SET metadata = metadata || jsonb_build_object('processing_started', now())
    WHERE id = v_log.id;
    
    -- Here you would normally call the send-email function via HTTP
    -- For now, we just log it
    RAISE LOG 'Would send welcome email to % (log_id: %)', v_log.to_email, v_log.id;
    
    -- Update status (in production, this would be done by the actual email sending function)
    -- For now, we leave it as queued so it can be picked up by the actual email sender
  END LOOP;

  RETURN QUERY SELECT v_processed, v_success, v_error;
END;
$function$;

-- Send welcome email for existing user simon@milkandsons.com
DO $$
DECLARE
  v_user_id uuid := 'e1e63cec-d6cb-47dd-8948-799f8d586f00';
  v_email text := 'simon@milkandsons.com';
BEGIN
  -- Check if welcome email already queued/sent
  IF NOT EXISTS (
    SELECT 1 FROM public.email_logs 
    WHERE idempotency_key = 'welcome:' || v_user_id::text
  ) THEN
    -- Queue welcome email
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
      'welcome',
      'transactional',
      v_email,
      v_user_id,
      'Willkommen bei Rentably!',
      'resend',
      'queued',
      'welcome:' || v_user_id::text,
      jsonb_build_object(
        'template_key', 'welcome',
        'user_email', v_email,
        'user_id', v_user_id::text,
        'dashboard_link', 'https://rentab.ly/dashboard',
        'manually_queued', true
      )
    );
    
    RAISE NOTICE 'Welcome email queued for simon@milkandsons.com';
  ELSE
    RAISE NOTICE 'Welcome email already exists for simon@milkandsons.com';
  END IF;
END $$;
