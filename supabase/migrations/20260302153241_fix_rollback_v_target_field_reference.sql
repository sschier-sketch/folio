/*
  # Fix rollback_and_delete_import RPC - v_target record field reference

  ## Problem
  The function uses `FOR v_target IN SELECT * FROM jsonb_array_elements(...) AS t`
  which creates a record with field `value` (the default column name from jsonb_array_elements),
  but the code references `v_target.t` which does not exist.

  ## Fix
  Changed the query to explicitly select `value` from jsonb_array_elements
  and reference it as `v_target.value` throughout the function.

  ## Changes
  - Fixed all references from `v_target.t` to `v_target.value` in the
    rollback_and_delete_import function (affects rent_payment, expense,
    and income_entry recalculation logic)
*/

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

  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
  INTO v_tx_ids
  FROM public.bank_transactions
  WHERE import_file_id = p_import_file_id
    AND user_id = auth.uid();

  SELECT COALESCE(
    jsonb_agg(DISTINCT jsonb_build_object('target_type', target_type, 'target_id', target_id)),
    '[]'::jsonb
  )
  INTO v_affected_targets
  FROM public.bank_transaction_allocations
  WHERE bank_transaction_id = ANY(v_tx_ids)
    AND deleted_at IS NULL;

  WITH deleted AS (
    UPDATE public.bank_transaction_allocations
    SET deleted_at = now()
    WHERE bank_transaction_id = ANY(v_tx_ids)
      AND deleted_at IS NULL
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_allocations FROM deleted;

  WITH deleted AS (
    DELETE FROM public.rent_payments
    WHERE source_bank_import_file_id = p_import_file_id
      AND user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_rent_payments FROM deleted;

  WITH deleted AS (
    DELETE FROM public.income_entries
    WHERE source_bank_import_file_id = p_import_file_id
      AND user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_income FROM deleted;

  WITH deleted AS (
    DELETE FROM public.expenses
    WHERE source_bank_import_file_id = p_import_file_id
      AND user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_expenses FROM deleted;

  FOR v_target IN SELECT value FROM jsonb_array_elements(v_affected_targets)
  LOOP
    IF (v_target.value->>'target_type') = 'rent_payment' THEN
      IF EXISTS (SELECT 1 FROM public.rent_payments WHERE id = (v_target.value->>'target_id')::uuid) THEN
        PERFORM public.recalc_rent_payment_status((v_target.value->>'target_id')::uuid);
        v_recalced_rents := v_recalced_rents + 1;
      END IF;
    ELSIF (v_target.value->>'target_type') = 'expense' THEN
      IF EXISTS (SELECT 1 FROM public.expenses WHERE id = (v_target.value->>'target_id')::uuid) THEN
        UPDATE public.expenses
        SET status = CASE
          WHEN (SELECT COALESCE(SUM(amount_allocated), 0)
                FROM public.bank_transaction_allocations
                WHERE target_type = 'expense' AND target_id = (v_target.value->>'target_id')::uuid AND deleted_at IS NULL
               ) >= ABS(amount) THEN 'paid'
          ELSE 'open'
        END
        WHERE id = (v_target.value->>'target_id')::uuid;
      END IF;
    ELSIF (v_target.value->>'target_type') = 'income_entry' THEN
      IF EXISTS (SELECT 1 FROM public.income_entries WHERE id = (v_target.value->>'target_id')::uuid) THEN
        UPDATE public.income_entries
        SET status = CASE
          WHEN (SELECT COALESCE(SUM(amount_allocated), 0)
                FROM public.bank_transaction_allocations
                WHERE target_type = 'income_entry' AND target_id = (v_target.value->>'target_id')::uuid AND deleted_at IS NULL
               ) >= ABS(amount) THEN 'paid'
          ELSE 'open'
        END
        WHERE id = (v_target.value->>'target_id')::uuid;
      END IF;
    END IF;
  END LOOP;

  WITH deleted AS (
    DELETE FROM public.bank_transactions
    WHERE import_file_id = p_import_file_id
      AND user_id = auth.uid()
    RETURNING id
  )
  SELECT count(*) INTO v_deleted_transactions FROM deleted;

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
