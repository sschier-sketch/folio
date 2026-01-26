/*
  # Bankverbindung und Passwortänderung für Benutzer

  1. Neue Tabelle
    - `user_bank_details` - Bankverbindung der Benutzer
      - `user_id` (uuid, FK) - Referenz auf auth.users
      - `account_holder` (text) - Kontoinhaber
      - `iban` (text) - IBAN
      - `bic` (text, optional) - BIC
      - `bank_name` (text, optional) - Bank Name
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sicherheit
    - RLS aktiviert
    - Benutzer können nur ihre eigenen Bankdaten sehen und verwalten
*/

CREATE TABLE IF NOT EXISTS user_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  account_holder text NOT NULL,
  iban text NOT NULL,
  bic text,
  bank_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank details"
  ON user_bank_details FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank details"
  ON user_bank_details FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank details"
  ON user_bank_details FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank details"
  ON user_bank_details FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_bank_details_user_id ON user_bank_details(user_id);