/*
  # Add VAT rate and gross rent support

  1. Changes
    - Add `vat_rate` column to `rental_contracts` (decimal, default 19.00)
    - Add `vat_amount` column to `rent_payments` to store the VAT portion
    - Update `generate_rent_payments_for_contract` to calculate gross amounts
      when `vat_applicable = true`
    - Update `calculate_rent_for_period` to return gross amount when VAT applies
    - Update `sync_rent_payment_amounts` to include VAT in amount sync

  2. Rationale
    - Commercial rental contracts in Germany may require VAT (Umsatzsteuer)
    - The base_rent and additional_costs remain net values
    - total_rent remains net (base_rent + additional_costs)
    - When vat_applicable = true, rent_payments.amount = gross (net + VAT)
    - rent_payments.vat_amount stores the VAT portion for reporting

  3. Important
    - Existing rent payments for VAT contracts will be updated to include VAT
    - Non-VAT contracts are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'vat_rate'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN vat_rate decimal(5,2) DEFAULT 19.00;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payments' AND column_name = 'vat_amount'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN vat_amount numeric DEFAULT 0;
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

CREATE OR REPLACE FUNCTION public.calculate_gross_rent(
  p_net_amount numeric,
  p_contract_id uuid
)
RETURNS TABLE(gross numeric, vat numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vat_applicable boolean;
  v_vat_rate decimal(5,2);
BEGIN
  SELECT rc.vat_applicable, COALESCE(rc.vat_rate, 19.00)
  INTO v_vat_applicable, v_vat_rate
  FROM rental_contracts rc
  WHERE rc.id = p_contract_id;

  IF v_vat_applicable THEN
    vat := ROUND(p_net_amount * v_vat_rate / 100, 2);
    gross := p_net_amount + vat;
  ELSE
    vat := 0;
    gross := p_net_amount;
  END IF;

  RETURN NEXT;
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
  v_gross_amount numeric;
  v_vat_amount numeric;
  v_unit_rec RECORD;
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

      SELECT g.gross, g.vat INTO v_gross_amount, v_vat_amount
      FROM calculate_gross_rent(v_amount, NEW.id) g;

      INSERT INTO public.rent_payments (
        contract_id, property_id, tenant_id, user_id,
        due_date, amount, vat_amount, paid, payment_status, notes
      ) VALUES (
        NEW.id, NEW.property_id, NULL, NEW.user_id,
        current_month, v_gross_amount, v_vat_amount, false, 'unpaid', 'Auto-generated'
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
        SELECT g.gross, g.vat INTO v_gross_amount, v_vat_amount
        FROM calculate_gross_rent(v_unit_rec.unit_amount, NEW.id) g;

        INSERT INTO public.rent_payments (
          contract_id, property_id, tenant_id, user_id,
          due_date, amount, vat_amount, paid, payment_status, notes,
          unit_id, description
        ) VALUES (
          NEW.id, NEW.property_id, NULL, NEW.user_id,
          current_month, v_gross_amount, v_vat_amount, false, 'unpaid', 'Auto-generated',
          v_unit_rec.unit_id, v_unit_rec.unit_label
        );
      END IF;
    END LOOP;

    current_month := (current_month + interval '1 month')::date;
  END LOOP;

  IF TG_OP = 'UPDATE' AND (OLD.total_rent IS DISTINCT FROM NEW.total_rent OR OLD.vat_applicable IS DISTINCT FROM NEW.vat_applicable OR OLD.vat_rate IS DISTINCT FROM NEW.vat_rate) THEN
    PERFORM sync_rent_payment_amounts(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_rent_payment_amounts(p_contract_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_net_amount numeric;
  v_gross_amount numeric;
  v_vat_amount numeric;
BEGIN
  FOR v_rec IN
    SELECT rp.id, rp.due_date, rp.unit_id
    FROM rent_payments rp
    WHERE rp.contract_id = p_contract_id
      AND rp.payment_status = 'unpaid'
      AND rp.paid = false
  LOOP
    IF v_rec.unit_id IS NULL THEN
      v_net_amount := calculate_rent_for_period(p_contract_id, v_rec.due_date);

      IF v_net_amount IS NULL OR v_net_amount = 0 THEN
        SELECT rc.total_rent INTO v_net_amount
        FROM rental_contracts rc WHERE rc.id = p_contract_id;
      END IF;
    ELSE
      SELECT COALESCE(rcu.separate_rent, 0) + COALESCE(rcu.separate_additional_costs, 0)
      INTO v_net_amount
      FROM rental_contract_units rcu
      WHERE rcu.contract_id = p_contract_id AND rcu.unit_id = v_rec.unit_id;
    END IF;

    SELECT g.gross, g.vat INTO v_gross_amount, v_vat_amount
    FROM calculate_gross_rent(COALESCE(v_net_amount, 0), p_contract_id) g;

    UPDATE rent_payments
    SET amount = v_gross_amount,
        vat_amount = v_vat_amount
    WHERE id = v_rec.id;
  END LOOP;
END;
$$;
