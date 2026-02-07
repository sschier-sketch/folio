/*
  Create Robust Referral Sessions System
  
  Adds ref_sid (referral session ID) tracking for maximum attribution robustness.
  Integrates with existing referral_click_events and attribution system.
  
  New Tables:
  - referral_sessions: Server-side session tracking with ref_sid
  
  Security: RLS enabled, sessions can be read/updated by anyone (for tracking)
  Privacy: IP and user agent hashed, sessions expire after 30 days
  
  Integration Notes:
  - Extends existing track-referral-click edge function
  - Works with existing user_settings.referral_code and affiliate_referrals
  - No duplicate attribution - uses existing attribution tables
*/

-- Create referral_sessions table
CREATE TABLE IF NOT EXISTS referral_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_sid uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  ref_code text NOT NULL,
  landing_path text,
  referrer_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  full_query_string text,
  ip_hash text,
  ua_hash text,
  attributed_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_sessions_ref_sid ON referral_sessions(ref_sid);
CREATE INDEX IF NOT EXISTS idx_referral_sessions_ref_code ON referral_sessions(ref_code);
CREATE INDEX IF NOT EXISTS idx_referral_sessions_attributed_user ON referral_sessions(attributed_user_id) WHERE attributed_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referral_sessions_expires_at ON referral_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_referral_sessions_ip_ua_hash ON referral_sessions(ip_hash, ua_hash) WHERE ip_hash IS NOT NULL AND ua_hash IS NOT NULL;

-- Add ref_sid to referral_click_events for correlation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_click_events' AND column_name = 'ref_sid'
  ) THEN
    ALTER TABLE referral_click_events ADD COLUMN ref_sid uuid;
    CREATE INDEX IF NOT EXISTS idx_referral_click_events_ref_sid ON referral_click_events(ref_sid);
  END IF;
END $$;

-- Add UTM fields to referral_click_events if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_click_events' AND column_name = 'utm_term'
  ) THEN
    ALTER TABLE referral_click_events ADD COLUMN utm_term text;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_click_events' AND column_name = 'utm_content'
  ) THEN
    ALTER TABLE referral_click_events ADD COLUMN utm_content text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE referral_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert and read sessions (needed for tracking before signup)
CREATE POLICY "Anyone can insert referral sessions"
  ON referral_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read referral sessions"
  ON referral_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Anyone can update sessions (for last_seen updates)
CREATE POLICY "Anyone can update referral sessions"
  ON referral_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Admins can delete sessions
CREATE POLICY "Admins can delete referral sessions"
  ON referral_sessions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

-- Function to clean up expired sessions (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_referral_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM referral_sessions
  WHERE expires_at < now() - interval '7 days'
    AND attributed_user_id IS NULL;
END;
$$;
