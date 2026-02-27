/*
  # Bank Import System MVP

  ## Overview
  Extends the existing bank_connections / bank_transactions tables and adds
  bank_import_files + bank_transaction_allocations for CSV / CAMT.053 file
  import, matching, partial allocation, and undo support.

  ## Existing tables analysed
  - bank_connections (id, user_id, bank_name, account_number, ...) -- 0 rows
  - bank_transactions (id, bank_connection_id, transaction_date, amount,
    description, sender, matched_payment_id, matched_expense_id, status) -- 0 rows
  - rent_payments (id, user_id, amount, paid_amount, payment_status [paid/partial/unpaid],
    dunning_level, partial_payments jsonb, paid, paid_date, ...)
  - expenses (id, user_id, amount, status [open/paid/archived], ...)
  - income_entries (id, user_id, amount, status [open/paid], ...)

  ## Changes

  ### 1. New table: bank_import_files
    - Tracks uploaded files (CSV, CAMT.053, MT940)
    - Stores per-file metadata and import statistics

  ### 2. Extended table: bank_transactions
    - Add user_id (direct ownership for simpler RLS)
    - Add import_file_id FK
    - Add value_date, currency, direction, counterparty_name, counterparty_iban,
      usage_text, end_to_end_id, mandate_id, bank_reference, fingerprint (UNIQUE),
      matched_by, confidence, raw_data jsonb, updated_at
    - Make bank_connection_id nullable (file imports have no connection)
    - Extend status CHECK to UNMATCHED/SUGGESTED/MATCHED_AUTO/MATCHED_MANUAL/IGNORED
    - Keep legacy columns matched_payment_id / matched_expense_id for backwards compat

  ### 3. New table: bank_transaction_allocations
    - Links a bank_transaction to a target (rent_payment, income_entry, expense)
    - Supports partial allocation and soft-delete for undo

  ### 4. Add source_bank_transaction_id to rent_payments, expenses, income_entries
    - Optional reverse-lookup column for quick queries

  ### 5. SQL helper functions
    - bank_tx_fingerprint(user_id, booking_date, amount, iban, usage, ref)
    - recalc_rent_payment_status(rent_payment_id) -- recalculates from allocations

  ### 6. Security
    - RLS on all new tables: user_id = auth.uid()
    - Updated RLS on bank_transactions to use direct user_id
*/

-- ============================================================
-- 1. bank_import_files
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bank_import_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  source_type text NOT NULL DEFAULT 'csv',
  file_size_bytes integer,
  status text NOT NULL DEFAULT 'pending',
  total_rows integer DEFAULT 0,
  imported_rows integer DEFAULT 0,
  duplicate_rows integer DEFAULT 0,
  error_message text,
  raw_meta jsonb DEFAULT '{}'::jsonb,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bank_import_files_source_type_check
    CHECK (source_type IN ('csv', 'camt053', 'mt940')),
  CONSTRAINT bank_import_files_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

ALTER TABLE public.bank_import_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import files"
  ON public.bank_import_files FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own import files"
  ON public.bank_import_files FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own import files"
  ON public.bank_import_files FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own import files"
  ON public.bank_import_files FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_bank_import_files_user_id ON public.bank_import_files(user_id);

-- ============================================================
-- 2. Extend bank_transactions
-- ============================================================

-- Make bank_connection_id nullable (file imports have no connection)
ALTER TABLE public.bank_transactions
  ALTER COLUMN bank_connection_id DROP NOT NULL;

-- Add user_id column (direct ownership)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.bank_transactions
      ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add import_file_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'import_file_id'
  ) THEN
    ALTER TABLE public.bank_transactions
      ADD COLUMN import_file_id uuid REFERENCES public.bank_import_files(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add all missing columns
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'value_date'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN value_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN currency text DEFAULT 'EUR';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'direction'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN direction text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'counterparty_name'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN counterparty_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'counterparty_iban'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN counterparty_iban text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'usage_text'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN usage_text text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'end_to_end_id'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN end_to_end_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'mandate_id'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN mandate_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'bank_reference'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN bank_reference text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'fingerprint'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN fingerprint text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'matched_by'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN matched_by text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'confidence'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN confidence numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'raw_data'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN raw_data jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_transactions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.bank_transactions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Unique constraint on fingerprint (dedup)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'bank_transactions' AND indexname = 'idx_bank_transactions_fingerprint'
  ) THEN
    CREATE UNIQUE INDEX idx_bank_transactions_fingerprint
      ON public.bank_transactions(fingerprint)
      WHERE fingerprint IS NOT NULL;
  END IF;
END $$;

-- Replace the status check constraint with the extended enum
ALTER TABLE public.bank_transactions DROP CONSTRAINT IF EXISTS bank_transactions_status_check;
ALTER TABLE public.bank_transactions
  ADD CONSTRAINT bank_transactions_status_check
    CHECK (status IN ('UNMATCHED', 'SUGGESTED', 'MATCHED_AUTO', 'MATCHED_MANUAL', 'IGNORED'));

