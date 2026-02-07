/*
  # Create user mail settings and mail templates

  1. New Tables
    - `user_mail_settings`
      - `user_id` (uuid, primary key, references auth.users)
      - `sender_name` (text) - custom display name for outgoing emails
      - `signature` (text) - email signature appended to all outgoing messages
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `user_mail_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, not null) - template name
      - `category` (text) - template category for organization
      - `subject` (text) - pre-filled email subject
      - `content` (text, not null) - template body text
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only read/write their own settings and templates
*/

CREATE TABLE IF NOT EXISTS user_mail_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name text NOT NULL DEFAULT '',
  signature text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_mail_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mail settings"
  ON user_mail_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mail settings"
  ON user_mail_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mail settings"
  ON user_mail_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS user_mail_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Sonstiges',
  subject text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_mail_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own mail templates"
  ON user_mail_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mail templates"
  ON user_mail_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mail templates"
  ON user_mail_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mail templates"
  ON user_mail_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_mail_templates_user_id ON user_mail_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mail_templates_category ON user_mail_templates(user_id, category);
