/*
  # Referral Payout Requests

  1. New Tables
    - `referral_payout_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric, the requested payout amount in EUR)
      - `status` (text: pending, approved, paid, rejected)
      - `iban` (text, IBAN for payout)
      - `account_holder` (text, name on bank account)
      - `notes` (text, optional admin notes)
      - `processed_by` (uuid, admin who processed)
      - `processed_at` (timestamptz)
      - `rejected_reason` (text, reason if rejected)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. New Column on user_referrals
    - `cash_reward_eur` (numeric, default 10) - monetary value per completed referral

  3. Security
    - RLS enabled on referral_payout_requests
    - Users can read their own payout requests
    - Users can insert payout requests for themselves
    - Admins can read and update all payout requests

  4. Notes
    - Each completed referral earns 10 EUR cash reward
    - Payout minimum threshold is 25 EUR (enforced in application)
    - Balance = sum of cash_reward_eur for completed referrals - sum of paid/approved payouts
*/

-- 1. Add cash_reward_eur to user_referrals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_referrals'
      AND column_name = 'cash_reward_eur'
  ) THEN
    ALTER TABLE public.user_referrals ADD COLUMN cash_reward_eur numeric DEFAULT 10;
  END IF;
END $$;

-- Backfill: set cash_reward_eur for existing completed referrals
UPDATE public.user_referrals
SET cash_reward_eur = 10
WHERE cash_reward_eur IS NULL;

-- 2. Create referral_payout_requests table
CREATE TABLE IF NOT EXISTS public.referral_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 25),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  iban text,
  account_holder text,
  notes text,
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz,
  rejected_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_referral_payout_requests_user_id
  ON public.referral_payout_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_referral_payout_requests_status
  ON public.referral_payout_requests(status);

-- 4. Enable RLS
ALTER TABLE public.referral_payout_requests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view own payout requests"
  ON public.referral_payout_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own payout requests"
  ON public.referral_payout_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all payout requests"
  ON public.referral_payout_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update payout requests"
  ON public.referral_payout_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );
