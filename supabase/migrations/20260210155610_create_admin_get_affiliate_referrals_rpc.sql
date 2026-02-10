/*
  # Create admin_get_affiliate_referrals RPC function

  1. New Functions
    - `admin_get_affiliate_referrals(p_affiliate_id uuid)` - Returns referrals 
      for a specific affiliate with referred user emails from auth.users.
      Admin-only access enforced.

  2. Notes
    - Required because the Supabase client cannot join to auth.users directly
*/

CREATE OR REPLACE FUNCTION admin_get_affiliate_referrals(p_affiliate_id uuid)
RETURNS TABLE (
  id uuid,
  affiliate_id uuid,
  referred_user_id uuid,
  referred_user_email text,
  status text,
  first_payment_at timestamptz,
  last_payment_at timestamptz,
  lifetime_value decimal(10,2),
  created_at timestamptz
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
    ar.id,
    ar.affiliate_id,
    ar.referred_user_id,
    u.email::text AS referred_user_email,
    ar.status,
    ar.first_payment_at,
    ar.last_payment_at,
    ar.lifetime_value,
    ar.created_at
  FROM public.affiliate_referrals ar
  JOIN auth.users u ON u.id = ar.referred_user_id
  WHERE ar.affiliate_id = p_affiliate_id
  ORDER BY ar.created_at DESC;
END;
$$;
