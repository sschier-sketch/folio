/*
  # Erweitertes Empfehlungsprogramm mit Belohnungssystem

  1. Neue Tabellen
    - `referral_rewards`
      - Speichert verdiente und verwendete Belohnungen
      - Trackt PRO-Monate für jeden Benutzer
      - Speichert Start- und Enddatum der Belohnung
      - Status: pending, active, used, expired
    
  2. Änderungen
    - user_referrals Tabelle wird erweitert um reward_months zu speichern
    
  3. Sicherheit
    - RLS für alle neuen Tabellen
    - Benutzer können nur ihre eigenen Belohnungen sehen
    - Admins können alle Belohnungen verwalten
*/

CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_id uuid REFERENCES user_referrals(id) ON DELETE CASCADE,
  reward_type text NOT NULL CHECK (reward_type IN ('pro_upgrade', 'pro_extension')),
  months_granted integer NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'used', 'expired')),
  activated_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_referrals ADD COLUMN IF NOT EXISTS reward_months integer DEFAULT 2;
ALTER TABLE user_referrals ADD COLUMN IF NOT EXISTS reward_activated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_status ON referral_rewards(status);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral_id ON referral_rewards(referral_id);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
  ON referral_rewards
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all rewards"
  ON referral_rewards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert rewards"
  ON referral_rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update rewards"
  ON referral_rewards
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_referral_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_referral_rewards_updated_at
  BEFORE UPDATE ON referral_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_rewards_updated_at();
