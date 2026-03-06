/*
  # Add geo_resolved_at columns for async geo resolution

  1. Modified Tables
    - `login_history`
      - Added `geo_resolved_at` (timestamptz) - tracks when geo lookup was completed
    - `account_profiles`
      - Added `geo_resolved_at` (timestamptz) - tracks when registration geo lookup was completed

  2. Indexes
    - Index on login_history for unresolved entries (used by cron)
    - Index on account_profiles for unresolved registration geo

  3. Notes
    - IP is always saved immediately from request headers
    - Geo (city/country) is resolved asynchronously by a cron job
    - geo_resolved_at = NULL means geo has not been resolved yet
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'login_history' AND column_name = 'geo_resolved_at'
  ) THEN
    ALTER TABLE login_history ADD COLUMN geo_resolved_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_profiles' AND column_name = 'geo_resolved_at'
  ) THEN
    ALTER TABLE account_profiles ADD COLUMN geo_resolved_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_login_history_geo_unresolved
  ON login_history (logged_in_at DESC)
  WHERE ip_address IS NOT NULL AND geo_resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_account_profiles_geo_unresolved
  ON account_profiles (user_id)
  WHERE registration_ip IS NOT NULL AND geo_resolved_at IS NULL;
