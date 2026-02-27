/*
  # Enhance Bank Import System: Rollback, Retention & Import History

  ## Overview
  Extends the bank import system with:
  1. Additional fields on bank_import_files for rollback/retention tracking
  2. Source tracking fields on income_entries and expenses for safe bulk rollback
  3. Server-side RPC function for atomic bulk rollback of an entire import
  4. Expanded status constraint to support 'rolled_back' and 'deleted' states

  ## Changes

  ### 1. bank_import_files - new columns
    - `storage_path` (text) - path to raw file in Supabase Storage
    - `rollback_available` (boolean, default true) - whether rollback is possible
    - `deleted_at` (timestamptz) - soft delete timestamp
    - `summary` (jsonb) - detailed counts (matched_auto, matched_manual, etc.)
    - Status constraint expanded to include 'rolled_back' and 'deleted'

  ### 2. Source tracking on income_entries, expenses
    - `source_bank_import_file_id` (uuid, nullable) on income_entries and expenses
    - Allows bulk identification of records created by a specific import

  ### 3. RPC: rollback_and_delete_import(p_import_file_id uuid)
    - Atomically reverses all effects of an import
    - Soft-deletes allocations, recalculates rent payment statuses
    - Deletes bank_transactions from the import
    - Marks the import file as 'deleted'

  ### 4. Security
    - RPC runs as SECURITY DEFINER with auth.uid() ownership check
    - All existing RLS policies remain unchanged
*/

-- ============================================================
-- 1. Extend bank_import_files with rollback/retention columns
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_import_files' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE public.bank_import_files ADD COLUMN storage_path text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_import_files' AND column_name = 'rollback_available'
  ) THEN
    ALTER TABLE public.bank_import_files ADD COLUMN rollback_available boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_import_files' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.bank_import_files ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bank_import_files' AND column_name = 'summary'
  ) THEN
    ALTER TABLE public.bank_import_files ADD COLUMN summary jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Expand status constraint to allow rolled_back and deleted
ALTER TABLE public.bank_import_files DROP CONSTRAINT IF EXISTS bank_import_files_status_check;
ALTER TABLE public.bank_import_files
  ADD CONSTRAINT bank_import_files_status_check
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rolled_back', 'deleted'));

