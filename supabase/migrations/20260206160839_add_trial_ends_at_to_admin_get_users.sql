/*
  # Add trial_ends_at to admin_get_users

  1. Modified Functions
    - `admin_get_users()` - Now returns `trial_ends_at` from billing_info
      so the admin UI can show trial status badges with remaining days

  2. Important Notes
    - Existing return columns remain unchanged
    - New column: trial_ends_at (timestamptz, nullable)
*/

DROP FUNCTION IF EXISTS public.admin_get_users();

CREATE FUNCTION public.admin_get_users()
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
  trial_ends_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    bi.trial_ends_at
  FROM auth.users u
  LEFT JOIN public.billing_info bi ON bi.user_id = u.id
  LEFT JOIN public.account_profiles ap ON ap.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
