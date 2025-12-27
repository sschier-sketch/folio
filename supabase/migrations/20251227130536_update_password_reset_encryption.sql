/*
  # Update Password Reset to use encryption instead of hashing

  1. Changes
    - Rename `new_password_hash` to `new_password_encrypted`
    - This will store AES-encrypted password that can be decrypted
  
  2. Notes
    - We use encryption (reversible) instead of hashing (one-way)
    - The password will be encrypted with a secret key
    - After confirmation, it will be decrypted and set in Supabase Auth
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'password_reset_requests' 
    AND column_name = 'new_password_hash'
  ) THEN
    ALTER TABLE password_reset_requests 
    RENAME COLUMN new_password_hash TO new_password_encrypted;
  END IF;
END $$;