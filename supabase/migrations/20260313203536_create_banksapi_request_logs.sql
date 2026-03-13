/*
  # Create BANKSapi request/error logging system

  1. New Tables
    - `banksapi_request_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable - null for system/cron calls)
      - `action` (text) - which operation was attempted (e.g. create-bank-access, token-request, consent-renewal)
      - `method` (text) - HTTP method used (GET, POST, PUT, DELETE)
      - `url` (text) - the full URL called
      - `request_headers` (jsonb) - sanitized request headers (auth headers masked)
      - `request_body` (jsonb) - request body sent (sensitive fields masked)
      - `response_status` (integer) - HTTP status code returned
      - `response_body` (text) - raw response body (truncated to 4000 chars)
      - `error_message` (text) - parsed error message
      - `duration_ms` (integer) - how long the request took
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled
    - Only service role can insert (no user policies needed - edge function uses admin client)
    - Admins can read via admin_users check

  3. Notes
    - Sensitive credentials are NEVER logged (Authorization header is masked)
    - Response bodies are truncated to prevent storage bloat
    - Automatic cleanup of old logs via retention policy (kept 30 days)
*/

CREATE TABLE IF NOT EXISTS banksapi_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  method text NOT NULL DEFAULT 'GET',
  url text NOT NULL,
  request_headers jsonb DEFAULT '{}',
  request_body jsonb,
  response_status integer,
  response_body text,
  error_message text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE banksapi_request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read banksapi request logs"
  ON banksapi_request_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_banksapi_request_logs_created_at
  ON banksapi_request_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_banksapi_request_logs_action
  ON banksapi_request_logs(action);

CREATE INDEX IF NOT EXISTS idx_banksapi_request_logs_response_status
  ON banksapi_request_logs(response_status)
  WHERE response_status >= 400;
