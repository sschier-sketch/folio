/*
  # Auto-match suggestions + Tenant IBAN field

  1. New column on tenants
    - `iban` (text, nullable) - Tenant's bank IBAN for matching bank transactions

  2. New table: bank_match_rules
    - Stores user-defined rules for auto-ignoring/matching future transactions
    - `id` uuid PK
    - `user_id` uuid FK auth.users
    - `rule_type` text ('ignore' or 'match')
    - `field` text ('counterparty_iban', 'counterparty_name', 'usage_text')
    - `pattern` text (exact match value)
    - `target_type` text (nullable, for match rules)
    - `target_id` uuid (nullable, for match rules)
    - `created_at` timestamptz

  3. Security
    - RLS enabled on bank_match_rules, user_id = auth.uid()
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'iban'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN iban text;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.bank_match_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_type text NOT NULL DEFAULT 'ignore',
  field text NOT NULL,
  pattern text NOT NULL,
  target_type text,
  target_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bank_match_rules_rule_type_check CHECK (rule_type IN ('ignore', 'match')),
  CONSTRAINT bank_match_rules_field_check CHECK (field IN ('counterparty_iban', 'counterparty_name', 'usage_text'))
);

ALTER TABLE public.bank_match_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own match rules"
  ON public.bank_match_rules FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own match rules"
  ON public.bank_match_rules FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own match rules"
  ON public.bank_match_rules FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own match rules"
  ON public.bank_match_rules FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bank_match_rules_user_id ON public.bank_match_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_iban ON public.tenants(iban) WHERE iban IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status ON public.bank_transactions(user_id, status);
