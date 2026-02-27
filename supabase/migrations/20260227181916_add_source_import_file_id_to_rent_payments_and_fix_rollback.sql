/*
  # Add source_bank_import_file_id to rent_payments + Update Rollback RPC

  ## Overview
  Completes the source tracking for bank-import-created records so that
  the bulk rollback function can safely identify and remove ALL records
  created by a specific import.

  ## Current state (before this migration)
  - expenses: has source_bank_import_file_id + source_bank_transaction_id
  - income_entries: has source_bank_import_file_id + source_bank_transaction_id
  - rent_payments: has ONLY source_bank_transaction_id (MISSING source_bank_import_file_id)

  ## Changes

  ### 1. rent_payments - add source_bank_import_file_id
    - Nullable uuid column referencing bank_import_files
    - Index for efficient rollback lookups

  ### 2. Updated rollback_and_delete_import RPC
    - Now also deletes rent_payments where source_bank_import_file_id matches
    - Recalculates affected rent payment statuses AFTER all deletions
    - Correct ordering: soft-delete allocations -> delete source-tracked records
      -> recalculate remaining targets -> delete transactions -> mark import deleted

  ### 3. Security
    - No RLS changes needed (rent_payments already has user_id-based RLS)
    - RPC continues to use auth.uid() ownership check
*/

-- ============================================================
-- 1. Add source_bank_import_file_id to rent_payments
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payments' AND column_name = 'source_bank_import_file_id'
  ) THEN
    ALTER TABLE public.rent_payments
      ADD COLUMN source_bank_import_file_id uuid REFERENCES public.bank_import_files(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rent_payments_source_import
  ON public.rent_payments(source_bank_import_file_id)
  WHERE source_bank_import_file_id IS NOT NULL;

-- ============================================================
-- 2. Updated rollback_and_delete_import RPC
--    Now handles rent_payments with source tracking
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
  v_deleted_rent_payments integer := 0;
  v_recalced_rents integer := 0;
  v_rent_ids_to_recalc uuid[];
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

  IF v_status IN ('deleted', 'rolled_back') THEN
    RETURN jsonb_build_object('status', 'already_deleted', 'message', 'Import was already rolled back');
  END IF;

  -- 2. Collect all bank_transaction IDs from this import
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
  INTO v_tx_ids
  FROM public.bank_transactions
  WHERE import_file_id = p_import_file_id
    AND user_id = auth.uid();

  -- 3. Collect affected allocation targets (rent_payments that were allocated to,
  --    but NOT created by this import — these need recalculation, not deletion)
  SELECT COALESCE(
    jsonb_agg(DISTINCT jsonb_build_object('target_type', target_type, 'target_id', target_id)),
    '[]'::jsonb
  )
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

  -- 5. Delete rent_payments created by this import (source-tracked)
  --    Collect their IDs first so we know which rent targets to NOT recalc
  WITH deleted AS (
    DELETE FROM public.rent_payments
    WHERE source_bank_import_file_id = p_import_file_id
      AND user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_rent_payments FROM deleted;

  -- 6. Delete income_entries created by this import (source-tracked)
  WITH deleted AS (
    DELETE FROM public.income_entries
    WHERE source_bank_import_file_id = p_import_file_id
      AND user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_income FROM deleted;

  -- 7. Delete expenses created by this import (source-tracked)
  WITH deleted AS (
    DELETE FROM public.expenses
    WHERE source_bank_import_file_id = p_import_file_id
      AND user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_expenses FROM deleted;

  -- 8. Recalculate status for affected targets that still exist
  FOR v_target IN SELECT * FROM jsonb_array_elements(v_affected_targets) AS t
  LOOP
    IF (v_target.t->>'target_type') = 'rent_payment' THEN
      -- Only recalc if the rent_payment still exists (wasn't deleted in step 5)
      IF EXISTS (SELECT 1 FROM public.rent_payments WHERE id = (v_target.t->>'target_id')::uuid) THEN
        PERFORM public.recalc_rent_payment_status((v_target.t->>'target_id')::uuid);
        v_recalced_rents := v_recalced_rents + 1;
      END IF;
    ELSIF (v_target.t->>'target_type') = 'expense' THEN
      IF EXISTS (SELECT 1 FROM public.expenses WHERE id = (v_target.t->>'target_id')::uuid) THEN
        UPDATE public.expenses
        SET status = CASE
          WHEN (SELECT COALESCE(SUM(amount_allocated), 0)
                FROM public.bank_transaction_allocations
                WHERE target_type = 'expense' AND target_id = (v_target.t->>'target_id')::uuid AND deleted_at IS NULL
               ) >= ABS(amount) THEN 'paid'
          ELSE 'open'
        END
        WHERE id = (v_target.t->>'target_id')::uuid;
      END IF;
    ELSIF (v_target.t->>'target_type') = 'income_entry' THEN
      IF EXISTS (SELECT 1 FROM public.income_entries WHERE id = (v_target.t->>'target_id')::uuid) THEN
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
    END IF;
  END LOOP;

  -- 9. Hard-delete all bank_transactions from this import
  WITH deleted AS (
    DELETE FROM public.bank_transactions
    WHERE import_file_id = p_import_file_id
      AND user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_transactions FROM deleted;

  -- 10. Mark import file as deleted
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
        'deleted_rent_payments', v_deleted_rent_payments,
        'recalced_rents', v_recalced_rents
      )
  WHERE id = p_import_file_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'deleted_allocations', v_deleted_allocations,
    'deleted_transactions', v_deleted_transactions,
    'deleted_income', v_deleted_income,
    'deleted_expenses', v_deleted_expenses,
    'deleted_rent_payments', v_deleted_rent_payments,
    'recalced_rents', v_recalced_rents
  );
END;
$$;
