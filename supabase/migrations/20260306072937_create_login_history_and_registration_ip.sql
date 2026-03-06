/*
  # Login History & Registration IP Tracking

  1. New Tables
    - `login_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `ip_address` (text) - IP address at login time
      - `city` (text) - resolved city from IP
      - `country` (text) - resolved country from IP
      - `user_agent` (text) - browser user agent string
      - `logged_in_at` (timestamptz) - timestamp of login

  2. Modified Tables
    - `account_profiles`
      - `registration_ip` (text) - IP address at signup
      - `registration_city` (text) - resolved city from IP at signup
      - `registration_country` (text) - resolved country from IP at signup

  3. Security
    - Enable RLS on `login_history`
    - Admin-only read access to login_history
    - Users cannot access login_history directly
*/

CREATE TABLE IF NOT EXISTS login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ip_address text,
  city text,
  country text,
  user_agent text,
  logged_in_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all login history"
  ON login_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert login history"
  ON login_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_logged_in_at ON login_history(logged_in_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_profiles' AND column_name = 'registration_ip'
  ) THEN
    ALTER TABLE account_profiles ADD COLUMN registration_ip text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_profiles' AND column_name = 'registration_city'
  ) THEN
    ALTER TABLE account_profiles ADD COLUMN registration_city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_profiles' AND column_name = 'registration_country'
  ) THEN
    ALTER TABLE account_profiles ADD COLUMN registration_country text;
  END IF;
END $$;
