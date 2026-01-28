/*
  # Add Trial System Fields
  
  1. Changes to Tables
    - `billing_info`
      - Add `trial_started_at` (timestamptz, nullable) - When the trial started
      - Add `pro_activated_at` (timestamptz, nullable) - When Pro plan was activated
  
  2. Notes
    - `trial_ends_at` already exists in billing_info
    - Trial is 30 days from `trial_started_at`
    - Effective Pro access = (subscription_plan = 'pro') OR (trial_ends_at IS NOT NULL AND now() < trial_ends_at)
    - Existing users will have NULL trial fields (no retroactive trials)
*/

-- Add trial_started_at field to billing_info
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'billing_info' 
    AND column_name = 'trial_started_at'
  ) THEN
    ALTER TABLE billing_info ADD COLUMN trial_started_at timestamptz;
  END IF;
END $$;

-- Add pro_activated_at field to billing_info
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'billing_info' 
    AND column_name = 'pro_activated_at'
  ) THEN
    ALTER TABLE billing_info ADD COLUMN pro_activated_at timestamptz;
  END IF;
END $$;

-- Create a function to check if user has pro access (plan OR active trial)
CREATE OR REPLACE FUNCTION has_pro_access(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_trial_ends_at timestamptz;
BEGIN
  -- Get user's plan and trial info
  SELECT subscription_plan, trial_ends_at
  INTO v_plan, v_trial_ends_at
  FROM billing_info
  WHERE user_id = p_user_id;
  
  -- If no billing info exists, user has no pro access
  IF v_plan IS NULL THEN
    RETURN false;
  END IF;
  
  -- Pro access if:
  -- 1. User has pro plan, OR
  -- 2. User has active trial (trial_ends_at is set and in the future)
  RETURN (
    v_plan = 'pro' 
    OR 
    (v_trial_ends_at IS NOT NULL AND v_trial_ends_at > now())
  );
END;
$$;

-- Create index for trial queries
CREATE INDEX IF NOT EXISTS idx_billing_info_trial_ends_at ON billing_info(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
