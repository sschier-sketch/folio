/*
  # Backfill Analytics Snapshots and Setup Daily Cron Job

  1. Changes
    - Backfills admin_analytics_snapshots with historical data for all days since the first user registered
    - Creates a daily cron job that runs admin_take_analytics_snapshot at 01:00 UTC every day

  2. Important Notes
    - The backfill calculates user counts by looking at created_at dates
    - Pro user counts are estimated based on billing_info records
    - The cron job ensures fresh data is captured every day going forward
*/

DO $$
DECLARE
  v_date date;
  v_total integer;
  v_pro integer;
  v_trial integer;
  v_new_regs integer;
  v_start_date date;
BEGIN
  SELECT COALESCE(
    (SELECT min(created_at)::date FROM auth.users),
    CURRENT_DATE - INTERVAL '90 days'
  ) INTO v_start_date;

  FOR v_date IN
    SELECT generate_series(v_start_date, CURRENT_DATE, '1 day'::interval)::date
  LOOP
    IF NOT EXISTS (SELECT 1 FROM admin_analytics_snapshots WHERE admin_analytics_snapshots.snapshot_date = v_date) THEN
      SELECT count(*) INTO v_total
      FROM auth.users
      WHERE created_at::date <= v_date;

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
      FROM auth.users
      WHERE created_at::date = v_date;

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
END $$;

SELECT cron.schedule(
  'daily-analytics-snapshot',
  '0 1 * * *',
  $$
    INSERT INTO admin_analytics_snapshots (
      snapshot_date, total_users, pro_users, free_users, trial_users,
      monthly_revenue_cents, new_registrations
    )
    SELECT
      CURRENT_DATE,
      (SELECT count(*) FROM auth.users),
      (SELECT count(*) FROM billing_info WHERE subscription_plan = 'pro' AND (subscription_ends_at IS NULL OR subscription_ends_at > now())),
      (SELECT count(*) FROM auth.users) - (SELECT count(*) FROM billing_info WHERE subscription_plan = 'pro' AND (subscription_ends_at IS NULL OR subscription_ends_at > now())),
      (SELECT count(*) FROM billing_info WHERE trial_ends_at > now() AND subscription_plan != 'pro'),
      (SELECT count(*) FROM billing_info WHERE subscription_plan = 'pro' AND (subscription_ends_at IS NULL OR subscription_ends_at > now())) * 900,
      (SELECT count(*) FROM auth.users WHERE created_at::date = CURRENT_DATE)
    ON CONFLICT (snapshot_date)
    DO UPDATE SET
      total_users = EXCLUDED.total_users,
      pro_users = EXCLUDED.pro_users,
      free_users = EXCLUDED.free_users,
      trial_users = EXCLUDED.trial_users,
      monthly_revenue_cents = EXCLUDED.monthly_revenue_cents,
      new_registrations = EXCLUDED.new_registrations,
      created_at = now();
  $$
);
