/*
  # Activate 30-Day Trial for Existing Free Users
  
  1. Purpose
    - Give existing free-tier users a 30-day trial of Pro features
    - Previous migration intentionally excluded existing users
    - This migration activates trial for all free users who never had one
  
  2. Changes
    - Set trial_started_at = now() for all free users with NULL trial_started_at
    - Set trial_ends_at = now() + 30 days
    - Only affects users with subscription_plan = 'free'
    - Users who already had/have a trial are not affected
  
  3. Business Logic
    - Existing free users get 30 days to try Pro features
    - Trial starts from migration timestamp (not retroactive)
    - Trial banner will now show for these users
    - Pro features will be accessible during trial period
*/

-- Activate trial for existing free users who never had one
UPDATE billing_info
SET 
  trial_started_at = now(),
  trial_ends_at = now() + interval '30 days',
  updated_at = now()
WHERE subscription_plan = 'free' 
  AND trial_started_at IS NULL 
  AND trial_ends_at IS NULL;

-- Log how many users were affected
DO $$ 
DECLARE
  v_affected_count integer;
BEGIN
  GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  RAISE NOTICE 'Activated 30-day trial for % existing free users', v_affected_count;
END $$;
