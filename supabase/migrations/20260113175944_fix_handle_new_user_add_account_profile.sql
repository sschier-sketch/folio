/*
  # Fix handle_new_user to create account_profiles

  1. Changes
    - Update `handle_new_user()` function to also create an entry in `account_profiles`
    - This ensures every new user has both user_settings and account_profiles entries
  
  2. Notes
    - Fixes "Database error saving new user" issue
    - account_profiles entry is created with default values
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
    'admin',
    true,
    true,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.account_profiles (
    user_id,
    address_country
  )
  VALUES (
    NEW.id,
    'Deutschland'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Backfill existing users without account_profiles
INSERT INTO public.account_profiles (user_id, address_country)
SELECT 
  id,
  'Deutschland'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.account_profiles WHERE user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;