/*
  # Restore Custom Password Reset System with Email Templates
  
  1. New Tables
    - `password_reset_requests`
      - `id` (uuid, primary key)
      - `email` (text) - User's email address
      - `new_password_encrypted` (text) - Encrypted new password
      - `verification_token` (uuid) - Unique verification token
      - `used` (boolean) - Whether the reset has been completed
      - `expires_at` (timestamptz) - Expiration time (24 hours)
      - `created_at` (timestamptz) - Creation timestamp
  
  2. Security
    - Enable RLS on `password_reset_requests` table
    - No direct user access (only via Edge Functions with service role)
    - Automatic cleanup of old requests
  
  3. Purpose
    - Replace Supabase native auth password reset with custom system
    - Use custom email templates from `email_templates` table
    - Log all password reset emails in `email_logs` table
*/

CREATE TABLE IF NOT EXISTS password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  new_password_encrypted text NOT NULL,
  verification_token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  used boolean DEFAULT false NOT NULL,
  expires_at timestamptz DEFAULT (now() + interval '24 hours') NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to password reset requests"
  ON password_reset_requests
  FOR ALL
  TO authenticated
  USING (false);

CREATE INDEX IF NOT EXISTS idx_password_reset_token 
  ON password_reset_requests(verification_token, used, expires_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_email 
  ON password_reset_requests(email, created_at DESC);

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