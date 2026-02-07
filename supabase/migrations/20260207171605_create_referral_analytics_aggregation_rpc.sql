/*
  Create Referral Analytics Aggregation RPC
  
  Provides aggregated analytics data for referral program dashboard including:
  - Time-series data for clicks, signups, conversions, and commissions
  - Granularity options: daily, weekly, monthly
  - Filtered by date range
  - Consistent with KPI tiles (sum of buckets = total KPIs)
  
  Function: get_referral_analytics(start_date, end_date, granularity)
  Returns: Array of time buckets with aggregated metrics
*/

CREATE OR REPLACE FUNCTION get_referral_analytics(
  p_user_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_granularity text DEFAULT 'day' 
)
RETURNS TABLE (
  time_bucket timestamptz,
  clicks_count bigint,
  signups_count bigint,
  paying_count bigint,
  commission_earned numeric,
  commission_available numeric,
  commission_paid numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral_code text;
  v_affiliate_id uuid;
  v_interval text;
BEGIN
  -- Determine time bucket interval
  v_interval := CASE 
    WHEN p_granularity = 'week' THEN '1 week'
    WHEN p_granularity = 'month' THEN '1 month'
    ELSE '1 day'
  END;

  -- Get user's referral code
  SELECT referral_code INTO v_referral_code
  FROM user_settings
  WHERE user_settings.user_id = p_user_id;

  -- Get user's affiliate ID if they are an affiliate
  SELECT id INTO v_affiliate_id
  FROM affiliates
  WHERE affiliates.user_id = p_user_id;

  RETURN QUERY
  WITH time_series AS (
    SELECT generate_series(
      date_trunc(
        CASE 
          WHEN p_granularity = 'week' THEN 'week'
          WHEN p_granularity = 'month' THEN 'month'
          ELSE 'day'
        END,
        p_start_date
      ),
      p_end_date,
      v_interval::interval
    ) AS bucket
  ),
  clicks_agg AS (
    SELECT 
      date_trunc(
        CASE 
          WHEN p_granularity = 'week' THEN 'week'
          WHEN p_granularity = 'month' THEN 'month'
          ELSE 'day'
        END,
        created_at
      ) AS bucket,
      COUNT(DISTINCT session_id) AS cnt
    FROM referral_click_events
    WHERE referral_code = v_referral_code
      AND created_at >= p_start_date
      AND created_at <= p_end_date
    GROUP BY 1
  ),
  signups_agg AS (
    SELECT 
      date_trunc(
        CASE 
          WHEN p_granularity = 'week' THEN 'week'
          WHEN p_granularity = 'month' THEN 'month'
          ELSE 'day'
        END,
        ur.created_at
      ) AS bucket,
      COUNT(*) AS cnt
    FROM user_referrals ur
    WHERE ur.referrer_id = p_user_id
      AND ur.created_at >= p_start_date
      AND ur.created_at <= p_end_date
    GROUP BY 1
  ),
  affiliate_signups_agg AS (
    SELECT 
      date_trunc(
        CASE 
          WHEN p_granularity = 'week' THEN 'week'
          WHEN p_granularity = 'month' THEN 'month'
          ELSE 'day'
        END,
        ar.created_at
      ) AS bucket,
      COUNT(*) AS cnt
    FROM affiliate_referrals ar
    WHERE ar.affiliate_id = v_affiliate_id
      AND ar.created_at >= p_start_date
      AND ar.created_at <= p_end_date
    GROUP BY 1
  ),
  paying_agg AS (
    SELECT 
      date_trunc(
        CASE 
          WHEN p_granularity = 'week' THEN 'week'
          WHEN p_granularity = 'month' THEN 'month'
          ELSE 'day'
        END,
        ar.first_payment_at
      ) AS bucket,
      COUNT(*) AS cnt
    FROM affiliate_referrals ar
    WHERE ar.affiliate_id = v_affiliate_id
      AND ar.first_payment_at IS NOT NULL
      AND ar.first_payment_at >= p_start_date
      AND ar.first_payment_at <= p_end_date
    GROUP BY 1
  ),
  commissions_agg AS (
    SELECT 
      date_trunc(
        CASE 
          WHEN p_granularity = 'week' THEN 'week'
          WHEN p_granularity = 'month' THEN 'month'
          ELSE 'day'
        END,
        ac.created_at
      ) AS bucket,
      SUM(CASE WHEN ac.status IN ('pending', 'available', 'paid') THEN ac.commission_amount ELSE 0 END) AS earned,
      SUM(CASE WHEN ac.status = 'available' THEN ac.commission_amount ELSE 0 END) AS available,
      SUM(CASE WHEN ac.status = 'paid' THEN ac.commission_amount ELSE 0 END) AS paid
    FROM affiliate_commissions ac
    WHERE ac.affiliate_id = v_affiliate_id
      AND ac.created_at >= p_start_date
      AND ac.created_at <= p_end_date
    GROUP BY 1
  )
  SELECT 
    ts.bucket AS time_bucket,
    COALESCE(c.cnt, 0) AS clicks_count,
    COALESCE(s.cnt, 0) + COALESCE(ars.cnt, 0) AS signups_count,
    COALESCE(p.cnt, 0) AS paying_count,
    COALESCE(cm.earned, 0) AS commission_earned,
    COALESCE(cm.available, 0) AS commission_available,
    COALESCE(cm.paid, 0) AS commission_paid
  FROM time_series ts
  LEFT JOIN clicks_agg c ON c.bucket = ts.bucket
  LEFT JOIN signups_agg s ON s.bucket = ts.bucket
  LEFT JOIN affiliate_signups_agg ars ON ars.bucket = ts.bucket
  LEFT JOIN paying_agg p ON p.bucket = ts.bucket
  LEFT JOIN commissions_agg cm ON cm.bucket = ts.bucket
  ORDER BY ts.bucket;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_referral_analytics TO authenticated;
