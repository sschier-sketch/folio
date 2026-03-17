/*
  # Bank Matching Rules System

  1. New Tables
    - `bank_matching_rules`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users) - owner of the rule
      - `name` (text) - display name, auto-generated from counterparty
      - `counterparty_name` (text) - the counterparty name to match
      - `amount_cents` (bigint) - the transaction amount in cents to match
      - `direction` (text) - credit or debit
      - `target_type` (text) - rent_payment, income_entry, or expense
      - `target_config` (jsonb) - configuration for the target:
        For rent: { tenant_id, contract_id?, allocate_nk?: boolean }
        For expense: { property_id?, category, description? }
        For income: { property_id?, category, description? }
      - `match_count` (integer) - how many times this rule has been applied
      - `last_matched_at` (timestamptz) - when this rule was last applied
      - `is_active` (boolean) - whether the rule is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. New Settings Column
    - `user_settings.auto_apply_bank_rules` (boolean) - whether to auto-apply matching rules after import

  3. Security
    - Enable RLS on `bank_matching_rules`
    - Policies for authenticated users to manage their own rules
*/

CREATE TABLE IF NOT EXISTS bank_matching_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  counterparty_name text NOT NULL,
  amount_cents bigint NOT NULL,
  direction text NOT NULL CHECK (direction IN ('credit', 'debit')),
  target_type text NOT NULL CHECK (target_type IN ('rent_payment', 'income_entry', 'expense')),
  target_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  match_count integer NOT NULL DEFAULT 0,
  last_matched_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_matching_rules_user_id ON bank_matching_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_matching_rules_lookup ON bank_matching_rules(user_id, is_active, counterparty_name, amount_cents);

ALTER TABLE bank_matching_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matching rules"
  ON bank_matching_rules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own matching rules"
  ON bank_matching_rules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matching rules"
  ON bank_matching_rules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own matching rules"
  ON bank_matching_rules FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'auto_apply_bank_rules'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN auto_apply_bank_rules boolean NOT NULL DEFAULT false;
  END IF;
END $$;
