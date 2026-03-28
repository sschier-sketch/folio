/*
  # Onboarding Import Logs

  1. New Tables
    - `onboarding_import_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `properties_count` (integer) - number of properties imported
      - `units_count` (integer) - number of units imported
      - `tenants_count` (integer) - number of tenants imported
      - `contracts_count` (integer) - number of contracts imported
      - `errors` (text[]) - array of error messages, null if no errors
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled
    - Users can only read and insert their own import logs
*/

CREATE TABLE IF NOT EXISTS onboarding_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  properties_count integer NOT NULL DEFAULT 0,
  units_count integer NOT NULL DEFAULT 0,
  tenants_count integer NOT NULL DEFAULT 0,
  contracts_count integer NOT NULL DEFAULT 0,
  errors text[] DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE onboarding_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own import logs"
  ON onboarding_import_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import logs"
  ON onboarding_import_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_import_logs_user_id
  ON onboarding_import_logs(user_id);