-- Update default status
ALTER TABLE public.bank_transactions ALTER COLUMN status SET DEFAULT 'UNMATCHED';

-- Direction check
ALTER TABLE public.bank_transactions
  ADD CONSTRAINT bank_transactions_direction_check
    CHECK (direction IS NULL OR direction IN ('credit', 'debit'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bank_transactions_user_id
  ON public.bank_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_import_file_id
  ON public.bank_transactions(import_file_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status
  ON public.bank_transactions(status);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_booking_date
  ON public.bank_transactions(transaction_date);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_bank_transactions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_bank_transactions_updated_at ON public.bank_transactions;
CREATE TRIGGER trigger_bank_transactions_updated_at
  BEFORE UPDATE ON public.bank_transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_bank_transactions_updated_at();

-- Update RLS: add user_id-based policies alongside existing ones
-- Drop old policies that use bank_connection_id join (they will break with nullable FK)
DROP POLICY IF EXISTS "Users can view own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can insert own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can update own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can delete own bank transactions" ON public.bank_transactions;

CREATE POLICY "Users can view own bank transactions"
  ON public.bank_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank transactions"
  ON public.bank_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank transactions"
  ON public.bank_transactions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank transactions"
  ON public.bank_transactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 3. bank_transaction_allocations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bank_transaction_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_transaction_id uuid NOT NULL REFERENCES public.bank_transactions(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  amount_allocated numeric(12,2) NOT NULL,
  created_by text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,

  CONSTRAINT bta_target_type_check
    CHECK (target_type IN ('rent_payment', 'income_entry', 'expense')),
  CONSTRAINT bta_created_by_check
    CHECK (created_by IN ('auto', 'manual')),
  CONSTRAINT bta_amount_positive
    CHECK (amount_allocated > 0)
);

ALTER TABLE public.bank_transaction_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own allocations"
  ON public.bank_transaction_allocations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allocations"
  ON public.bank_transaction_allocations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allocations"
  ON public.bank_transaction_allocations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own allocations"
  ON public.bank_transaction_allocations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_bta_bank_transaction_id
  ON public.bank_transaction_allocations(bank_transaction_id);
CREATE INDEX idx_bta_target
  ON public.bank_transaction_allocations(target_type, target_id);
CREATE INDEX idx_bta_user_id
  ON public.bank_transaction_allocations(user_id);
CREATE INDEX idx_bta_active
  ON public.bank_transaction_allocations(bank_transaction_id)
  WHERE deleted_at IS NULL;


-- ============================================================
-- 4. Add source_bank_transaction_id to existing tables
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payments' AND column_name = 'source_bank_transaction_id'
  ) THEN
    ALTER TABLE public.rent_payments
      ADD COLUMN source_bank_transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'source_bank_transaction_id'
  ) THEN
    ALTER TABLE public.expenses
      ADD COLUMN source_bank_transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income_entries' AND column_name = 'source_bank_transaction_id'
  ) THEN
    ALTER TABLE public.income_entries
      ADD COLUMN source_bank_transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL;
  END IF;
END $$;


-- ============================================================
-- 5. Fingerprint function
-- ============================================================
CREATE OR REPLACE FUNCTION public.bank_tx_fingerprint(
  p_user_id uuid,
  p_booking_date date,
  p_amount numeric,
  p_iban text,
  p_usage text,
  p_reference text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(
    digest(
      p_user_id::text
        || '|' || COALESCE(p_booking_date::text, '')
        || '|' || COALESCE(p_amount::text, '')
        || '|' || COALESCE(UPPER(TRIM(p_iban)), '')
        || '|' || COALESCE(LEFT(TRIM(p_usage), 140), '')
        || '|' || COALESCE(TRIM(p_reference), ''),
      'sha256'
    ),
    'hex'
  );
END;
$$;


-- ============================================================
-- 6. Recalc rent payment status from allocations
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalc_rent_payment_status(p_rent_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_due_amount numeric;
  v_total_allocated numeric;
  v_new_status text;
BEGIN
  SELECT amount INTO v_due_amount
  FROM public.rent_payments
  WHERE id = p_rent_payment_id;

  IF v_due_amount IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(amount_allocated), 0)
  INTO v_total_allocated
  FROM public.bank_transaction_allocations
  WHERE target_type = 'rent_payment'
    AND target_id = p_rent_payment_id
    AND deleted_at IS NULL;

  IF v_total_allocated >= v_due_amount THEN
    v_new_status := 'paid';
  ELSIF v_total_allocated > 0 THEN
    v_new_status := 'partial';
  ELSE
    v_new_status := 'unpaid';
  END IF;

  UPDATE public.rent_payments
  SET payment_status = v_new_status,
      paid_amount = v_total_allocated,
      paid = (v_new_status = 'paid'),
      paid_date = CASE
        WHEN v_new_status = 'paid' THEN COALESCE(paid_date, CURRENT_DATE)
        ELSE NULL
      END
  WHERE id = p_rent_payment_id;
END;
$$;
