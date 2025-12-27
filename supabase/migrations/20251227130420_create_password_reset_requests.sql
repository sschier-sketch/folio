/*
  # Password Reset Requests Table

  1. New Tables
    - `password_reset_requests`
      - `id` (uuid, primary key) - Unique identifier
      - `email` (text) - User's email address
      - `new_password_hash` (text) - Hashed new password (temporary storage)
      - `verification_token` (uuid) - Unique token for verification
      - `created_at` (timestamptz) - When the request was created
      - `expires_at` (timestamptz) - When the token expires (24 hours)
      - `used` (boolean) - Whether the token has been used
  
  2. Security
    - Enable RLS on `password_reset_requests` table
    - No direct access policies (only via Edge Functions)
    - Automatic cleanup of expired requests
  
  3. Notes
    - Tokens expire after 24 hours
    - Used tokens cannot be reused
    - Old requests are automatically deleted after 7 days
*/

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  new_password_hash text NOT NULL,
  verification_token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  used boolean DEFAULT false
);

ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- No direct access - only via Edge Functions with service role
CREATE POLICY "No direct access to password reset requests"
  ON password_reset_requests
  FOR ALL
  TO authenticated
  USING (false);

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_token 
  ON password_reset_requests(verification_token, used, expires_at);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_email 
  ON password_reset_requests(email, created_at DESC);

-- Function to clean up old requests
CREATE OR REPLACE FUNCTION cleanup_old_password_reset_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM password_reset_requests
  WHERE created_at < now() - interval '7 days';
END;
$$;