/*
  # Prevent self-referrals in user_referrals

  1. Changes
    - Add CHECK constraint on `user_referrals` to ensure `referrer_id` != `referred_user_id`
    - This prevents users from redeeming their own referral code at the database level

  2. Security
    - Database-level enforcement ensures self-referrals cannot happen regardless of frontend logic
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'user_referrals_no_self_referral'
  ) THEN
    ALTER TABLE user_referrals
      ADD CONSTRAINT user_referrals_no_self_referral
      CHECK (referrer_id IS DISTINCT FROM referred_user_id);
  END IF;
END $$;
