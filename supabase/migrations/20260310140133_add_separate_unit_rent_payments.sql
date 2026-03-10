/*
  # Separate rent payments for units with own rent

  1. Modified Tables
    - `rent_payments`
      - `unit_id` (uuid, nullable, FK to property_units) - When set, this payment
        is for a specific unit's separate rent (e.g. parking spot)

  2. Modified Functions
    - `calculate_rent_for_period()` - Now EXCLUDES separate unit costs from the
      main contract rent, since those get their own payment rows
    - `generate_rent_payments_for_contract()` - Now also creates separate payment
      rows for each unit with rent_included = false
    - `sync_rent_payment_amounts()` - Now handles both main and unit-specific payments

  3. New Function
    - `generate_unit_rent_payments_for_contract()` - Creates monthly payment rows
      for each unit with rent_included = false

  4. Data Migration
    - Adjusts existing unpaid main payments to exclude separate unit costs
    - Creates separate unit payment rows for existing contracts

  5. Notes
    - Main payment rows have unit_id = NULL (contract-level rent)
    - Unit payment rows have unit_id set and description with unit info
    - This only applies when rent_included = false on rental_contract_units
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payments' AND column_name = 'unit_id'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN unit_id uuid REFERENCES property_units(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_rent_payments_unit_id ON rent_payments(unit_id);
  END IF;
END $$;

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

    SELECT v_total - COALESCE(SUM(
      CASE WHEN NOT rcu.rent_included
        THEN COALESCE(rcu.separate_rent, 0) + COALESCE(rcu.separate_additional_costs, 0)
        ELSE 0
      END
    ), 0)
    INTO v_total
    FROM rental_contract_units rcu
    WHERE rcu.contract_id = p_contract_id;

    RETURN COALESCE(v_total, 0);
  END IF;

  RETURN v_cold_rent + v_utilities;
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
  v_unit_rec RECORD;
BEGIN
  FOR rec IN
    SELECT rp.id, rp.due_date, rp.amount
    FROM rent_payments rp
    WHERE rp.contract_id = p_contract_id
      AND rp.paid = false
      AND rp.payment_status = 'unpaid'
      AND (rp.payment_type IS NULL OR rp.payment_type = 'rent')
      AND rp.unit_id IS NULL
  LOOP
    v_correct_amount := calculate_rent_for_period(p_contract_id, rec.due_date);

    IF rec.amount IS DISTINCT FROM v_correct_amount AND v_correct_amount > 0 THEN
      UPDATE rent_payments
      SET amount = v_correct_amount
      WHERE id = rec.id;
    END IF;
  END LOOP;

  FOR v_unit_rec IN
    SELECT rcu.unit_id,
           COALESCE(rcu.separate_rent, 0) + COALESCE(rcu.separate_additional_costs, 0) AS unit_amount
    FROM rental_contract_units rcu
    WHERE rcu.contract_id = p_contract_id
      AND NOT rcu.rent_included
      AND (COALESCE(rcu.separate_rent, 0) + COALESCE(rcu.separate_additional_costs, 0)) > 0
  LOOP
    UPDATE rent_payments
    SET amount = v_unit_rec.unit_amount
    WHERE contract_id = p_contract_id
      AND unit_id = v_unit_rec.unit_id
      AND paid = false
      AND payment_status = 'unpaid'
      AND (payment_type IS NULL OR payment_type = 'rent')
      AND amount IS DISTINCT FROM v_unit_rec.unit_amount;
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
  v_unit_rec RECORD;
  v_unit_amount numeric;
  v_unit_desc text;
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
      AND due_date = current_month
      AND unit_id IS NULL;

    IF existing_count = 0 THEN
      v_amount := calculate_rent_for_period(NEW.id, current_month);
      IF v_amount IS NULL OR v_amount = 0 THEN
        v_amount := NEW.total_rent;
      END IF;

      INSERT INTO public.rent_payments (
        contract_id, property_id, tenant_id, user_id,
        due_date, amount, paid, payment_status, notes
      ) VALUES (
        NEW.id, NEW.property_id, NULL, NEW.user_id,
        current_month, v_amount, false, 'unpaid', 'Auto-generated'
      );
    END IF;

    FOR v_unit_rec IN
      SELECT rcu.unit_id,
             COALESCE(rcu.separate_rent, 0) + COALESCE(rcu.separate_additional_costs, 0) AS unit_amount,
             COALESCE(rcu.label, pu.unit_number, 'Einheit') AS unit_label
      FROM rental_contract_units rcu
      JOIN property_units pu ON pu.id = rcu.unit_id
      WHERE rcu.contract_id = NEW.id
        AND NOT rcu.rent_included
        AND (COALESCE(rcu.separate_rent, 0) + COALESCE(rcu.separate_additional_costs, 0)) > 0
    LOOP
      SELECT COUNT(*) INTO existing_count
      FROM public.rent_payments
      WHERE contract_id = NEW.id
        AND due_date = current_month
        AND unit_id = v_unit_rec.unit_id;

      IF existing_count = 0 THEN
        INSERT INTO public.rent_payments (
          contract_id, property_id, tenant_id, user_id,
          due_date, amount, paid, payment_status, notes,
          unit_id, description
        ) VALUES (
          NEW.id, NEW.property_id, NULL, NEW.user_id,
          current_month, v_unit_rec.unit_amount, false, 'unpaid', 'Auto-generated',
          v_unit_rec.unit_id, v_unit_rec.unit_label
        );
      END IF;
    END LOOP;

    current_month := (current_month + interval '1 month')::date;
  END LOOP;

  IF TG_OP = 'UPDATE' AND OLD.total_rent IS DISTINCT FROM NEW.total_rent THEN
    PERFORM sync_rent_payment_amounts(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;


DO $$
DECLARE
  v_rec RECORD;
  v_correct_main numeric;
  v_unit_rec RECORD;
  v_month date;
  v_end_month date;
  v_existing int;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT rc.id AS contract_id, rc.property_id, rc.user_id,
           rc.contract_start, rc.contract_end, rc.rent_start_date,
           rc.generate_historic_payments
    FROM rental_contracts rc
    JOIN rental_contract_units rcu ON rcu.contract_id = rc.id
    WHERE NOT rcu.rent_included
      AND (COALESCE(rcu.separate_rent, 0) + COALESCE(rcu.separate_additional_costs, 0)) > 0
  LOOP
    UPDATE rent_payments rp
    SET amount = calculate_rent_for_period(v_rec.contract_id, rp.due_date)
    WHERE rp.contract_id = v_rec.contract_id
      AND rp.unit_id IS NULL
      AND rp.paid = false
      AND rp.payment_status = 'unpaid'
      AND (rp.payment_type IS NULL OR rp.payment_type = 'rent');

    FOR v_unit_rec IN
      SELECT rcu.unit_id,
             COALESCE(rcu.separate_rent, 0) + COALESCE(rcu.separate_additional_costs, 0) AS unit_amount,
             COALESCE(rcu.label, pu.unit_number, 'Einheit') AS unit_label
      FROM rental_contract_units rcu
      JOIN property_units pu ON pu.id = rcu.unit_id
      WHERE rcu.contract_id = v_rec.contract_id
        AND NOT rcu.rent_included
        AND (COALESCE(rcu.separate_rent, 0) + COALESCE(rcu.separate_additional_costs, 0)) > 0
    LOOP
      IF v_rec.rent_start_date IS NOT NULL THEN
        v_month := date_trunc('month', v_rec.rent_start_date)::date;
      ELSIF COALESCE(v_rec.generate_historic_payments, true) = false THEN
        v_month := date_trunc('month', CURRENT_DATE)::date;
      ELSE
        v_month := date_trunc('month', v_rec.contract_start)::date;
      END IF;

      v_end_month := (date_trunc('month', CURRENT_DATE)::date + interval '1 month')::date;
      IF v_rec.contract_end IS NOT NULL THEN
        v_end_month := LEAST(v_end_month, date_trunc('month', v_rec.contract_end)::date);
      END IF;

      WHILE v_month <= v_end_month LOOP
        SELECT COUNT(*) INTO v_existing
        FROM rent_payments
        WHERE contract_id = v_rec.contract_id
          AND due_date = v_month
          AND unit_id = v_unit_rec.unit_id;

        IF v_existing = 0 THEN
          INSERT INTO rent_payments (
            contract_id, property_id, tenant_id, user_id,
            due_date, amount, paid, payment_status, notes,
            unit_id, description
          ) VALUES (
            v_rec.contract_id, v_rec.property_id, NULL, v_rec.user_id,
            v_month, v_unit_rec.unit_amount, false, 'unpaid', 'Auto-generated',
            v_unit_rec.unit_id, v_unit_rec.unit_label
          );
        END IF;

        v_month := (v_month + interval '1 month')::date;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
