/*
  # Account Profiles for Landlords

  1. New Tables
    - `account_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `first_name` (text) - Vorname
      - `last_name` (text) - Nachname
      - `company_name` (text, optional) - Firma/Organisation
      - `address_street` (text) - Straße + Hausnummer
      - `address_zip` (text) - PLZ
      - `address_city` (text) - Ort
      - `address_country` (text) - Land
      - `phone` (text, optional) - Telefonnummer
      - `document_sender_name` (text) - Absendername für Dokumente
      - `document_signature` (text) - Signatur für Schreiben
      - `logo_file_ref` (text, optional) - Logo-Referenz
      - `reminder_dismissed_until` (timestamptz, optional) - Reminder-Status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `account_profiles` table
    - Add policy for users to read and update their own profile
    - Add policy for admin users to read all profiles

  3. Functions
    - Add helper function to check profile completion status
*/

CREATE TABLE IF NOT EXISTS account_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name text,
  last_name text,
  company_name text,
  address_street text,
  address_zip text,
  address_city text,
  address_country text DEFAULT 'Deutschland',
  phone text,
  document_sender_name text,
  document_signature text,
  logo_file_ref text,
  reminder_dismissed_until timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE account_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON account_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON account_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON account_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON account_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_account_profiles_user_id ON account_profiles(user_id);

CREATE OR REPLACE FUNCTION is_profile_complete(profile_record account_profiles)
RETURNS boolean AS $$
BEGIN
  RETURN (
    profile_record.first_name IS NOT NULL AND profile_record.first_name != '' AND
    profile_record.last_name IS NOT NULL AND profile_record.last_name != '' AND
    profile_record.address_street IS NOT NULL AND profile_record.address_street != '' AND
    profile_record.address_zip IS NOT NULL AND profile_record.address_zip != '' AND
    profile_record.address_city IS NOT NULL AND profile_record.address_city != '' AND
    profile_record.address_country IS NOT NULL AND profile_record.address_country != '' AND
    profile_record.document_sender_name IS NOT NULL AND profile_record.document_sender_name != '' AND
    profile_record.document_signature IS NOT NULL AND profile_record.document_signature != ''
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_account_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_account_profiles_updated_at ON account_profiles;
CREATE TRIGGER update_account_profiles_updated_at
  BEFORE UPDATE ON account_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_account_profile_updated_at();
