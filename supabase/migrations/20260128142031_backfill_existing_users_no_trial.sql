/*
  # Backfill Existing Users - No Trial
  
  1. Purpose
    - Ensure all existing users have NULL trial fields
    - Prevents retroactive trial activation for existing accounts
    - Only NEW signups after this migration get automatic 30-day trial
  
  2. Changes
    - Set trial_started_at = NULL for all existing billing_info records
    - Set trial_ends_at = NULL for all existing billing_info records where it's not already set by Stripe
    - Set pro_activated_at = now() for users who already have subscription_plan = 'pro'
  
  3. Migration Rules
    - Existing users: NO trial (trial_started_at and trial_ends_at remain NULL)
    - Existing pro users: pro_activated_at = now() (for audit purposes)
    - New users from now on: Will get trial via signup flow
*/

-- Ensure existing users have NULL trial fields
UPDATE billing_info
SET 
  trial_started_at = NULL,
  trial_ends_at = NULL
WHERE trial_started_at IS NULL; -- Only update if not already set

-- Set pro_activated_at for existing Pro users (for audit purposes)
UPDATE billing_info
SET pro_activated_at = now()
WHERE subscription_plan = 'pro' 
  AND pro_activated_at IS NULL;

-- Add comment to document migration
COMMENT ON COLUMN billing_info.trial_started_at IS 'Timestamp when 30-day trial started. NULL for users created before trial system or after trial expired.';
COMMENT ON COLUMN billing_info.trial_ends_at IS 'Timestamp when trial ends (trial_started_at + 30 days). NULL if no active trial.';
COMMENT ON COLUMN billing_info.pro_activated_at IS 'Timestamp when Pro plan was first activated via Stripe payment.';
