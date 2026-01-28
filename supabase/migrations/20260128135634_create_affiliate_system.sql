/*
  # Create Affiliate System with Revenue Share

  ## Description
  This migration creates a comprehensive affiliate system to replace the old referral program.
  The new system offers 25% revenue share on monthly subscription payments instead of free months.

  ## New Tables

  ### `affiliates`
  Stores affiliate profile information and status.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users) - The affiliate's user account
  - `affiliate_code` (text, unique, indexed) - Unique affiliate code (e.g., PARTNER123)
  - `status` (text) - active, suspended, blocked
  - `commission_rate` (decimal) - Commission rate (default 0.25 = 25%)
  - `total_referrals` (integer) - Total number of referrals
  - `paying_referrals` (integer) - Number of paying referrals
  - `total_earned` (decimal) - Total earned commissions
  - `total_paid` (decimal) - Total paid out to affiliate
  - `total_pending` (decimal) - Total pending/available for payout
  - `is_blocked` (boolean) - Whether affiliate is blocked
  - `blocked_reason` (text) - Reason for blocking (if blocked)
  - `blocked_at` (timestamptz) - When affiliate was blocked
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `affiliate_referrals`
  Tracks users who signed up via affiliate links.
  - `id` (uuid, primary key)
  - `affiliate_id` (uuid, references affiliates) - The affiliate who referred this user
  - `referred_user_id` (uuid, references auth.users) - The referred user
  - `customer_id` (text) - Stripe customer ID (when user subscribes)
  - `status` (text) - registered, paying, churned
  - `first_payment_at` (timestamptz) - When first payment occurred
  - `last_payment_at` (timestamptz) - When last payment occurred
  - `lifetime_value` (decimal) - Total revenue from this referral
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `affiliate_commissions`
  Records each commission earned from payments.
  - `id` (uuid, primary key)
  - `affiliate_id` (uuid, references affiliates)
  - `referral_id` (uuid, references affiliate_referrals)
  - `subscription_id` (text) - Stripe subscription ID
  - `invoice_id` (text, indexed) - Stripe invoice ID
  - `stripe_event_id` (text, unique) - For idempotency
  - `amount_total` (decimal) - Total invoice amount
  - `amount_net` (decimal) - Net amount (after tax/fees)
  - `commission_rate` (decimal) - Commission rate applied
  - `commission_amount` (decimal) - Commission earned
  - `status` (text) - pending, available, paid, reversed
  - `hold_until` (timestamptz) - When commission becomes available (hold period)
  - `available_at` (timestamptz) - When commission became available
  - `paid_at` (timestamptz) - When commission was paid
  - `payout_request_id` (uuid, references payout_requests)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `affiliate_payout_requests`
  Payout requests from affiliates.
  - `id` (uuid, primary key)
  - `affiliate_id` (uuid, references affiliates)
  - `amount` (decimal) - Requested payout amount
  - `status` (text) - pending, processing, paid, rejected
  - `payout_method_id` (uuid, references payout_methods)
  - `notes` (text) - Admin notes
  - `transaction_id` (text) - Bank transaction ID
  - `processed_by` (uuid, references auth.users) - Admin who processed
  - `processed_at` (timestamptz)
  - `rejected_reason` (text)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `affiliate_payout_methods`
  Payment methods for affiliates (SEPA IBAN).
  - `id` (uuid, primary key)
  - `affiliate_id` (uuid, references affiliates)
  - `method_type` (text) - sepa, paypal (future)
  - `account_holder_name` (text)
  - `iban` (text) - Encrypted IBAN
  - `bic` (text)
  - `bank_name` (text)
  - `is_default` (boolean)
  - `is_verified` (boolean)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

  ### `affiliate_commission_adjustments`
  Manual commission adjustments by admins.
  - `id` (uuid, primary key)
  - `affiliate_id` (uuid, references affiliates)
  - `amount` (decimal) - Positive or negative adjustment
  - `reason` (text)
  - `created_by` (uuid, references auth.users)
  - `created_at` (timestamptz, default now())

  ## Security
  - Enable RLS on all tables
  - Affiliates can only view/update their own data
  - Only admins can create adjustments and process payouts
  - Prevent self-referrals

  ## Indexes
  - Create indexes on frequently queried fields for performance
*/

-- Create affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked')),
  commission_rate decimal(4,3) NOT NULL DEFAULT 0.250 CHECK (commission_rate >= 0 AND commission_rate <= 1),
  total_referrals integer NOT NULL DEFAULT 0,
  paying_referrals integer NOT NULL DEFAULT 0,
  total_earned decimal(10,2) NOT NULL DEFAULT 0,
  total_paid decimal(10,2) NOT NULL DEFAULT 0,
  total_pending decimal(10,2) NOT NULL DEFAULT 0,
  is_blocked boolean NOT NULL DEFAULT false,
  blocked_reason text,
  blocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create affiliate_referrals table
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id text,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'paying', 'churned')),
  first_payment_at timestamptz,
  last_payment_at timestamptz,
  lifetime_value decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

-- Create affiliate_commissions table
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id uuid NOT NULL REFERENCES affiliate_referrals(id) ON DELETE CASCADE,
  subscription_id text,
  invoice_id text NOT NULL,
  stripe_event_id text UNIQUE NOT NULL,
  amount_total decimal(10,2) NOT NULL,
  amount_net decimal(10,2) NOT NULL,
  commission_rate decimal(4,3) NOT NULL,
  commission_amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'reversed')),
  hold_until timestamptz NOT NULL,
  available_at timestamptz,
  paid_at timestamptz,
  payout_request_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create affiliate_payout_requests table
