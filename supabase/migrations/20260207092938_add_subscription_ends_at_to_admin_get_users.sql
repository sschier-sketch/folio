/*
  # Add subscription_ends_at to admin_get_users

  1. Changes
    - Drops and recreates the `admin_get_users` function to include `subscription_ends_at`
    - This allows admins to see when a cancelled subscription expires
*/

DROP FUNCTION IF EXISTS admin_get_users();

CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE(
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
  ban_reason text,
  customer_number text,
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
ap.ban_reason,
ap.customer_number,
bi.trial_ends_at,
bi.subscription_ends_at
FROM auth.users u
LEFT JOIN public.billing_info bi ON bi.user_id = u.id
LEFT JOIN public.account_profiles ap ON ap.user_id = u.id
ORDER BY u.created_at DESC;
END;
$$;
