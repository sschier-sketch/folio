/*
  # Add Monthly Active Landlords and Active Units to Analytics Snapshots

  1. Modified Tables
    - `admin_analytics_snapshots`
      - `monthly_active_landlords` (integer) - Users who logged in at least once in the current calendar month
      - `total_units` (integer) - Total property units in the system
      - `rented_units` (integer) - Units with status 'rented'
      - `vacant_units` (integer) - Units with status 'vacant'

  2. Updated Functions
    - `admin_take_analytics_snapshot()` - Now computes MAL from login_history and unit counts from property_units
    - `admin_backfill_analytics_snapshots()` - Now computes historical MAL and unit counts
    - `admin_get_analytics_snapshots()` - Returns new columns (DROP + recreate due to changed return type)

  3. Important Notes
    - MAL = distinct users with at least one login_history entry in the calendar month of the snapshot_date
    - Active units = total property_units across all users
    - Backfill uses login_history and property_units created_at for historical data
*/

-- 1. Add new columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_analytics_snapshots' AND column_name = 'monthly_active_landlords'
  ) THEN
    ALTER TABLE admin_analytics_snapshots ADD COLUMN monthly_active_landlords integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_analytics_snapshots' AND column_name = 'total_units'
  ) THEN
    ALTER TABLE admin_analytics_snapshots ADD COLUMN total_units integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_analytics_snapshots' AND column_name = 'rented_units'
  ) THEN
    ALTER TABLE admin_analytics_snapshots ADD COLUMN rented_units integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_analytics_snapshots' AND column_name = 'vacant_units'
  ) THEN
    ALTER TABLE admin_analytics_snapshots ADD COLUMN vacant_units integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2. Recreate admin_take_analytics_snapshot with new columns
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
  WHERE bi.is_trial = true
    AND bi.trial_ends_at > now()
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

-- 3. DROP and recreate admin_get_analytics_snapshots (return type changed)
DROP FUNCTION IF EXISTS admin_get_analytics_snapshots(date, date);

CREATE FUNCTION admin_get_analytics_snapshots(p_from_date date, p_to_date date)
RETURNS TABLE (
  snapshot_date date,
  total_users integer,
  pro_users integer,
  free_users integer,
  trial_users integer,
  monthly_revenue_cents integer,
  new_registrations integer,
  monthly_active_landlords integer,
  total_units integer,
  rented_units integer,
  vacant_units integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    s.snapshot_date,
    s.total_users,
    s.pro_users,
    s.free_users,
    s.trial_users,
    s.monthly_revenue_cents,
    s.new_registrations,
    s.monthly_active_landlords,
    s.total_units,
    s.rented_units,
    s.vacant_units
  FROM admin_analytics_snapshots s
  WHERE s.snapshot_date BETWEEN p_from_date AND p_to_date
  ORDER BY s.snapshot_date ASC;
END;
$$;

-- 4. Recreate admin_backfill_analytics_snapshots with new columns
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
    WHERE bi.is_trial = true
      AND bi.trial_ends_at > v_current
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
