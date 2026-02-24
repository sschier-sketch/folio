/*
  # Create Admin Analytics Snapshots System

  1. New Tables
    - `admin_analytics_snapshots`
      - `id` (bigint, primary key, auto-generated)
      - `snapshot_date` (date, unique, the date this snapshot represents)
      - `total_users` (integer, total registered users)
      - `pro_users` (integer, users with active pro subscription)
      - `free_users` (integer, users without pro subscription)
      - `trial_users` (integer, users currently on trial)
      - `monthly_revenue_cents` (integer, estimated monthly revenue in cents)
      - `new_registrations` (integer, new users registered on this date)
      - `created_at` (timestamptz, when the snapshot was taken)

  2. Security
    - Enable RLS on `admin_analytics_snapshots` table
    - Only admin users can read snapshots

  3. Functions
    - `admin_take_analytics_snapshot()` - captures current stats as a daily snapshot
    - `admin_get_analytics_snapshots(from_date, to_date)` - returns snapshots for a date range

  4. Important Notes
    - Snapshots are taken daily and store aggregate user/revenue metrics
    - Historical data enables trend analysis in admin dashboard
    - Revenue is estimated based on pro user count * plan price
*/

CREATE TABLE IF NOT EXISTS admin_analytics_snapshots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_date date NOT NULL,
  total_users integer NOT NULL DEFAULT 0,
  pro_users integer NOT NULL DEFAULT 0,
  free_users integer NOT NULL DEFAULT 0,
  trial_users integer NOT NULL DEFAULT 0,
  monthly_revenue_cents integer NOT NULL DEFAULT 0,
  new_registrations integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT admin_analytics_snapshots_date_unique UNIQUE (snapshot_date)
);

ALTER TABLE admin_analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read analytics snapshots"
  ON admin_analytics_snapshots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_admin_analytics_snapshots_date
  ON admin_analytics_snapshots (snapshot_date DESC);

CREATE OR REPLACE FUNCTION admin_take_analytics_snapshot()
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
  FROM auth.users;

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
  FROM auth.users
  WHERE created_at::date = v_today;

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

CREATE OR REPLACE FUNCTION admin_get_analytics_snapshots(
  p_from_date date,
  p_to_date date
)
RETURNS TABLE (
  snapshot_date date,
  total_users integer,
  pro_users integer,
  free_users integer,
  trial_users integer,
  monthly_revenue_cents integer,
  new_registrations integer
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
    s.new_registrations
  FROM admin_analytics_snapshots s
  WHERE s.snapshot_date BETWEEN p_from_date AND p_to_date
  ORDER BY s.snapshot_date ASC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_backfill_analytics_snapshots()
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
END;
$$;
