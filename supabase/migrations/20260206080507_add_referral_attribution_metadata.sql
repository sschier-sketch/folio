/*
  # Add referral attribution metadata columns

  1. Modified Tables
    - `affiliate_referrals`
      - `landing_path` (text, nullable) - The URL path where the user first landed with the ref code
      - `attribution_source` (text, nullable) - How the ref code was captured: 'query', 'storage', 'cookie'

  2. Important Notes
    - These columns are additive and nullable, no existing data is affected
    - Used by the create-affiliate-referral edge function for tracking and debugging
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_referrals' AND column_name = 'landing_path'
  ) THEN
    ALTER TABLE affiliate_referrals ADD COLUMN landing_path text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_referrals' AND column_name = 'attribution_source'
  ) THEN
    ALTER TABLE affiliate_referrals ADD COLUMN attribution_source text;
  END IF;
END $$;
