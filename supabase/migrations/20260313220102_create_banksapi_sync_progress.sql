/*
  # Create BanksAPI sync progress tracking table

  1. New Tables
    - `banksapi_sync_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `connection_id` (uuid, references banksapi_connections)
      - `phase` (text) - current phase: 'refreshing', 'syncing_products', 'importing', 'done', 'error'
      - `total_transactions` (int) - total transactions to process
      - `processed_transactions` (int) - transactions processed so far
      - `imported_transactions` (int) - new transactions imported
      - `duplicate_transactions` (int) - duplicates skipped
      - `current_account_name` (text) - name of account currently being processed
      - `current_account_index` (int) - index of current account (1-based)
      - `total_accounts` (int) - total accounts to process
      - `started_at` (timestamptz) - when sync started
      - `updated_at` (timestamptz) - last progress update
      - `finished_at` (timestamptz) - when sync finished
      - `error_message` (text) - error if failed
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `banksapi_sync_progress` table
    - Users can only read their own progress
    - Service role handles writes via edge function

  3. Important Notes
    - One row per connection, upserted on each sync
    - Frontend polls this table for live progress
    - Rows are cleaned up after 24 hours
*/

CREATE TABLE IF NOT EXISTS banksapi_sync_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL,
  phase text NOT NULL DEFAULT 'refreshing',
  total_transactions int NOT NULL DEFAULT 0,
  processed_transactions int NOT NULL DEFAULT 0,
  imported_transactions int NOT NULL DEFAULT 0,
  duplicate_transactions int NOT NULL DEFAULT 0,
  current_account_name text,
  current_account_index int NOT NULL DEFAULT 0,
  total_accounts int NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT banksapi_sync_progress_phase_check CHECK (phase IN ('refreshing','syncing_products','importing','done','error'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_banksapi_sync_progress_connection
  ON banksapi_sync_progress (connection_id);

CREATE INDEX IF NOT EXISTS idx_banksapi_sync_progress_user
  ON banksapi_sync_progress (user_id);

ALTER TABLE banksapi_sync_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sync progress"
  ON banksapi_sync_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
