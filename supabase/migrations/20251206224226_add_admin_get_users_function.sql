/*
  # Add Admin Function to List Users

  1. New Functions
    - `admin_get_users()` - Returns all users with their subscription info
      - Only accessible by admin users
      - Returns user ID, email, created_at, and subscription details
  
  2. Security
    - Function checks if the calling user is an admin
    - Only admins can access user data
*/

-- Create function to get all users (admin only)
CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  subscription_plan text,
  subscription_status text
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

  -- Return users with their billing info
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at,
    COALESCE(b.subscription_plan, 'free')::text as subscription_plan,
    COALESCE(b.subscription_status, 'active')::text as subscription_status
  FROM auth.users u
  LEFT JOIN billing_info b ON b.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
