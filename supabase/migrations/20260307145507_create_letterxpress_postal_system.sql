/*
  # Create LetterXpress Postal Mail System

  This migration creates the foundational data model for integrating LetterXpress
  postal mail services into rentably. It establishes secure credential storage and
  a local job mirror for tracking postal dispatch.

  1. New Tables
    - `letterxpress_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - the account owner
      - `username` (text) - LetterXpress API username
      - `encrypted_api_key` (bytea) - PGP-encrypted API key
      - `is_enabled` (boolean) - whether the integration is active
      - `is_test_mode` (boolean) - test vs. live mode (server-controlled)
      - `last_connection_test_at` (timestamptz) - last connection test timestamp
      - `last_connection_test_status` (text) - 'success' or 'error'
      - `last_connection_test_message` (text) - message from last test
      - `last_balance` (numeric) - cached account balance
      - `last_balance_currency` (text) - currency of balance (EUR)
      - `last_balance_synced_at` (timestamptz) - when balance was last fetched
      - `created_at` / `updated_at` (timestamptz)

    - `letterxpress_jobs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - the account owner
      - `external_job_id` (integer) - LetterXpress job ID
      - `status` (text) - local mirror of job status
      - `filename_original` (text) - original filename
      - `recipient_address_text` (text) - extracted recipient address
      - `pages` (integer) - number of pages
      - `amount` (numeric) - cost amount
      - `vat` (numeric) - VAT amount
      - `currency` (text) - currency code
      - `shipping` (text) - national/international/auto
      - `mode` (text) - simplex/duplex
      - `color` (text) - 1 (b/w) or 4 (color)
      - `c4` (integer) - C4 envelope flag
      - `registered` (text) - registered mail type
      - `notice` (text) - internal note (max 255 chars)
      - `dispatch_date` (date) - scheduled dispatch date
      - `created_at_provider` (timestamptz) - creation timestamp from LX
      - `updated_at_provider` (timestamptz) - update timestamp from LX
      - `item_status` (text) - status of first item
      - `tracking_code` (text) - tracking code if available
      - `raw_payload_json` (jsonb) - full API response for debugging
      - `last_error_code` (text) - last error code
      - `last_error_message` (text) - last error message
      - `last_synced_at` (timestamptz) - last sync from API
      - `is_cancelable` (boolean) - whether job can still be canceled
      - `canceled_at` (timestamptz) - when job was canceled
      - `created_at` / `updated_at` (timestamptz)

  2. Security
    - RLS enabled on both tables
    - Policies restrict access to account owner and their team members
    - API key stored encrypted via pgp_sym_encrypt with a server-side key
    - Decryption only happens in edge functions (server-side)

  3. Helper Functions
    - `encrypt_letterxpress_api_key(text)` - encrypts an API key
    - `decrypt_letterxpress_api_key(bytea)` - decrypts an API key (SECURITY DEFINER)
    - Both use a dedicated encryption key stored in Supabase Vault

  4. Indexes
    - Unique constraint on letterxpress_accounts(user_id) - one config per owner
    - Unique constraint on letterxpress_jobs(user_id, external_job_id) - idempotent sync
    - Index on letterxpress_jobs(user_id, status) - efficient filtering
    - Index on letterxpress_jobs(user_id, created_at) - efficient sorting
*/

-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ============================================================
-- Encryption helpers for LetterXpress API keys
-- Uses a dedicated secret stored in Supabase Vault.
-- The secret is named 'letterxpress_encryption_key'.
-- ============================================================

CREATE OR REPLACE FUNCTION encrypt_letterxpress_api_key(plain_key text)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  enc_key text;
BEGIN
  SELECT decrypted_secret INTO enc_key
  FROM vault.decrypted_secrets
  WHERE name = 'letterxpress_encryption_key'
  LIMIT 1;

  IF enc_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not configured in vault (letterxpress_encryption_key)';
  END IF;

  RETURN extensions.pgp_sym_encrypt(plain_key, enc_key);
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_letterxpress_api_key(encrypted_key bytea)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  enc_key text;
BEGIN
  IF encrypted_key IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret INTO enc_key
  FROM vault.decrypted_secrets
  WHERE name = 'letterxpress_encryption_key'
  LIMIT 1;

  IF enc_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not configured in vault (letterxpress_encryption_key)';
  END IF;

  RETURN extensions.pgp_sym_decrypt(encrypted_key, enc_key);
END;
$$;


-- ============================================================
-- Table: letterxpress_accounts
-- One configuration per account owner.
-- ============================================================

CREATE TABLE IF NOT EXISTS letterxpress_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL DEFAULT '',
  encrypted_api_key bytea,
  is_enabled boolean NOT NULL DEFAULT false,
  is_test_mode boolean NOT NULL DEFAULT true,
  last_connection_test_at timestamptz,
  last_connection_test_status text,
  last_connection_test_message text,
  last_balance numeric(12,2),
  last_balance_currency text DEFAULT 'EUR',
  last_balance_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT letterxpress_accounts_user_unique UNIQUE (user_id)
);

ALTER TABLE letterxpress_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own letterxpress config"
  ON letterxpress_accounts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id = get_account_owner_id(auth.uid()));

CREATE POLICY "Owner can insert own letterxpress config"
  ON letterxpress_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update own letterxpress config"
  ON letterxpress_accounts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can delete own letterxpress config"
  ON letterxpress_accounts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


-- ============================================================
-- Table: letterxpress_jobs
-- Local mirror of LetterXpress print jobs.
-- ============================================================

CREATE TABLE IF NOT EXISTS letterxpress_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_job_id integer NOT NULL,
  status text NOT NULL DEFAULT 'unknown',
  filename_original text,
  recipient_address_text text,
  pages integer,
  amount numeric(10,2),
  vat numeric(10,2),
  currency text DEFAULT 'EUR',
  shipping text,
  mode text,
  color text,
  c4 integer DEFAULT 0,
  registered text,
  notice text,
  dispatch_date date,
  created_at_provider timestamptz,
  updated_at_provider timestamptz,
  item_status text,
  tracking_code text,
  raw_payload_json jsonb,
  last_error_code text,
  last_error_message text,
  last_synced_at timestamptz DEFAULT now(),
  is_cancelable boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT letterxpress_jobs_owner_extid_unique UNIQUE (user_id, external_job_id)
);

ALTER TABLE letterxpress_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own letterxpress jobs"
  ON letterxpress_jobs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id = get_account_owner_id(auth.uid()));

CREATE POLICY "Owner can insert own letterxpress jobs"
  ON letterxpress_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update own letterxpress jobs"
  ON letterxpress_jobs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can delete own letterxpress jobs"
  ON letterxpress_jobs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_letterxpress_jobs_user_status
  ON letterxpress_jobs (user_id, status);

CREATE INDEX IF NOT EXISTS idx_letterxpress_jobs_user_created
  ON letterxpress_jobs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_letterxpress_jobs_external_id
  ON letterxpress_jobs (external_job_id);


-- ============================================================
-- RPC: Get LetterXpress config (without decrypted key)
-- Returns config for UI display without exposing the API key.
-- ============================================================

CREATE OR REPLACE FUNCTION get_letterxpress_config(p_owner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config record;
  v_caller_id uuid;
BEGIN
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_owner_id != v_caller_id AND NOT is_account_member_of(p_owner_id, v_caller_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT
    id,
    user_id,
    username,
    CASE WHEN encrypted_api_key IS NOT NULL THEN true ELSE false END AS has_api_key,
    is_enabled,
    is_test_mode,
    last_connection_test_at,
    last_connection_test_status,
    last_connection_test_message,
    last_balance,
    last_balance_currency,
    last_balance_synced_at,
    created_at,
    updated_at
  INTO v_config
  FROM letterxpress_accounts
  WHERE user_id = p_owner_id;

  IF v_config IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'id', v_config.id,
    'user_id', v_config.user_id,
    'username', v_config.username,
    'has_api_key', v_config.has_api_key,
    'is_enabled', v_config.is_enabled,
    'is_test_mode', v_config.is_test_mode,
    'last_connection_test_at', v_config.last_connection_test_at,
    'last_connection_test_status', v_config.last_connection_test_status,
    'last_connection_test_message', v_config.last_connection_test_message,
    'last_balance', v_config.last_balance,
    'last_balance_currency', v_config.last_balance_currency,
    'last_balance_synced_at', v_config.last_balance_synced_at,
    'created_at', v_config.created_at,
    'updated_at', v_config.updated_at
  );
END;
$$;


-- ============================================================
-- RPC: Save LetterXpress config (encrypts API key)
-- Only the account owner may call this.
-- ============================================================

CREATE OR REPLACE FUNCTION save_letterxpress_config(
  p_owner_id uuid,
  p_username text,
  p_api_key text DEFAULT NULL,
  p_is_enabled boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_id uuid;
  v_encrypted bytea;
  v_result record;
BEGIN
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_owner_id != v_caller_id THEN
    RAISE EXCEPTION 'Only the account owner can modify LetterXpress configuration';
  END IF;

  IF p_api_key IS NOT NULL AND p_api_key != '' THEN
    v_encrypted := encrypt_letterxpress_api_key(p_api_key);
  END IF;

  INSERT INTO letterxpress_accounts (user_id, username, encrypted_api_key, is_enabled, updated_at)
  VALUES (
    p_owner_id,
    COALESCE(p_username, ''),
    v_encrypted,
    COALESCE(p_is_enabled, false),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    username = COALESCE(p_username, letterxpress_accounts.username),
    encrypted_api_key = CASE
      WHEN p_api_key IS NOT NULL AND p_api_key != '' THEN v_encrypted
      ELSE letterxpress_accounts.encrypted_api_key
    END,
    is_enabled = COALESCE(p_is_enabled, letterxpress_accounts.is_enabled),
    updated_at = now()
  RETURNING * INTO v_result;

  RETURN jsonb_build_object(
    'id', v_result.id,
    'user_id', v_result.user_id,
    'username', v_result.username,
    'has_api_key', v_result.encrypted_api_key IS NOT NULL,
    'is_enabled', v_result.is_enabled,
    'is_test_mode', v_result.is_test_mode
  );
END;
$$;
