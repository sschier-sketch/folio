/*
  # Create admin_get_affiliates RPC function

  1. New Functions
    - `admin_get_affiliates()` - Returns all affiliates with user emails
      joined from auth.users (which is not accessible via client-side PostgREST joins).
      Admin-only access enforced.

  2. Notes
    - Required because the Supabase client cannot join to auth.users directly
    - Returns all affiliate fields plus the user's email
*/

CREATE OR REPLACE FUNCTION admin_get_affiliates()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_email text,
  affiliate_code text,
  status text,
  commission_rate decimal(4,3),
  total_referrals integer,
  paying_referrals integer,
  total_earned decimal(10,2),
  total_paid decimal(10,2),
  total_pending decimal(10,2),
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
    a.total_referrals,
    a.paying_referrals,
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
