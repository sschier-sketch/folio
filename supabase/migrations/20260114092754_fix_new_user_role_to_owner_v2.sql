/*
  # Fix New User Role Assignment

  1. Changes
    - Add 'owner' to allowed roles in user_settings
    - Update `handle_new_user()` function to assign 'owner' role instead of 'admin'
    - Update existing users who have 'admin' role (registered users, not actual admins)
    
  2. Notes
    - New users should be 'owner' by default
    - Only manually designated users should have 'admin' role
    - This fixes the issue where new registrations incorrectly show "Administrator"
*/

-- First, drop the existing role check constraint
ALTER TABLE public.user_settings
DROP CONSTRAINT IF EXISTS user_settings_role_check;

-- Add the new constraint with 'owner' included
ALTER TABLE public.user_settings
ADD CONSTRAINT user_settings_role_check
CHECK (role = ANY (ARRAY['admin'::text, 'owner'::text, 'member'::text, 'viewer'::text]));

-- Update the handle_new_user function to use 'owner' instead of 'admin'
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

-- Update existing users who have 'admin' role to 'owner'
-- This is safe because actual admins will be manually set separately
UPDATE public.user_settings
SET role = 'owner'
WHERE role = 'admin';
