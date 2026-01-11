/*
  # Extend admin_get_users function with profile data and last login

  1. Changes
    - Update `admin_get_users()` function to include:
      - last_sign_in_at from auth.users
      - first_name from account_profiles
      - last_name from account_profiles
      - company_name from account_profiles
    
  2. Notes
    - Admin users can now see complete user information
    - Profile data is joined from account_profiles table
*/

-- Drop existing function
DROP FUNCTION IF EXISTS admin_get_users();

-- Recreate function with extended fields
CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  subscription_plan text,
  subscription_status text,
  first_name text,
  last_name text,
  company_name text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Return users with their billing info and profile data
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(b.subscription_plan, 'free')::text as subscription_plan,
    COALESCE(b.subscription_status, 'active')::text as subscription_status,
    p.first_name,
    p.last_name,
    p.company_name
  FROM auth.users u
  LEFT JOIN billing_info b ON b.user_id = u.id
  LEFT JOIN account_profiles p ON p.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
