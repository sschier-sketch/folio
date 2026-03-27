/*
  # Allow NULL values in banksapi_import_logs for cron heartbeat entries

  1. Problem
    - When the daily cron runs but finds no active connections, it cannot write a log entry
    - This causes the admin diagnostics to show stale "last cron run" timestamps
    - The user_id, connection_id, and bank_access_id columns are NOT NULL

  2. Fix
    - Make user_id, connection_id, and bank_access_id nullable
    - This allows the cron to write a "heartbeat" log entry even when there are no connections
    - Existing data is not affected since all existing rows have values

  3. Modified Tables
    - `banksapi_import_logs`: user_id, connection_id, bank_access_id now nullable
*/

ALTER TABLE banksapi_import_logs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE banksapi_import_logs ALTER COLUMN connection_id DROP NOT NULL;
ALTER TABLE banksapi_import_logs ALTER COLUMN bank_access_id DROP NOT NULL;
