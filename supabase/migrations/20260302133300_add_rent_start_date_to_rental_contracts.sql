/*
  # Add rent_start_date column to rental_contracts

  1. Changes
    - Added `rent_start_date` (date, nullable) column to `rental_contracts`
      - When set, the rent payment trigger uses this date as the start for generating payments
      - Allows users to pick any custom date (past or future) for rent calculation start
    - Updated `generate_rent_payments_for_contract()` trigger function
      - Now checks for `rent_start_date` first
      - If `rent_start_date` is set, uses it as the start month (overrides both contract_start and "now")
      - If `rent_start_date` is NULL, falls back to existing logic (generate_historic_payments flag)

  2. Notes
    - Existing contracts are unaffected (rent_start_date defaults to NULL)
    - The three modes are now: "Ab Vertragsbeginn" (generate_historic_payments=true), 
      "Ab jetzt" (generate_historic_payments=false, rent_start_date=NULL),
      "Ab Wunschdatum" (generate_historic_payments=false, rent_start_date=custom date)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'rent_start_date'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN rent_start_date date;
  END IF;
END $$;

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
  
  RETURN NEW;
END;
$$;
