/*
  # Fix affiliate referral counts to use live data

  1. Changes
    - Update `admin_get_affiliates` function to compute `total_referrals` and `paying_referrals`
      live from `user_referrals` and `affiliate_referrals` tables instead of reading stale
      denormalized counters
    - Sync all existing stale counters in the `affiliates` table to match reality

  2. Problem
    - When referred users are deleted, `ON DELETE CASCADE` removes their referral records
      but the counters in `affiliates.total_referrals` / `affiliates.paying_referrals` are
      never decremented, leading to phantom counts

  3. Fix approach
    - The admin RPC now computes live counts via subqueries
    - One-time sync to fix existing stale data
*/

DROP FUNCTION IF EXISTS admin_get_affiliates();

CREATE OR REPLACE FUNCTION admin_get_affiliates()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_email text,
  affiliate_code text,
  status text,
  commission_rate numeric,
  total_referrals integer,
  paying_referrals integer,
  total_earned numeric,
  total_paid numeric,
  total_pending numeric,
  is_blocked boolean,
  blocked_reason text,
  blocked_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
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
    a.id,
    a.user_id,
    u.email::text AS user_email,
    a.affiliate_code,
    a.status,
    a.commission_rate,
    (
      (SELECT COUNT(*)::integer FROM public.user_referrals ur WHERE ur.referrer_id = a.user_id)
      +
      (SELECT COUNT(*)::integer FROM public.affiliate_referrals ar2 WHERE ar2.affiliate_id = a.id)
    ) AS total_referrals,
    (
      (SELECT COUNT(*)::integer FROM public.user_referrals ur WHERE ur.referrer_id = a.user_id AND ur.status = 'completed')
      +
      (SELECT COUNT(*)::integer FROM public.affiliate_referrals ar2 WHERE ar2.affiliate_id = a.id AND ar2.status = 'paying')
    ) AS paying_referrals,
    a.total_earned,
    a.total_paid,
    a.total_pending,
    a.is_blocked,
    a.blocked_reason,
    a.blocked_at,
    a.created_at,
    a.updated_at
  FROM public.affiliates a
  JOIN auth.users u ON u.id = a.user_id
  ORDER BY a.created_at DESC;
END;
$$;

UPDATE public.affiliates a
SET
  total_referrals = (
    SELECT COUNT(*)::integer FROM public.user_referrals ur WHERE ur.referrer_id = a.user_id
  ) + (
    SELECT COUNT(*)::integer FROM public.affiliate_referrals ar WHERE ar.affiliate_id = a.id
  ),
  paying_referrals = (
    SELECT COUNT(*)::integer FROM public.user_referrals ur WHERE ur.referrer_id = a.user_id AND ur.status = 'completed'
  ) + (
    SELECT COUNT(*)::integer FROM public.affiliate_referrals ar WHERE ar.affiliate_id = a.id AND ar.status = 'paying'
  );