-- ============================================================
-- 2. Source tracking on income_entries and expenses
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income_entries' AND column_name = 'source_bank_import_file_id'
  ) THEN
    ALTER TABLE public.income_entries
      ADD COLUMN source_bank_import_file_id uuid REFERENCES public.bank_import_files(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'source_bank_import_file_id'
  ) THEN
    ALTER TABLE public.expenses
      ADD COLUMN source_bank_import_file_id uuid REFERENCES public.bank_import_files(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_income_entries_source_import
  ON public.income_entries(source_bank_import_file_id)
  WHERE source_bank_import_file_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_source_import
  ON public.expenses(source_bank_import_file_id)
  WHERE source_bank_import_file_id IS NOT NULL;

-- ============================================================
-- 3. RPC: rollback_and_delete_import
-- ============================================================
CREATE OR REPLACE FUNCTION public.rollback_and_delete_import(p_import_file_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_status text;
  v_tx_ids uuid[];
  v_affected_targets jsonb;
  v_target record;
  v_deleted_allocations integer := 0;
  v_deleted_transactions integer := 0;
  v_deleted_income integer := 0;
  v_deleted_expenses integer := 0;
  v_recalced_rents integer := 0;
BEGIN
  -- 1. Auth + ownership check
  SELECT user_id, status INTO v_user_id, v_status
  FROM public.bank_import_files
  WHERE id = p_import_file_id;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Import not found');
  END IF;

  IF v_user_id != auth.uid() THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;

  -- Idempotent: already deleted/rolled back
  IF v_status IN ('deleted', 'rolled_back') THEN
    RETURN jsonb_build_object('status', 'already_deleted', 'message', 'Import was already rolled back');
  END IF;

  -- 2. Collect all bank_transaction IDs from this import
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
  INTO v_tx_ids
  FROM public.bank_transactions
  WHERE import_file_id = p_import_file_id
    AND user_id = auth.uid();

  -- 3. Collect affected allocation targets before soft-deleting
  SELECT COALESCE(jsonb_agg(DISTINCT jsonb_build_object('target_type', target_type, 'target_id', target_id)), '[]'::jsonb)
  INTO v_affected_targets
  FROM public.bank_transaction_allocations
  WHERE bank_transaction_id = ANY(v_tx_ids)
    AND deleted_at IS NULL;

  -- 4. Soft-delete all allocations for these transactions
  WITH deleted AS (
    UPDATE public.bank_transaction_allocations
    SET deleted_at = now()
    WHERE bank_transaction_id = ANY(v_tx_ids)
      AND deleted_at IS NULL
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_allocations FROM deleted;

  -- 5. Recalculate rent payment statuses for affected targets
  FOR v_target IN SELECT * FROM jsonb_array_elements(v_affected_targets) AS t
  LOOP
    IF (v_target.t->>'target_type') = 'rent_payment' THEN
      PERFORM public.recalc_rent_payment_status((v_target.t->>'target_id')::uuid);
      v_recalced_rents := v_recalced_rents + 1;
    ELSIF (v_target.t->>'target_type') = 'expense' THEN
      UPDATE public.expenses
      SET status = CASE
        WHEN (SELECT COALESCE(SUM(amount_allocated), 0)
              FROM public.bank_transaction_allocations
              WHERE target_type = 'expense' AND target_id = (v_target.t->>'target_id')::uuid AND deleted_at IS NULL
             ) >= ABS(amount) THEN 'paid'
        ELSE 'open'
      END
      WHERE id = (v_target.t->>'target_id')::uuid;
    ELSIF (v_target.t->>'target_type') = 'income_entry' THEN
      UPDATE public.income_entries
      SET status = CASE
        WHEN (SELECT COALESCE(SUM(amount_allocated), 0)
              FROM public.bank_transaction_allocations
              WHERE target_type = 'income_entry' AND target_id = (v_target.t->>'target_id')::uuid AND deleted_at IS NULL
             ) >= ABS(amount) THEN 'paid'
        ELSE 'open'
      END
      WHERE id = (v_target.t->>'target_id')::uuid;
    END IF;
  END LOOP;

  -- 6. Delete income_entries created by this import (only those with source tracking)
  WITH deleted AS (
    DELETE FROM public.income_entries
    WHERE source_bank_import_file_id = p_import_file_id
      AND user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_income FROM deleted;

  -- 7. Delete expenses created by this import (only those with source tracking)
  WITH deleted AS (
    DELETE FROM public.expenses
    WHERE source_bank_import_file_id = p_import_file_id
      AND user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_expenses FROM deleted;

  -- 8. Hard-delete all bank_transactions from this import
  WITH deleted AS (
    DELETE FROM public.bank_transactions
    WHERE import_file_id = p_import_file_id
      AND user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_transactions FROM deleted;

  -- 9. Mark import file as deleted
  UPDATE public.bank_import_files
  SET status = 'deleted',
      deleted_at = now(),
      rollback_available = false,
      summary = COALESCE(summary, '{}'::jsonb) || jsonb_build_object(
        'rolled_back_at', now()::text,
        'deleted_allocations', v_deleted_allocations,
        'deleted_transactions', v_deleted_transactions,
        'deleted_income', v_deleted_income,
        'deleted_expenses', v_deleted_expenses,
        'recalced_rents', v_recalced_rents
      )
  WHERE id = p_import_file_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'deleted_allocations', v_deleted_allocations,
    'deleted_transactions', v_deleted_transactions,
    'deleted_income', v_deleted_income,
    'deleted_expenses', v_deleted_expenses,
    'recalced_rents', v_recalced_rents
  );
END;
$$;
