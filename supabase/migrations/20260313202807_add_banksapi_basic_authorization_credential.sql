/*
  # Add BANKSapi Basic Authorization credential field

  1. Changes
    - Add `banksapi_basic_authorization` column to `system_settings`
      - Stores the ready-made Basic Authorization credential provided by BANKSapi
      - Format: the base64-encoded value (without "Basic " prefix)
      - The "Basic " prefix is prepended at request time in edge functions
    - Keep existing `banksapi_client_id` and `banksapi_client_secret_encrypted`
      columns for backward compatibility (not dropped)

  2. Backward compatibility
    - If `banksapi_basic_authorization` is set, it takes priority
    - Otherwise falls back to building Basic auth from client_id:client_secret
    - No existing data is modified or deleted

  3. Security
    - Column is NOT exposed via `get_system_settings()` RPC (write-only)
    - Only accessible via service-role key in edge functions
    - Admin UI checks existence but never reads the actual value
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'banksapi_basic_authorization'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN banksapi_basic_authorization text;
  END IF;
END $$;
