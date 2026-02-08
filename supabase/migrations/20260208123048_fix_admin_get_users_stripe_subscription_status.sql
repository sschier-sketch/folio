/*
  # Fix admin_get_users to show correct Stripe subscription status

  1. Changes
    - Recreates `admin_get_users` function to JOIN with `stripe_customers` and 
      `stripe_subscriptions` tables for authoritative subscription status
    - When a Stripe subscription is active, the plan shows as 'pro' regardless
      of what `billing_info.subscription_plan` says
    - Falls back to `billing_info.subscription_plan` when no Stripe data exists

  2. Data Backfill
    - Backfills `billing_info.stripe_customer_id` from `stripe_customers` table
      for any users where it was missing
    - Updates `billing_info.subscription_plan` to 'pro' for users with active
      Stripe subscriptions whose billing_info was out of sync

  3. Why This Is Needed
    - The `stripe-checkout` function previously did not set `stripe_customer_id` 
      in `billing_info`, so the webhook could not find the user to update their plan
    - This caused paying Pro users to appear as "Basic/Gratis" in the admin panel
*/

-- Step 1: Backfill stripe_customer_id in billing_info from stripe_customers
UPDATE billing_info bi
SET 
  stripe_customer_id = sc.customer_id,
  updated_at = now()
FROM stripe_customers sc
WHERE sc.user_id = bi.user_id
  AND bi.stripe_customer_id IS NULL
  AND sc.deleted_at IS NULL;

-- Step 2: Sync billing_info.subscription_plan for users with active Stripe subscriptions
UPDATE billing_info bi
SET 
  subscription_plan = 'pro',
  subscription_status = 'active',
  updated_at = now()
FROM stripe_customers sc
JOIN stripe_subscriptions ss ON ss.customer_id = sc.customer_id
WHERE sc.user_id = bi.user_id
  AND ss.status = 'active'
  AND sc.deleted_at IS NULL
  AND ss.deleted_at IS NULL
  AND bi.subscription_plan != 'pro';

-- Step 3: Recreate admin_get_users with Stripe-aware logic
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
      WHEN ss.status = 'active' AND ss.deleted_at IS NULL THEN 'pro'::text
      ELSE COALESCE(bi.subscription_plan, 'free')::text
    END AS subscription_plan,
    CASE
      WHEN ss.status = 'active' AND ss.deleted_at IS NULL THEN 'active'::text
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
    bi.subscription_ends_at
  FROM auth.users u
  LEFT JOIN public.billing_info bi ON bi.user_id = u.id
  LEFT JOIN public.account_profiles ap ON ap.user_id = u.id
  LEFT JOIN public.stripe_customers sc ON sc.user_id = u.id AND sc.deleted_at IS NULL
  LEFT JOIN public.stripe_subscriptions ss ON ss.customer_id = sc.customer_id AND ss.deleted_at IS NULL
  ORDER BY u.created_at DESC;
END;
$$;