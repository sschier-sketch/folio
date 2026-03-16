/*
  # Fix pro_users count: filter by subscription_plan = 'pro'

  The pro_users count was only checking `subscription_status = 'active'` which
  incorrectly included free-plan users who also have active status. This caused
  pro_users to be 59 instead of 5, and monthly revenue to show 531 EUR instead
  of 45 EUR.

  ## Changes
  1. Update daily-analytics-snapshot cron job to add `subscription_plan = 'pro'`
  2. Update admin_take_analytics_snapshot RPC function
  3. Update admin_backfill_analytics_snapshots RPC function

  ## Important Notes
  - All three locations had the same bug: missing plan filter
  - Revenue is calculated as pro_users * 900 cents, so wrong user count
    cascaded into wrong revenue
*/

-- 1. Fix the cron job
SELECT cron.unschedule('daily-analytics-snapshot');

SELECT cron.schedule(
  'daily-analytics-snapshot',
  '0 1 * * *',
  $$
  WITH stats AS (
    SELECT
      (SELECT COUNT(*)::integer FROM auth.users u
       WHERE NOT EXISTS (
         SELECT 1 FROM user_settings us
         WHERE us.user_id = u.id
           AND us.account_owner_id IS NOT NULL
           AND us.role != 'owner'
       )) AS total_users,

      (SELECT COUNT(*)::integer FROM billing_info bi
       JOIN auth.users u ON u.id = bi.user_id
       WHERE bi.subscription_status = 'active'
         AND bi.subscription_plan = 'pro'
         AND NOT EXISTS (
           SELECT 1 FROM user_settings us
           WHERE us.user_id = u.id
             AND us.account_owner_id IS NOT NULL
             AND us.role != 'owner'
         )) AS pro_users,

      (SELECT COUNT(*)::integer FROM billing_info bi
       JOIN auth.users u ON u.id = bi.user_id
       WHERE bi.trial_ends_at > now()
         AND bi.subscription_plan != 'pro'
         AND NOT EXISTS (
           SELECT 1 FROM user_settings us
           WHERE us.user_id = u.id
             AND us.account_owner_id IS NOT NULL
             AND us.role != 'owner'
         )) AS trial_users,

      (SELECT COUNT(*)::integer FROM auth.users u
       WHERE u.created_at::date = CURRENT_DATE
         AND NOT EXISTS (
           SELECT 1 FROM user_settings us
           WHERE us.user_id = u.id
             AND us.account_owner_id IS NOT NULL
             AND us.role != 'owner'
         )) AS new_registrations,

      (SELECT COUNT(DISTINCT lh.user_id)::integer
       FROM login_history lh
       JOIN auth.users u ON u.id = lh.user_id
       WHERE date_trunc('month', lh.logged_in_at) = date_trunc('month', CURRENT_DATE)
         AND NOT EXISTS (
           SELECT 1 FROM user_settings us
           WHERE us.user_id = u.id
             AND us.account_owner_id IS NOT NULL
             AND us.role != 'owner'
         )) AS mal,

      (SELECT COUNT(*)::integer FROM property_units) AS t_units,
      (SELECT COUNT(*)::integer FROM property_units WHERE status = 'rented') AS r_units,
      (SELECT COUNT(*)::integer FROM property_units WHERE status = 'vacant') AS v_units
  )
  INSERT INTO admin_analytics_snapshots (
    snapshot_date, total_users, pro_users, free_users, trial_users,
    monthly_revenue_cents, new_registrations,
    monthly_active_landlords, total_units, rented_units, vacant_units
  )
  SELECT
    CURRENT_DATE,
    s.total_users,
    s.pro_users,
    s.total_users - s.pro_users,
    s.trial_users,
    s.pro_users * 900,
    s.new_registrations,
    s.mal,
    s.t_units,
    s.r_units,
    s.v_units
  FROM stats s
  ON CONFLICT (snapshot_date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    pro_users = EXCLUDED.pro_users,
    free_users = EXCLUDED.free_users,
    trial_users = EXCLUDED.trial_users,
    monthly_revenue_cents = EXCLUDED.monthly_revenue_cents,
    new_registrations = EXCLUDED.new_registrations,
    monthly_active_landlords = EXCLUDED.monthly_active_landlords,
    total_units = EXCLUDED.total_units,
    rented_units = EXCLUDED.rented_units,
    vacant_units = EXCLUDED.vacant_units,
    created_at = now();
  $$
);

-- 2. Fix admin_take_analytics_snapshot RPC
CREATE OR REPLACE FUNCTION admin_take_analytics_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users     integer;
  v_pro_users       integer;
  v_free_users      integer;
  v_trial_users     integer;
  v_revenue_cents   integer;
  v_new_regs        integer;
  v_mal             integer;
  v_total_units     integer;
  v_rented_units    integer;
  v_vacant_units    integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COUNT(*)::integer INTO v_total_users
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM user_settings us
    WHERE us.user_id = u.id
      AND us.account_owner_id IS NOT NULL
      AND us.role != 'owner'
  );

  SELECT COUNT(*)::integer INTO v_pro_users
  FROM billing_info bi
  JOIN auth.users u ON u.id = bi.user_id
  WHERE bi.subscription_status = 'active'
    AND bi.subscription_plan = 'pro'
    AND NOT EXISTS (
      SELECT 1 FROM user_settings us
      WHERE us.user_id = u.id
        AND us.account_owner_id IS NOT NULL
        AND us.role != 'owner'
    );

  v_free_users := v_total_users - v_pro_users;

  SELECT COUNT(*)::integer INTO v_trial_users
  FROM billing_info bi
  JOIN auth.users u ON u.id = bi.user_id
  WHERE bi.trial_ends_at > now()
    AND bi.subscription_plan != 'pro'
    AND NOT EXISTS (
      SELECT 1 FROM user_settings us
      WHERE us.user_id = u.id
        AND us.account_owner_id IS NOT NULL
        AND us.role != 'owner'
    );

  v_revenue_cents := v_pro_users * 900;

  SELECT COUNT(*)::integer INTO v_new_regs
  FROM auth.users u
  WHERE u.created_at::date = CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM user_settings us
      WHERE us.user_id = u.id
        AND us.account_owner_id IS NOT NULL
        AND us.role != 'owner'
    );

  SELECT COUNT(DISTINCT lh.user_id)::integer INTO v_mal
  FROM login_history lh
  JOIN auth.users u ON u.id = lh.user_id
  WHERE date_trunc('month', lh.logged_in_at) = date_trunc('month', CURRENT_DATE)
    AND NOT EXISTS (
      SELECT 1 FROM user_settings us
      WHERE us.user_id = u.id
        AND us.account_owner_id IS NOT NULL
        AND us.role != 'owner'
    );

  SELECT
    COUNT(*)::integer,
    COUNT(*) FILTER (WHERE status = 'rented')::integer,
    COUNT(*) FILTER (WHERE status = 'vacant')::integer
  INTO v_total_units, v_rented_units, v_vacant_units
  FROM property_units;

  INSERT INTO admin_analytics_snapshots (
    snapshot_date, total_users, pro_users, free_users, trial_users,
    monthly_revenue_cents, new_registrations,
    monthly_active_landlords, total_units, rented_units, vacant_units
  ) VALUES (
    CURRENT_DATE, v_total_users, v_pro_users, v_free_users, v_trial_users,
    v_revenue_cents, v_new_regs,
    v_mal, v_total_units, v_rented_units, v_vacant_units
  )
  ON CONFLICT (snapshot_date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    pro_users = EXCLUDED.pro_users,
    free_users = EXCLUDED.free_users,
    trial_users = EXCLUDED.trial_users,
    monthly_revenue_cents = EXCLUDED.monthly_revenue_cents,
    new_registrations = EXCLUDED.new_registrations,
    monthly_active_landlords = EXCLUDED.monthly_active_landlords,
    total_units = EXCLUDED.total_units,
    rented_units = EXCLUDED.rented_units,
    vacant_units = EXCLUDED.vacant_units;
END;
$$;

-- 3. Fix admin_backfill_analytics_snapshots RPC
CREATE OR REPLACE FUNCTION admin_backfill_analytics_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date  date;
  v_current     date;
  v_total       integer;
  v_pro         integer;
  v_free        integer;
  v_trial       integer;
  v_revenue     integer;
  v_new_regs    integer;
  v_mal         integer;
  v_tunits      integer;
  v_runits      integer;
  v_vunits      integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT MIN(created_at)::date INTO v_start_date FROM auth.users;
  IF v_start_date IS NULL THEN RETURN; END IF;

  v_current := v_start_date;

  WHILE v_current <= CURRENT_DATE LOOP
    SELECT COUNT(*)::integer INTO v_total
    FROM auth.users u
    WHERE u.created_at::date <= v_current
      AND NOT EXISTS (
        SELECT 1 FROM user_settings us
        WHERE us.user_id = u.id
          AND us.account_owner_id IS NOT NULL
          AND us.role != 'owner'
      );

    SELECT COUNT(*)::integer INTO v_pro
    FROM billing_info bi
    JOIN auth.users u ON u.id = bi.user_id
    WHERE bi.subscription_status = 'active'
      AND bi.subscription_plan = 'pro'
      AND u.created_at::date <= v_current
      AND NOT EXISTS (
        SELECT 1 FROM user_settings us
        WHERE us.user_id = u.id
          AND us.account_owner_id IS NOT NULL
          AND us.role != 'owner'
      );

    v_free := v_total - v_pro;

    SELECT COUNT(*)::integer INTO v_trial
    FROM billing_info bi
    JOIN auth.users u ON u.id = bi.user_id
    WHERE bi.trial_ends_at > v_current
      AND bi.subscription_plan != 'pro'
      AND u.created_at::date <= v_current
      AND NOT EXISTS (
        SELECT 1 FROM user_settings us
        WHERE us.user_id = u.id
          AND us.account_owner_id IS NOT NULL
          AND us.role != 'owner'
      );

    v_revenue := v_pro * 900;

    SELECT COUNT(*)::integer INTO v_new_regs
    FROM auth.users u
    WHERE u.created_at::date = v_current
      AND NOT EXISTS (
        SELECT 1 FROM user_settings us
        WHERE us.user_id = u.id
          AND us.account_owner_id IS NOT NULL
          AND us.role != 'owner'
      );

    SELECT COUNT(DISTINCT lh.user_id)::integer INTO v_mal
    FROM login_history lh
    JOIN auth.users u ON u.id = lh.user_id
    WHERE date_trunc('month', lh.logged_in_at) = date_trunc('month', v_current::timestamptz)
      AND lh.logged_in_at::date <= v_current
      AND NOT EXISTS (
        SELECT 1 FROM user_settings us
        WHERE us.user_id = u.id
          AND us.account_owner_id IS NOT NULL
          AND us.role != 'owner'
      );

    SELECT
      COUNT(*)::integer,
      COUNT(*) FILTER (WHERE pu.status = 'rented')::integer,
      COUNT(*) FILTER (WHERE pu.status = 'vacant')::integer
    INTO v_tunits, v_runits, v_vunits
    FROM property_units pu
    WHERE pu.created_at::date <= v_current;

    INSERT INTO admin_analytics_snapshots (
      snapshot_date, total_users, pro_users, free_users, trial_users,
      monthly_revenue_cents, new_registrations,
      monthly_active_landlords, total_units, rented_units, vacant_units
    ) VALUES (
      v_current, v_total, v_pro, v_free, v_trial,
      v_revenue, v_new_regs,
      v_mal, v_tunits, v_runits, v_vunits
    )
    ON CONFLICT (snapshot_date) DO UPDATE SET
      total_users = EXCLUDED.total_users,
      pro_users = EXCLUDED.pro_users,
      free_users = EXCLUDED.free_users,
      trial_users = EXCLUDED.trial_users,
      monthly_revenue_cents = EXCLUDED.monthly_revenue_cents,
      new_registrations = EXCLUDED.new_registrations,
      monthly_active_landlords = EXCLUDED.monthly_active_landlords,
      total_units = EXCLUDED.total_units,
      rented_units = EXCLUDED.rented_units,
      vacant_units = EXCLUDED.vacant_units;

    v_current := v_current + 1;
  END LOOP;
END;
$$;
