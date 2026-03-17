/*
  # Fix LetterXpress default mode to live

  1. Changes
    - Change `is_test_mode` default from `true` to `false` on `letterxpress_accounts`
    - Update all existing accounts that are still in test mode to live mode
    - This ensures all users operate in live mode by default
    - Admin test mode toggle remains available for admin testing purposes only

  2. Rationale
    - Users cannot send real letters when test mode is enabled
    - Test mode should only be used by admins for API verification
    - Live mode is the correct default for production use
*/

ALTER TABLE letterxpress_accounts
  ALTER COLUMN is_test_mode SET DEFAULT false;

UPDATE letterxpress_accounts
  SET is_test_mode = false
  WHERE is_test_mode = true;
