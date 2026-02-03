/*
  # Simplify Password Reset Table
  
  1. Changes
    - Remove `new_password_encrypted` column (password will be sent in confirm step)
    - Keep only token-based verification
  
  2. Purpose
    - Classic password reset flow: request email → receive link → set new password
    - More secure: password never stored, even encrypted
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'password_reset_requests' 
    AND column_name = 'new_password_encrypted'
  ) THEN
    ALTER TABLE password_reset_requests 
    DROP COLUMN new_password_encrypted;
  END IF;
END $$;