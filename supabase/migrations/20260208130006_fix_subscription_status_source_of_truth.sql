/*
  # Fix subscription status to use Stripe as source of truth

  This is a critical fix. The admin_get_users function was only reading from
  billing_info, which can be stale. Now it joins stripe_customers and
  stripe_subscriptions to determine the real subscription status.

  Additionally, a new RPC function get_my_stripe_subscription is created
  so the frontend can fetch the correct Stripe subscription data for the
  current user (the old stripe_user_subscriptions table was never populated).

  1. Changes
    - Drops and recreates admin_get_users to join stripe_subscriptions
    - Creates get_my_stripe_subscription RPC for authenticated users
    - Fixes billing_info for user kayn@gmx.com whose data was out of sync

  2. Security
    - admin_get_users: SECURITY DEFINER, admin-only access
    - get_my_stripe_subscription: SECURITY DEFINER, returns only current user data
*/

-- 1) Fix admin_get_users to use Stripe data as source of truth
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
    ) AS subscription_ends_at
  FROM auth.users u
  LEFT JOIN public.billing_info bi ON bi.user_id = u.id
  LEFT JOIN public.account_profiles ap ON ap.user_id = u.id
  LEFT JOIN public.stripe_customers sc ON sc.user_id = u.id
  LEFT JOIN public.stripe_subscriptions ss ON ss.customer_id = sc.customer_id
  ORDER BY u.created_at DESC;
END;
$$;

-- 2) Create get_my_stripe_subscription RPC for frontend use
CREATE OR REPLACE FUNCTION get_my_stripe_subscription()
RETURNS TABLE(
  customer_id text,
  subscription_id text,
  subscription_status text,
  price_id text,
  current_period_start bigint,
  current_period_end bigint,
  cancel_at_period_end boolean,
  payment_method_brand text,
  payment_method_last4 text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.customer_id,
    ss.subscription_id,
    ss.status::text AS subscription_status,
    ss.price_id,
    ss.current_period_start,
    ss.current_period_end,
    ss.cancel_at_period_end,
    ss.payment_method_brand,
    ss.payment_method_last4
  FROM public.stripe_customers sc
  INNER JOIN public.stripe_subscriptions ss ON ss.customer_id = sc.customer_id
  WHERE sc.user_id = auth.uid()
  LIMIT 1;
END;
$$;

-- 3) Fix billing_info for kayn@gmx.com (sync with actual Stripe data)
UPDATE public.billing_info
SET
  subscription_plan = 'pro',
  subscription_status = 'active',
  stripe_customer_id = 'cus_TwPr4g5I5od3d0',
  subscription_ends_at = to_timestamp(1772972652),
  pro_activated_at = COALESCE(pro_activated_at, now()),
  trial_started_at = NULL,
  trial_ends_at = NULL,
  updated_at = now()
WHERE user_id = 'cd83c9b5-cb69-4bbc-b1ec-1a81e9c4cde6';
