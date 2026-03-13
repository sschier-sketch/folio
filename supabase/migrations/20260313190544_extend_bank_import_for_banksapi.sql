/*
  # Extend Bank Import System for BANKSapi Transaction Import

  1. Modified Tables
    - `bank_import_files`
      - Extend `source_type` CHECK constraint to include 'banksapi'
      - Add `banksapi_connection_id` (uuid, nullable) FK to banksapi_connections
      - Add `banksapi_product_id` (uuid, nullable) FK to banksapi_bank_products
      - Add `trigger_type` (text, nullable) to track how import was triggered (manual/cron/callback)

  2. New Tables
    - `banksapi_import_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `connection_id` (uuid, FK to banksapi_connections)
      - `bank_access_id` (text)
      - `bank_product_id` (text, nullable) - remote product ID for per-product stages
      - `trigger_type` (text) - manual | cron | callback_initial_sync
      - `started_at` (timestamptz)
      - `finished_at` (timestamptz, nullable)
      - `status` (text) - success | partial | failed | requires_sca
      - `total_remote_transactions_seen` (integer, default 0)
      - `total_new_transactions_imported` (integer, default 0)
      - `total_duplicates_skipped` (integer, default 0)
      - `total_filtered_by_date` (integer, default 0)
      - `error_message` (text, nullable)
      - `created_at` (timestamptz, default now())

  3. Security
    - Enable RLS on `banksapi_import_logs`
    - Add policies for authenticated users to read own logs

  4. Notes
    - Existing CSV/CAMT imports are NOT affected
    - bank_import_files is reused for banksapi file-level tracking
    - banksapi_import_logs provides richer per-run detail
    - Existing data remains intact, only constraints extended
*/

-- 1. Extend bank_import_files.source_type to include 'banksapi'
ALTER TABLE bank_import_files
  DROP CONSTRAINT IF EXISTS bank_import_files_source_type_check;

ALTER TABLE bank_import_files
  ADD CONSTRAINT bank_import_files_source_type_check
  CHECK (source_type IN ('csv', 'camt053', 'mt940', 'banksapi'));

-- 2. Add banksapi-specific columns to bank_import_files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_import_files' AND column_name = 'banksapi_connection_id'
  ) THEN
    ALTER TABLE bank_import_files ADD COLUMN banksapi_connection_id uuid REFERENCES banksapi_connections(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_import_files' AND column_name = 'banksapi_product_id'
  ) THEN
    ALTER TABLE bank_import_files ADD COLUMN banksapi_product_id uuid REFERENCES banksapi_bank_products(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_import_files' AND column_name = 'trigger_type'
  ) THEN
    ALTER TABLE bank_import_files ADD COLUMN trigger_type text;
  END IF;
END $$;

-- 3. Create banksapi_import_logs table
CREATE TABLE IF NOT EXISTS banksapi_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES banksapi_connections(id) ON DELETE CASCADE,
  bank_access_id text NOT NULL,
  bank_product_id text,
  trigger_type text NOT NULL DEFAULT 'manual',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  total_remote_transactions_seen integer NOT NULL DEFAULT 0,
  total_new_transactions_imported integer NOT NULL DEFAULT 0,
  total_duplicates_skipped integer NOT NULL DEFAULT 0,
  total_filtered_by_date integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT banksapi_import_logs_trigger_type_check
    CHECK (trigger_type IN ('manual', 'cron', 'callback_initial_sync')),
  CONSTRAINT banksapi_import_logs_status_check
    CHECK (status IN ('pending', 'running', 'success', 'partial', 'failed', 'requires_sca'))
);

-- 4. Indexes on banksapi_import_logs
CREATE INDEX IF NOT EXISTS idx_banksapi_import_logs_user_id
  ON banksapi_import_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_banksapi_import_logs_connection_id
  ON banksapi_import_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_banksapi_import_logs_started_at
  ON banksapi_import_logs(started_at DESC);

-- 5. Enable RLS on banksapi_import_logs
ALTER TABLE banksapi_import_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for banksapi_import_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'banksapi_import_logs' AND policyname = 'Users can view own import logs'
  ) THEN
    CREATE POLICY "Users can view own import logs"
      ON banksapi_import_logs
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'banksapi_import_logs' AND policyname = 'Users can insert own import logs'
  ) THEN
    CREATE POLICY "Users can insert own import logs"
      ON banksapi_import_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 7. Add index for banksapi columns on bank_import_files
CREATE INDEX IF NOT EXISTS idx_bank_import_files_banksapi_connection
  ON bank_import_files(banksapi_connection_id) WHERE banksapi_connection_id IS NOT NULL;
