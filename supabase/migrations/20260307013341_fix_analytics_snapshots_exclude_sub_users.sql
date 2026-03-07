/*
  # Fix analytics snapshots to exclude sub-users from counts

  ## Problem
  The `admin_take_analytics_snapshot` and `admin_backfill_analytics_snapshots`
  functions count ALL auth.users, including sub-users (team members). This
  inflates the total_users count incorrectly.

  ## Fix
  - Exclude users who have a user_settings row with account_owner_id set
    and role != 'owner' from total_users and new_registrations counts
  - Also exclude sub-users from free_users calculation

  ## Modified Functions
  - `admin_take_analytics_snapshot()` - excludes sub-users
  - `admin_backfill_analytics_snapshots()` - excludes sub-users
*/

CREATE OR REPLACE FUNCTION public.admin_take_analytics_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_pro integer;
  v_free integer;
  v_trial integer;
  v_new_regs integer;
  v_today date := CURRENT_DATE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT count(*) INTO v_total
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_settings sub_us
    WHERE sub_us.user_id = u.id
    AND sub_us.account_owner_id IS NOT NULL
    AND sub_us.removed_at IS NULL
    AND sub_us.role != 'owner'
  );

  SELECT count(*) INTO v_pro
  FROM billing_info
  WHERE subscription_plan = 'pro'
  AND (subscription_ends_at IS NULL OR subscription_ends_at > now());

  v_free := v_total - v_pro;

  SELECT count(*) INTO v_trial
  FROM billing_info
  WHERE trial_ends_at > now()
  AND subscription_plan != 'pro';

  SELECT count(*) INTO v_new_regs
  FROM auth.users u
  WHERE u.created_at::date = v_today
  AND NOT EXISTS (
    SELECT 1 FROM public.user_settings sub_us
    WHERE sub_us.user_id = u.id
    AND sub_us.account_owner_id IS NOT NULL
    AND sub_us.removed_at IS NULL
    AND sub_us.role != 'owner'
  );

  INSERT INTO admin_analytics_snapshots (
    snapshot_date, total_users, pro_users, free_users, trial_users,
    monthly_revenue_cents, new_registrations
  )
  VALUES (
    v_today, v_total, v_pro, v_free, v_trial,
    v_pro * 900, v_new_regs
  )
  ON CONFLICT (snapshot_date)
  DO UPDATE SET
    total_users = EXCLUDED.total_users,
    pro_users = EXCLUDED.pro_users,
    free_users = EXCLUDED.free_users,
    trial_users = EXCLUDED.trial_users,
    monthly_revenue_cents = EXCLUDED.monthly_revenue_cents,
    new_registrations = EXCLUDED.new_registrations,
    created_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_backfill_analytics_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date date;
  v_total integer;
  v_pro integer;
  v_trial integer;
  v_new_regs integer;
  v_start_date date;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COALESCE(
    (SELECT min(created_at)::date FROM auth.users),
    CURRENT_DATE - INTERVAL '90 days'
  ) INTO v_start_date;

  FOR v_date IN
    SELECT generate_series(v_start_date, CURRENT_DATE, '1 day'::interval)::date
  LOOP
    IF NOT EXISTS (SELECT 1 FROM admin_analytics_snapshots WHERE admin_analytics_snapshots.snapshot_date = v_date) THEN
      SELECT count(*) INTO v_total
      FROM auth.users u
      WHERE u.created_at::date <= v_date
      AND NOT EXISTS (
        SELECT 1 FROM public.user_settings sub_us
        WHERE sub_us.user_id = u.id
        AND sub_us.account_owner_id IS NOT NULL
        AND sub_us.removed_at IS NULL
        AND sub_us.role != 'owner'
      );

      SELECT count(*) INTO v_pro
      FROM billing_info
      WHERE subscription_plan = 'pro'
      AND created_at::date <= v_date
      AND (subscription_ends_at IS NULL OR subscription_ends_at > v_date);

      SELECT count(*) INTO v_trial
      FROM billing_info
      WHERE trial_ends_at > v_date
      AND subscription_plan != 'pro'
      AND created_at::date <= v_date;

      SELECT count(*) INTO v_new_regs
      FROM auth.users u
      WHERE u.created_at::date = v_date
      AND NOT EXISTS (
        SELECT 1 FROM public.user_settings sub_us
        WHERE sub_us.user_id = u.id
        AND sub_us.account_owner_id IS NOT NULL
        AND sub_us.removed_at IS NULL
        AND sub_us.role != 'owner'
      );

      INSERT INTO admin_analytics_snapshots (
        snapshot_date, total_users, pro_users, free_users, trial_users,
        monthly_revenue_cents, new_registrations
      )
      VALUES (
        v_date, v_total, v_pro, v_total - v_pro, v_trial,
        v_pro * 900, v_new_regs
      )
      ON CONFLICT (snapshot_date) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;
