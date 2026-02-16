/*
  # Add newsletter_opt_in to admin_get_users

  1. Changes
    - Recreates `admin_get_users` function to include `newsletter_opt_in` column
    - Reads the value from `account_profiles.newsletter_opt_in`
    - Defaults to false if not set

  2. Security
    - SECURITY DEFINER, admin-only access (unchanged)
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
  subscription_ends_at timestamptz,
  newsletter_opt_in boolean
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
    CASE
      WHEN ss.status::text IN ('active', 'trialing', 'past_due') THEN 'pro'::text
      WHEN bi.subscription_ends_at IS NOT NULL AND bi.subscription_ends_at > now() THEN 'pro'::text
      WHEN bi.subscription_plan = 'pro' AND bi.subscription_status = 'active' THEN 'pro'::text
      ELSE COALESCE(bi.subscription_plan, 'free')::text
    END AS subscription_plan,
    CASE
      WHEN ss.status::text IN ('active', 'trialing', 'past_due') THEN 'active'::text
      WHEN bi.subscription_ends_at IS NOT NULL AND bi.subscription_ends_at > now() THEN 'active'::text
      WHEN bi.subscription_plan = 'pro' AND bi.subscription_status = 'active' THEN 'active'::text
      ELSE COALESCE(bi.subscription_status, 'inactive')::text
    END AS subscription_status,
    ap.first_name,
    ap.last_name,
    ap.company_name,
    (SELECT COUNT(*) FROM public.properties WHERE properties.user_id = u.id) AS properties_count,
    (SELECT COUNT(*) FROM public.tenants WHERE tenants.user_id = u.id) AS tenants_count,
    EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = u.id) AS is_admin,
    COALESCE(ap.banned, false) AS banned,
    ap.ban_reason,
    ap.customer_number,
    bi.trial_ends_at,
    COALESCE(
      bi.subscription_ends_at,
      CASE WHEN ss.cancel_at_period_end = true AND ss.current_period_end IS NOT NULL
        THEN to_timestamp(ss.current_period_end)
        ELSE NULL
      END
    ) AS subscription_ends_at,
    COALESCE(ap.newsletter_opt_in, false) AS newsletter_opt_in
  FROM auth.users u
  LEFT JOIN public.billing_info bi ON bi.user_id = u.id
  LEFT JOIN public.account_profiles ap ON ap.user_id = u.id
  LEFT JOIN public.stripe_customers sc ON sc.user_id = u.id
  LEFT JOIN public.stripe_subscriptions ss ON ss.customer_id = sc.customer_id
  ORDER BY u.created_at DESC;
END;
$$;