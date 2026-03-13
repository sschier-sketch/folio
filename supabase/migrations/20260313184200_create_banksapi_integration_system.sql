/*
  # BanksAPI PSD2 Integration - Foundation

  Creates the technical foundation for the BanksAPI PSD2 banking integration.

  1. New Tables
    - `banksapi_connections` - stores user bank connections via BanksAPI
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `banksapi_customer_id` (text) - customer ID on BanksAPI side
      - `bank_access_id` (text) - the bankzugang ID returned by BanksAPI
      - `provider_id` (text) - BLZ / provider identifier
      - `bank_name` (text) - human-readable bank name
      - `status` (text) - connected | requires_sca | syncing | error | disconnected
      - `error_message` (text) - last error details
      - `consent_expires_at` (timestamptz) - when PSD2 consent expires
      - `last_sync_at` (timestamptz) - last successful transaction sync

    - `banksapi_bank_products` - individual bank accounts within a connection
      - `id` (uuid, primary key)
      - `connection_id` (uuid, references banksapi_connections)
      - `user_id` (uuid, references auth.users)
      - `bank_product_id` (text) - product ID on BanksAPI side
      - `iban` (text) - account IBAN
      - `account_name` (text) - display name
      - `account_type` (text) - e.g. Girokonto, Sparkonto
      - `balance_cents` (bigint) - last known balance in cents
      - `selected_for_import` (boolean) - whether user selected this for auto-import
      - `import_from_date` (date) - start date for transaction import

    - `banksapi_token_cache` - single-row cache for OAuth2 access token (service-role only)

  2. System Settings Updates
    - `banksapi_enabled` (boolean) - feature toggle
    - `banksapi_client_id` (text) - BanksAPI OAuth2 client ID
    - `banksapi_client_secret_encrypted` (text) - encrypted client secret (never exposed to frontend)

  3. Security
    - RLS enabled on all new tables
    - Users can only access their own connections and bank products
    - Token cache has no user policies (service-role only)
    - get_system_settings RPC updated (does NOT expose the encrypted secret)
*/

-- 1. Create banksapi_connections table
CREATE TABLE IF NOT EXISTS banksapi_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banksapi_customer_id text NOT NULL,
  bank_access_id text,
  provider_id text,
  bank_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'requires_sca'
    CHECK (status IN ('connected', 'requires_sca', 'syncing', 'error', 'disconnected')),
  error_message text,
  consent_expires_at timestamptz,
  last_sync_at timestamptz,
  raw_response jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE banksapi_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own banksapi connections"
  ON banksapi_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own banksapi connections"
  ON banksapi_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own banksapi connections"
  ON banksapi_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own banksapi connections"
  ON banksapi_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_banksapi_connections_user_id
  ON banksapi_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_banksapi_connections_bank_access_id
  ON banksapi_connections(bank_access_id);

-- 2. Create banksapi_bank_products table
CREATE TABLE IF NOT EXISTS banksapi_bank_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES banksapi_connections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_product_id text NOT NULL,
  iban text,
  account_name text NOT NULL DEFAULT '',
  account_type text,
  balance_cents bigint,
  balance_date date,
  selected_for_import boolean NOT NULL DEFAULT false,
  import_from_date date,
  last_import_at timestamptz,
  raw_response jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE banksapi_bank_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own banksapi bank products"
  ON banksapi_bank_products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own banksapi bank products"
  ON banksapi_bank_products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own banksapi bank products"
  ON banksapi_bank_products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own banksapi bank products"
  ON banksapi_bank_products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_banksapi_bank_products_connection_id
  ON banksapi_bank_products(connection_id);

CREATE INDEX IF NOT EXISTS idx_banksapi_bank_products_user_id
  ON banksapi_bank_products(user_id);

-- 3. Create banksapi_token_cache (single-row, service-role only)
CREATE TABLE IF NOT EXISTS banksapi_token_cache (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token text,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE banksapi_token_cache ENABLE ROW LEVEL SECURITY;

-- 4. Add BanksAPI config fields to system_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'banksapi_enabled'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN banksapi_enabled boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'banksapi_client_id'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN banksapi_client_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'banksapi_client_secret_encrypted'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN banksapi_client_secret_encrypted text;
  END IF;
END $$;

-- 5. Drop and recreate get_system_settings to include new fields
DROP FUNCTION IF EXISTS get_system_settings();

CREATE FUNCTION get_system_settings()
RETURNS TABLE (
  id integer,
  gtm_enabled boolean,
  gtm_container_id text,
  gtm_custom_head_html text,
  default_affiliate_commission_rate numeric,
  signup_custom_tracking_script text,
  notify_on_new_registration boolean,
  notify_on_new_feedback boolean,
  notification_email text,
  updated_at timestamptz,
  global_head_html text,
  global_head_html_updated_at timestamptz,
  monthly_feature_count integer,
  banksapi_enabled boolean,
  banksapi_client_id text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
SELECT
  id,
  gtm_enabled,
  gtm_container_id,
  gtm_custom_head_html,
  default_affiliate_commission_rate,
  signup_custom_tracking_script,
  notify_on_new_registration,
  notify_on_new_feedback,
  notification_email,
  updated_at,
  global_head_html,
  global_head_html_updated_at,
  monthly_feature_count,
  banksapi_enabled,
  banksapi_client_id
FROM system_settings
WHERE id = 1
LIMIT 1;
$$;

-- 6. Updated_at trigger for banksapi tables
CREATE OR REPLACE FUNCTION update_banksapi_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_banksapi_connections_updated_at'
  ) THEN
    CREATE TRIGGER trg_banksapi_connections_updated_at
      BEFORE UPDATE ON banksapi_connections
      FOR EACH ROW EXECUTE FUNCTION update_banksapi_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_banksapi_bank_products_updated_at'
  ) THEN
    CREATE TRIGGER trg_banksapi_bank_products_updated_at
      BEFORE UPDATE ON banksapi_bank_products
      FOR EACH ROW EXECUTE FUNCTION update_banksapi_updated_at();
  END IF;
END $$;
