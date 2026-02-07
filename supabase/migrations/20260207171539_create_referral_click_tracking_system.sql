/*
  Create Referral Click Tracking System
  
  Implements comprehensive click tracking for referral links to enable conversion funnel analysis.
  Tracks clicks on referral links before users sign up, providing visibility into conversion rates.
  
  New Tables:
  - referral_click_events: Stores each click on a referral link for analytics
  
  Security: RLS enabled, public can insert (no auth), users can view own clicks, admins see all
  Privacy: IP and user agent are hashed for GDPR compliance
*/

-- Create referral_click_events table
CREATE TABLE IF NOT EXISTS referral_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  landing_path text,
  referrer_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent_hash text,
  ip_hash text,
  country_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_click_events_code ON referral_click_events(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_click_events_session ON referral_click_events(session_id);
CREATE INDEX IF NOT EXISTS idx_referral_click_events_created_at ON referral_click_events(created_at);
CREATE INDEX IF NOT EXISTS idx_referral_click_events_user_id ON referral_click_events(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE referral_click_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert click events (for tracking before signup)
CREATE POLICY "Anyone can insert click events"
  ON referral_click_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Users can view clicks for their own referral codes
CREATE POLICY "Users can view own referral clicks"
  ON referral_click_events
  FOR SELECT
  TO authenticated
  USING (
    referral_code IN (
      SELECT referral_code FROM user_settings WHERE user_id = auth.uid()
    )
    OR referral_code IN (
      SELECT affiliate_code FROM affiliates WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can view all click events
CREATE POLICY "Admins can view all click events"
  ON referral_click_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );
