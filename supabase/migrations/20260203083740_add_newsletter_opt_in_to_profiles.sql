/*
  # Add Newsletter Opt-in to Account Profiles
  
  1. Changes
    - Add `newsletter_opt_in` boolean field to account_profiles table
    - Default to false (user must opt-in)
  
  2. Purpose
    - Track user consent for marketing communications
    - GDPR compliant opt-in mechanism
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_profiles' 
    AND column_name = 'newsletter_opt_in'
  ) THEN
    ALTER TABLE account_profiles 
    ADD COLUMN newsletter_opt_in boolean DEFAULT false NOT NULL;
  END IF;
END $$;