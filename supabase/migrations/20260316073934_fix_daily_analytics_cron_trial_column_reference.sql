/*
  # Fix daily analytics cron: correct trial_users column reference

  The previous migration used `bi.is_trial` which does not exist in billing_info.
  Trial status is determined via `bi.trial_ends_at > now()` and 
  `bi.subscription_plan != 'pro'`.

  ## Changes
  1. Unschedule and recreate the cron job with corrected trial_users query

  ## Important Notes
  - billing_info has no `is_trial` column; trial is detected via trial_ends_at
*/

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
