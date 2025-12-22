/*
  # Benutzereinladungen und Empfehlungsprogramm

  1. Neue Tabellen
    - `user_invitations`
      - `id` (uuid, primary key)
      - `inviter_id` (uuid) - Benutzer der einlädt
      - `invitee_email` (text) - E-Mail des Eingeladenen
      - `invitee_user_id` (uuid, nullable) - User ID nach Registrierung
      - `status` (text) - pending, accepted, expired
      - `created_at` (timestamptz)
      - `accepted_at` (timestamptz, nullable)
      - `expires_at` (timestamptz)
    
    - `user_referrals`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid) - Werbender Benutzer
      - `referred_user_id` (uuid) - Geworbener Benutzer
      - `referral_code` (text) - Eindeutiger Referral Code
      - `status` (text) - pending, completed
      - `reward_earned` (boolean) - Ob Belohnung verdient wurde
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
    
    - `user_settings`
      - `user_id` (uuid, primary key)
      - `referral_code` (text, unique) - Persönlicher Referral Code
      - `theme` (text) - light, dark, auto
      - `notifications_enabled` (boolean)
      - `language` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS auf allen neuen Tabellen
    - Policies für authentifizierte Benutzer
*/

-- Erstelle user_invitations Tabelle
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_email text NOT NULL,
  invitee_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamptz DEFAULT now() NOT NULL,
  accepted_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days') NOT NULL
);

ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invitations"
  ON user_invitations FOR SELECT
  TO authenticated
  USING (auth.uid() = inviter_id);

CREATE POLICY "Users can create invitations"
  ON user_invitations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update own invitations"
  ON user_invitations FOR UPDATE
  TO authenticated
  USING (auth.uid() = inviter_id)
  WITH CHECK (auth.uid() = inviter_id);

-- Erstelle user_referrals Tabelle
CREATE TABLE IF NOT EXISTS user_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  reward_earned boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

ALTER TABLE user_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals"
  ON user_referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals"
  ON user_referrals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update own referrals"
  ON user_referrals FOR UPDATE
  TO authenticated
  USING (auth.uid() = referrer_id)
  WITH CHECK (auth.uid() = referrer_id);

-- Erstelle user_settings Tabelle
CREATE TABLE IF NOT EXISTS user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text UNIQUE NOT NULL,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  notifications_enabled boolean DEFAULT true NOT NULL,
  language text DEFAULT 'de',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Funktion zum Generieren eines eindeutigen Referral Codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger zum automatischen Erstellen von User Settings bei Registrierung
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
DECLARE
  new_code text;
BEGIN
  LOOP
    new_code := generate_referral_code();
    BEGIN
      INSERT INTO user_settings (user_id, referral_code)
      VALUES (NEW.id, new_code);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      CONTINUE;
    END;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_settings'
  ) THEN
    CREATE TRIGGER on_auth_user_created_settings
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_user_settings();
  END IF;
END $$;

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_inviter ON user_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_settings_referral_code ON user_settings(referral_code);