CREATE TABLE IF NOT EXISTS affiliate_payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'rejected')),
  payout_method_id uuid,
  notes text,
  transaction_id text,
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz,
  rejected_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create affiliate_payout_methods table
CREATE TABLE IF NOT EXISTS affiliate_payout_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  method_type text NOT NULL DEFAULT 'sepa' CHECK (method_type IN ('sepa', 'paypal')),
  account_holder_name text NOT NULL,
  iban text NOT NULL,
  bic text,
  bank_name text,
  is_default boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create affiliate_commission_adjustments table
CREATE TABLE IF NOT EXISTS affiliate_commission_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  reason text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add foreign key for payout_request_id after table creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'affiliate_commissions_payout_request_id_fkey'
  ) THEN
    ALTER TABLE affiliate_commissions
    ADD CONSTRAINT affiliate_commissions_payout_request_id_fkey
    FOREIGN KEY (payout_request_id) REFERENCES affiliate_payout_requests(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'affiliate_payout_requests_payout_method_id_fkey'
  ) THEN
    ALTER TABLE affiliate_payout_requests
    ADD CONSTRAINT affiliate_payout_requests_payout_method_id_fkey
    FOREIGN KEY (payout_method_id) REFERENCES affiliate_payout_methods(id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user_id ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_customer_id ON affiliate_referrals(customer_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referral_id ON affiliate_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_invoice_id ON affiliate_commissions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_hold_until ON affiliate_commissions(hold_until);

CREATE INDEX IF NOT EXISTS idx_affiliate_payout_requests_affiliate_id ON affiliate_payout_requests(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payout_requests_status ON affiliate_payout_requests(status);

CREATE INDEX IF NOT EXISTS idx_affiliate_payout_methods_affiliate_id ON affiliate_payout_methods(affiliate_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_commission_adjustments_affiliate_id ON affiliate_commission_adjustments(affiliate_id);

-- Enable RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commission_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliates
CREATE POLICY "Affiliates can view own profile"
  ON affiliates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own profile"
  ON affiliates FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all affiliates"
  ON affiliates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all affiliates"
  ON affiliates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for affiliate_referrals
CREATE POLICY "Affiliates can view own referrals"
  ON affiliate_referrals FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all referrals"
  ON affiliate_referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for affiliate_commissions
CREATE POLICY "Affiliates can view own commissions"
  ON affiliate_commissions FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all commissions"
  ON affiliate_commissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update commissions"
  ON affiliate_commissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for affiliate_payout_requests
CREATE POLICY "Affiliates can view own payout requests"
  ON affiliate_payout_requests FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can create own payout requests"
  ON affiliate_payout_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payout requests"
  ON affiliate_payout_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update payout requests"
  ON affiliate_payout_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for affiliate_payout_methods
CREATE POLICY "Affiliates can view own payout methods"
  ON affiliate_payout_methods FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can create own payout methods"
  ON affiliate_payout_methods FOR INSERT
  TO authenticated
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can update own payout methods"
  ON affiliate_payout_methods FOR UPDATE
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can delete own payout methods"
  ON affiliate_payout_methods FOR DELETE
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payout methods"
  ON affiliate_payout_methods FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for affiliate_commission_adjustments
CREATE POLICY "Affiliates can view own adjustments"
  ON affiliate_commission_adjustments FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create adjustments"
  ON affiliate_commission_adjustments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all adjustments"
  ON affiliate_commission_adjustments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

-- Function to auto-create affiliate profile when user signs up
CREATE OR REPLACE FUNCTION create_affiliate_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  -- Generate unique affiliate code
  LOOP
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  -- Create affiliate profile
  INSERT INTO affiliates (user_id, affiliate_code)
  VALUES (NEW.id, new_code);

  RETURN NEW;
END;
$$;

-- Trigger to create affiliate profile on user creation
DROP TRIGGER IF EXISTS on_user_created_create_affiliate ON auth.users;
CREATE TRIGGER on_user_created_create_affiliate
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_affiliate_profile();

-- Function to update affiliate stats
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update affiliate stats based on referrals and commissions
  UPDATE affiliates
  SET
    total_referrals = (
      SELECT COUNT(*) FROM affiliate_referrals WHERE affiliate_id = NEW.affiliate_id
    ),
    paying_referrals = (
      SELECT COUNT(*) FROM affiliate_referrals 
      WHERE affiliate_id = NEW.affiliate_id AND status = 'paying'
    ),
    total_earned = (
      SELECT COALESCE(SUM(commission_amount), 0) FROM affiliate_commissions 
      WHERE affiliate_id = NEW.affiliate_id AND status != 'reversed'
    ),
    total_pending = (
      SELECT COALESCE(SUM(commission_amount), 0) FROM affiliate_commissions 
      WHERE affiliate_id = NEW.affiliate_id AND status = 'available'
    ),
    updated_at = now()
  WHERE id = NEW.affiliate_id;

  RETURN NEW;
END;
$$;

-- Triggers to update affiliate stats
DROP TRIGGER IF EXISTS on_referral_change_update_stats ON affiliate_referrals;
CREATE TRIGGER on_referral_change_update_stats
  AFTER INSERT OR UPDATE ON affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_stats();

DROP TRIGGER IF EXISTS on_commission_change_update_stats ON affiliate_commissions;
CREATE TRIGGER on_commission_change_update_stats
  AFTER INSERT OR UPDATE ON affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_stats();

-- Function to make commissions available after hold period
CREATE OR REPLACE FUNCTION release_held_commissions()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE affiliate_commissions
  SET 
    status = 'available',
    available_at = now(),
    updated_at = now()
  WHERE status = 'pending'
    AND hold_until <= now();
END;
$$;