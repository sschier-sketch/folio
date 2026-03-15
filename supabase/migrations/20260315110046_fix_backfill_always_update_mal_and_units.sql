/*
  # Fix backfill to always update MAL and unit counts

  1. Changes
    - `admin_backfill_analytics_snapshots()` now always updates monthly_active_landlords
      and unit counts for every snapshot row, not just new ones
    - Removes the conditional skip that prevented updating existing rows

  2. Important Notes
    - Previously existing snapshots had 0 for the new columns because the backfill
      skipped rows that already existed
    - Now every row gets recalculated on backfill
*/

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
