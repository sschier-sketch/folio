/*
  # Backfill Affiliate Profiles for Existing Users

  ## Description
  This migration creates affiliate profiles for all existing users who don't have one yet.
  The affiliate system is designed so that every user can participate in the referral program
  without barriers, maximizing the number of referrals.

  ## Changes
  - Create affiliate profiles for all users without one
  - Generate unique affiliate codes for each user
  - Set default values (status: active, commission_rate: 25%)

  ## Important Notes
  - The trigger `on_user_created_create_affiliate` ensures new users automatically get a profile
  - This migration is a one-time backfill for existing users
*/

-- Backfill affiliate profiles for existing users
DO $$
DECLARE
  user_record RECORD;
  new_code text;
  code_exists boolean;
BEGIN
  -- Loop through all users who don't have an affiliate profile
  FOR user_record IN 
    SELECT u.id 
    FROM auth.users u
    LEFT JOIN affiliates a ON a.user_id = u.id
    WHERE a.id IS NULL
  LOOP
    -- Generate unique affiliate code
    LOOP
      new_code := upper(substring(md5(random()::text) from 1 for 8));
      SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;

    -- Create affiliate profile for this user
    INSERT INTO affiliates (
      user_id, 
      affiliate_code, 
      status,
      commission_rate,
      total_referrals,
      paying_referrals,
      total_earned,
      total_paid,
      total_pending,
      is_blocked
    )
    VALUES (
      user_record.id,
      new_code,
      'active',
      0.250,
      0,
      0,
      0,
      0,
      0,
      false
    );
  END LOOP;
END $$;
