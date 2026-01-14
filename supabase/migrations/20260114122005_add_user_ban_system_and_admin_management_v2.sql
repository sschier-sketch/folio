/*
  # Add User Ban System and Admin Management

  ## Changes
    - Add `banned` and `ban_reason` fields to account_profiles table
    - Update admin_get_users function to include admin status and banned status
    - Add functions for admins to ban/unban users and grant/revoke admin access

  ## Security
    - Only admins can ban/unban users
    - Only admins can grant/revoke admin access
    - Banned users cannot access the system (enforced in auth middleware)
*/

-- Add banned fields to account_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_profiles' AND column_name = 'banned'
  ) THEN
    ALTER TABLE public.account_profiles ADD COLUMN banned boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_profiles' AND column_name = 'ban_reason'
  ) THEN
    ALTER TABLE public.account_profiles ADD COLUMN ban_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_profiles' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE public.account_profiles ADD COLUMN banned_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_profiles' AND column_name = 'banned_by'
  ) THEN
    ALTER TABLE public.account_profiles ADD COLUMN banned_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Drop and recreate admin_get_users function to include admin status and banned status
DROP FUNCTION IF EXISTS public.admin_get_users();

CREATE FUNCTION public.admin_get_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  subscription_plan text,
  subscription_status text,
  first_name text,
  last_name text,
  company_name text,
  properties_count bigint,
  tenants_count bigint,
  is_admin boolean,
  banned boolean,
  ban_reason text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(bi.subscription_plan, 'free')::text as subscription_plan,
    COALESCE(bi.subscription_status, 'inactive')::text as subscription_status,
    ap.first_name,
    ap.last_name,
    ap.company_name,
    (SELECT COUNT(*) FROM public.properties WHERE properties.user_id = u.id) as properties_count,
    (SELECT COUNT(*) FROM public.tenants WHERE tenants.user_id = u.id) as tenants_count,
    EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = u.id) as is_admin,
    COALESCE(ap.banned, false) as banned,
    ap.ban_reason
  FROM auth.users u
  LEFT JOIN public.billing_info bi ON bi.user_id = u.id
  LEFT JOIN public.account_profiles ap ON ap.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- Function to ban a user
CREATE OR REPLACE FUNCTION public.admin_ban_user(
  target_user_id uuid,
  reason text
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Cannot ban yourself
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot ban yourself';
  END IF;

  -- Update account_profiles
  UPDATE public.account_profiles
  SET 
    banned = true,
    ban_reason = reason,
    banned_at = now(),
    banned_by = auth.uid()
  WHERE user_id = target_user_id;

  -- If no profile exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.account_profiles (user_id, banned, ban_reason, banned_at, banned_by)
    VALUES (target_user_id, true, reason, now(), auth.uid());
  END IF;

  -- Log the action
  INSERT INTO public.admin_activity_log (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), 'ban_user', target_user_id, jsonb_build_object('reason', reason));
END;
$$;

-- Function to unban a user
CREATE OR REPLACE FUNCTION public.admin_unban_user(
  target_user_id uuid
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Update account_profiles
  UPDATE public.account_profiles
  SET 
    banned = false,
    ban_reason = NULL,
    banned_at = NULL,
    banned_by = NULL
  WHERE user_id = target_user_id;

  -- Log the action
  INSERT INTO public.admin_activity_log (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), 'unban_user', target_user_id, jsonb_build_object('unbanned_at', now()));
END;
$$;

-- Function to grant admin access
CREATE OR REPLACE FUNCTION public.admin_grant_admin_access(
  target_user_id uuid
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Insert or update admin_users
  INSERT INTO public.admin_users (
    user_id,
    is_super_admin,
    can_manage_templates,
    can_view_all_users,
    can_impersonate,
    can_manage_subscriptions
  )
  VALUES (
    target_user_id,
    false,
    true,
    true,
    false,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Log the action
  INSERT INTO public.admin_activity_log (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), 'grant_admin_access', target_user_id, jsonb_build_object('granted_at', now()));
END;
$$;

-- Function to revoke admin access
CREATE OR REPLACE FUNCTION public.admin_revoke_admin_access(
  target_user_id uuid
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Cannot revoke your own admin access
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot revoke your own admin access';
  END IF;

  -- Delete from admin_users
  DELETE FROM public.admin_users
  WHERE user_id = target_user_id;

  -- Log the action
  INSERT INTO public.admin_activity_log (admin_user_id, action, target_user_id, details)
  VALUES (auth.uid(), 'revoke_admin_access', target_user_id, jsonb_build_object('revoked_at', now()));
END;
$$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_account_profiles_banned ON public.account_profiles(banned) WHERE banned = true;
