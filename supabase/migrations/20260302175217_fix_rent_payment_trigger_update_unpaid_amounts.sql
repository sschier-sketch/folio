/*
  # Fix rent payment trigger to update unpaid amounts on contract changes

  ## Problem
  When a rental contract's total_rent changes (e.g. Stellplatz added, Nebenkosten adjusted),
  existing unpaid rent_payment records for current and future months keep their old amounts.
  This causes stale values to appear in the bank import auto-allocation and elsewhere.

  ## Solution
  Modify `generate_rent_payments_for_contract()` to:
  1. Still create missing rent_payment records for months that don't have one
  2. **Also update** existing unpaid rent_payments (payment_status = 'unpaid', paid = false)
     for current month and future months to reflect the new total_rent

  ## Changes
  - Updated `generate_rent_payments_for_contract()` function
  - Added UPDATE for unpaid future/current rent_payments when total_rent changes
  - Only updates payments where `paid = false` and `payment_status = 'unpaid'`
  - Never touches paid or partially paid records

  ## Security
  - Function remains SECURITY DEFINER with search_path = public
*/

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
        NEW.total_rent,
        false,
        'unpaid',
        'Auto-generated'
      );
    END IF;

    current_month := (current_month + interval '1 month')::date;
  END LOOP;

  IF TG_OP = 'UPDATE' AND OLD.total_rent IS DISTINCT FROM NEW.total_rent THEN
    UPDATE public.rent_payments
    SET amount = NEW.total_rent
    WHERE contract_id = NEW.id
      AND paid = false
      AND payment_status = 'unpaid'
      AND due_date >= date_trunc('month', CURRENT_DATE)::date
      AND payment_type IS DISTINCT FROM 'nebenkosten';
  END IF;

  RETURN NEW;
END;
$$;
