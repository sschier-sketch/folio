/*
  # Cleanup Old Password Reset System
  
  1. Changes
    - Drop old password_reset_requests table (replaced by Supabase native auth)
    - Remove cleanup function that's no longer needed
  
  2. Notes
    - Old system used custom edge functions with encrypted password storage
    - New system uses Supabase Auth's built-in password reset flow
    - This migration removes deprecated infrastructure
*/

-- Drop the cleanup function if it exists
DROP FUNCTION IF EXISTS cleanup_old_password_reset_requests();

-- Drop the old password_reset_requests table if it exists
DROP TABLE IF EXISTS password_reset_requests;

-- Add comment to document the change
COMMENT ON SCHEMA public IS 'Password reset now uses Supabase Auth native flow (supabase.auth.resetPasswordForEmail). Old custom password_reset_requests table removed.';
