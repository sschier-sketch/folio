/*
  # Period-aware rent payment amount synchronisation

  ## Problem
  When a rental contract's total_rent changes, all unpaid future rent_payments
  are set to the **current** total_rent. This is wrong for months where a
  different rent_history period applies.

  Example: Contract has two periods
    - Nov 2022: cold_rent 2996.60 + NK 395 = 3391.60
    - Mar 2026: cold_rent 2912.92 + NK 395 = 3307.92
  Plus a Stellplatz of 150 EUR.

  For Feb 2026 the correct amount is 3391.60 + 150 = 3541.60
  For Mar 2026 the correct amount is 3307.92 + 150 = 3457.92

  But the old trigger set ALL unpaid payments to the latest total_rent.

  ## Solution
  1. Create a helper function `calculate_rent_for_period(contract_id, month_date)`
     that looks up the applicable rent_history entry for a given month and
     adds separate_unit costs.
  2. Create a function `sync_rent_payment_amounts(p_contract_id)` that updates
     all unpaid rent_payments to the correct period-based amount.
  3. Update the trigger on rental_contracts to call the new sync function.
  4. Add a trigger on rent_history so that when periods change, payments sync.

  ## Changes
  - New function: `calculate_rent_for_period(uuid, date)` -> numeric
  - New function: `sync_rent_payment_amounts(uuid)` -> void
  - Updated: `generate_rent_payments_for_contract()` trigger function
  - New trigger on rent_history for INSERT/UPDATE/DELETE

  ## Security
  - All functions are SECURITY DEFINER with search_path = public
*/

CREATE OR REPLACE FUNCTION public.calculate_rent_for_period(
  p_contract_id uuid,
  p_month date
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cold_rent numeric;
  v_utilities numeric;
  v_separate_total numeric;
  v_total numeric;
BEGIN
  SELECT rh.cold_rent, COALESCE(rh.utilities, 0)
  INTO v_cold_rent, v_utilities
  FROM rent_history rh
  WHERE rh.contract_id = p_contract_id
    AND rh.effective_date <= p_month
    AND rh.status = 'active'
  ORDER BY rh.effective_date DESC
  LIMIT 1;

  IF v_cold_rent IS NULL THEN
    SELECT rc.total_rent INTO v_total
    FROM rental_contracts rc
    WHERE rc.id = p_contract_id;
    RETURN COALESCE(v_total, 0);
  END IF;

  SELECT COALESCE(SUM(
    CASE WHEN NOT rcu.rent_included
      THEN COALESCE(rcu.separate_rent, 0) + COALESCE(rcu.separate_additional_costs, 0)
      ELSE 0
    END
  ), 0)
  INTO v_separate_total
  FROM rental_contract_units rcu
  WHERE rcu.contract_id = p_contract_id;

  RETURN v_cold_rent + v_utilities + v_separate_total;
END;
$$;


CREATE OR REPLACE FUNCTION public.sync_rent_payment_amounts(p_contract_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  v_correct_amount numeric;
BEGIN
  FOR rec IN
    SELECT rp.id, rp.due_date, rp.amount
    FROM rent_payments rp
    WHERE rp.contract_id = p_contract_id
      AND rp.paid = false
      AND rp.payment_status = 'unpaid'
      AND (rp.payment_type IS NULL OR rp.payment_type = 'rent')
  LOOP
    v_correct_amount := calculate_rent_for_period(p_contract_id, rec.due_date);

    IF rec.amount IS DISTINCT FROM v_correct_amount AND v_correct_amount > 0 THEN
      UPDATE rent_payments
      SET amount = v_correct_amount
      WHERE id = rec.id;
    END IF;
  END LOOP;
END;
$$;


CREATE OR REPLACE FUNCTION public.generate_rent_payments_for_contract()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month date;
  end_month date;
  existing_count int;
  v_amount numeric;
BEGIN
  IF NEW.rent_start_date IS NOT NULL THEN
    current_month := date_trunc('month', NEW.rent_start_date)::date;
  ELSIF COALESCE(NEW.generate_historic_payments, true) = false THEN
    current_month := date_trunc('month', CURRENT_DATE)::date;
  ELSE
    current_month := date_trunc('month', NEW.contract_start)::date;
  END IF;

  end_month := (date_trunc('month', CURRENT_DATE)::date + interval '1 month')::date;

  IF NEW.contract_end IS NOT NULL THEN
    end_month := LEAST(end_month, date_trunc('month', NEW.contract_end)::date);
  END IF;

  WHILE current_month <= end_month LOOP
    SELECT COUNT(*) INTO existing_count
    FROM public.rent_payments
    WHERE contract_id = NEW.id
    AND due_date = current_month;

    IF existing_count = 0 THEN
      v_amount := calculate_rent_for_period(NEW.id, current_month);
      IF v_amount IS NULL OR v_amount = 0 THEN
        v_amount := NEW.total_rent;
      END IF;

      INSERT INTO public.rent_payments (
        contract_id,
        property_id,
        tenant_id,
        user_id,
        due_date,
        amount,
        paid,
        payment_status,
        notes
      ) VALUES (
        NEW.id,
        NEW.property_id,
        NULL,
        NEW.user_id,
        current_month,
        v_amount,
        false,
        'unpaid',
        'Auto-generated'
      );
    END IF;

    current_month := (current_month + interval '1 month')::date;
  END LOOP;

  IF TG_OP = 'UPDATE' AND OLD.total_rent IS DISTINCT FROM NEW.total_rent THEN
    PERFORM sync_rent_payment_amounts(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION public.sync_rent_payments_on_history_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_contract_id := OLD.contract_id;
  ELSE
    v_contract_id := NEW.contract_id;
  END IF;

  IF v_contract_id IS NOT NULL THEN
    PERFORM sync_rent_payment_amounts(v_contract_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_rent_payments_on_history_change ON rent_history;

CREATE TRIGGER trg_sync_rent_payments_on_history_change
  AFTER INSERT OR UPDATE OR DELETE ON rent_history
  FOR EACH ROW
  EXECUTE FUNCTION sync_rent_payments_on_history_change();
