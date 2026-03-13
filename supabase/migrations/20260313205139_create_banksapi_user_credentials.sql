/*
  # Create BANKSapi User Credentials System

  BANKSapi requires a user-level token (not client-level) for operations like
  adding bank accesses. Each Supabase user needs a corresponding BANKSapi user.

  1. New Tables
    - `banksapi_user_credentials`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique)
      - `banksapi_username` (text) - the username used to create the BANKSapi user
      - `banksapi_password_encrypted` (text) - the password (encrypted/hashed for BANKSapi)
      - `banksapi_user_id` (text) - the BANKSapi user UUID returned on creation
      - `tenant_name` (text) - the tenant name from the client token response
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `banksapi_user_token_cache`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique)
      - `access_token` (text)
      - `expires_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Service role only access (no direct user policies needed - edge function uses admin client)
*/

CREATE TABLE IF NOT EXISTS banksapi_user_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banksapi_username text NOT NULL,
  banksapi_password_encrypted text NOT NULL,
  banksapi_user_id text,
  tenant_name text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT banksapi_user_credentials_user_id_key UNIQUE (user_id)
);

ALTER TABLE banksapi_user_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on banksapi_user_credentials"
  ON banksapi_user_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS banksapi_user_token_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT banksapi_user_token_cache_user_id_key UNIQUE (user_id)
);

ALTER TABLE banksapi_user_token_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on banksapi_user_token_cache"
  ON banksapi_user_token_cache
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_banksapi_user_credentials_user_id
  ON banksapi_user_credentials(user_id);

CREATE INDEX IF NOT EXISTS idx_banksapi_user_token_cache_user_id
  ON banksapi_user_token_cache(user_id);
