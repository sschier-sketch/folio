/*
  # Update Signup Flow to Initialize 30-Day Trial
  
  1. Changes
    - Update `handle_new_user()` trigger function to create billing_info with trial
    - New users automatically get 30-day trial starting from signup
    - Trial fields: trial_started_at = now(), trial_ends_at = now() + 30 days
  
  2. Trial Business Logic
    - Every new signup gets 30-day trial with Pro features
    - trial_started_at: timestamp when trial begins
    - trial_ends_at: timestamp when trial expires (30 days later)
    - subscription_plan: remains 'free' during trial
    - User has Pro access via trial until trial_ends_at
  
  3. Notes
    - Existing users already have billing_info (no trial via migration)
    - Only affects NEW signups after this deployment
    - Trial is one-time per user (no re-activation)
*/

-- Update handle_new_user function to initialize trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
  
  RETURN NEW;
END;
$$;

-- Ensure trigger exists (should already exist, but just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
