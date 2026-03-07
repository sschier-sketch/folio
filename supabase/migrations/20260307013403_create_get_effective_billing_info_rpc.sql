/*
  # Create get_effective_billing_info RPC

  ## Purpose
  Sub-users (team members) should inherit their account owner's subscription
  and billing status. This function returns the billing_info for the effective
  account - the owner's billing_info if the caller is a sub-user, or the
  caller's own billing_info if they are an owner.

  ## New Functions
  - `get_effective_billing_info()` - Returns billing info for the effective account
*/

CREATE OR REPLACE FUNCTION public.get_effective_billing_info()
RETURNS TABLE (
  subscription_plan text,
  subscription_status text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  stripe_customer_id text,
  subscription_ends_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_effective_user_id uuid;
  v_owner_id uuid;
BEGIN
  SELECT us.account_owner_id INTO v_owner_id
  FROM user_settings us
  WHERE us.user_id = auth.uid()
  AND us.account_owner_id IS NOT NULL
  AND us.is_active_member = true
  AND us.removed_at IS NULL
  AND us.role != 'owner';

  v_effective_user_id := COALESCE(v_owner_id, auth.uid());

  RETURN QUERY
  SELECT
    bi.subscription_plan::text,
    bi.subscription_status::text,
    bi.trial_started_at,
    bi.trial_ends_at,
    bi.stripe_customer_id::text,
    bi.subscription_ends_at
  FROM billing_info bi
  WHERE bi.user_id = v_effective_user_id;
END;
$$;
