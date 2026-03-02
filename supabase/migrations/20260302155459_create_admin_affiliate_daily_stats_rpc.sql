/*
  # Admin Affiliate Daily Stats RPC

  1. New Functions
    - `admin_get_affiliate_daily_stats(p_from_date, p_to_date)`: Returns daily aggregated
      click counts and referral signup counts across all affiliate partners for a given date range.

  2. Return Columns
    - `stat_date` (date): The calendar day
    - `total_clicks` (bigint): Total clicks on all affiliate/referral links that day
    - `total_signups` (bigint): Total new users acquired via referral that day

  3. Security
    - SECURITY DEFINER with restricted search_path
    - Only callable by admin users (checked via admin_users table)
*/

CREATE OR REPLACE FUNCTION admin_get_affiliate_daily_stats(
  p_from_date date,
  p_to_date date
)
RETURNS TABLE (
  stat_date date,
  total_clicks bigint,
  total_signups bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  WITH date_series AS (
    SELECT d::date AS day
    FROM generate_series(p_from_date, p_to_date, '1 day'::interval) AS d
  ),
  daily_clicks AS (
    SELECT
      (rce.created_at AT TIME ZONE 'Europe/Berlin')::date AS day,
      count(*) AS clicks
    FROM referral_click_events rce
    WHERE rce.created_at >= p_from_date::timestamptz
      AND rce.created_at < (p_to_date + 1)::timestamptz
    GROUP BY 1
  ),
  daily_signups AS (
    SELECT
      (ar.created_at AT TIME ZONE 'Europe/Berlin')::date AS day,
      count(*) AS signups
    FROM affiliate_referrals ar
    WHERE ar.created_at >= p_from_date::timestamptz
      AND ar.created_at < (p_to_date + 1)::timestamptz
    GROUP BY 1
  )
  SELECT
    ds.day AS stat_date,
    COALESCE(dc.clicks, 0) AS total_clicks,
    COALESCE(dn.signups, 0) AS total_signups
  FROM date_series ds
  LEFT JOIN daily_clicks dc ON dc.day = ds.day
  LEFT JOIN daily_signups dn ON dn.day = ds.day
  ORDER BY ds.day;
END;
$$;
