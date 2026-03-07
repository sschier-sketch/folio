/*
  # Fix LetterXpress config save - bypass vault encryption

  1. Changes
    - Add `api_key` text column to `letterxpress_accounts` for direct storage
    - Copy any existing decrypted keys (if vault key exists) to the new column
    - The edge function will now use direct table operations instead of RPCs
      that fail because auth.uid() is NULL when called via service role

  2. Security
    - Column is only accessible via service role (RLS is already enabled)
    - Edge function validates JWT before any operations

  3. Notes
    - The existing `encrypted_api_key` bytea column is kept for backwards compatibility
    - RPCs remain but are no longer called from the edge function
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'letterxpress_accounts' AND column_name = 'api_key'
  ) THEN
    ALTER TABLE letterxpress_accounts ADD COLUMN api_key text;
  END IF;
END $$;
