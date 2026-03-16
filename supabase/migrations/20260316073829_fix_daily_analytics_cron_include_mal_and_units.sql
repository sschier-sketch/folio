/*
  # Fix daily analytics cron job to include MAL and unit counts

  The daily-analytics-snapshot cron job was using an outdated SQL statement
  that only inserted/updated 6 columns (total_users, pro_users, free_users,
  trial_users, monthly_revenue_cents, new_registrations). The 4 columns added
  later (monthly_active_landlords, total_units, rented_units, vacant_units)
  were not included, causing them to be overwritten with 0 every day at 01:00.

  ## Changes
  1. Unschedule the old cron job
  2. Create a new cron job that includes all 10 columns
  3. Also excludes sub-users from counts (consistent with the RPC functions)

  ## Important Notes
  - This was causing the admin dashboard to show 0 for active users and units
    every day after the 01:00 cron ran
  - The fix recalculates today's snapshot immediately
*/

-- 1. Remove the old cron job
SELECT cron.unschedule('daily-analytics-snapshot');

-- 2. Create the corrected cron job with all columns
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
         AND NOT EXISTS (
           SELECT 1 FROM user_settings us
           WHERE us.user_id = u.id
             AND us.account_owner_id IS NOT NULL
             AND us.role != 'owner'
         )) AS pro_users,

      (SELECT COUNT(*)::integer FROM billing_info bi
       JOIN auth.users u ON u.id = bi.user_id
       WHERE bi.is_trial = true
         AND bi.trial_ends_at > now()
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

      (SELECT COUNT(*)::integer FROM property_units) AS total_units,
      (SELECT COUNT(*)::integer FROM property_units WHERE status = 'rented') AS rented_units,
      (SELECT COUNT(*)::integer FROM property_units WHERE status = 'vacant') AS vacant_units
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
    s.total_units,
    s.rented_units,
    s.vacant_units
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
