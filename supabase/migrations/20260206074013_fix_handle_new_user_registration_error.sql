/*
  # Fix Registration Error - Correct handle_new_user Function

  1. Problem
    - Current handle_new_user() tries to insert into admin_users with non-existent columns
    - This causes "Database error saving new user" during registration
  
  2. Solution
    - Restore correct function that writes to user_settings and account_profiles
    - Include newsletter_opt_in from user metadata
    - Do NOT write to admin_users (that's only for actual admins)
  
  3. Changes
    - Replace handle_new_user() with correct implementation
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
    can_view_analytics,
    trial_started_at,
    trial_ends_at
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
    true,
    now(),
    now() + interval '14 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.account_profiles (
    user_id,
    email,
    address_country,
    newsletter_opt_in
  )
  VALUES (
    NEW.id,
    NEW.email,
    'Deutschland',
    COALESCE((NEW.raw_user_meta_data->>'newsletter_opt_in')::boolean, false)
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
