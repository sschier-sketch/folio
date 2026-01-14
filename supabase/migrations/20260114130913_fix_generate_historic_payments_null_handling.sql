/*
  # Fix generate_historic_payments NULL handling

  1. Changes
    - Update trigger function to use COALESCE to handle NULL values
    - NULL values will be treated as true (generate historic payments)
    - This ensures consistent behavior across all scenarios

  2. Notes
    - Makes the function more robust
    - Explicitly handles NULL case
    - Maintains backward compatibility
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
  -- If generate_historic_payments is false, start from current month
  -- Otherwise (true or NULL) start from contract start date
  IF COALESCE(NEW.generate_historic_payments, true) = false THEN
    current_month := date_trunc('month', CURRENT_DATE)::date;
  ELSE
    current_month := date_trunc('month', NEW.contract_start)::date;
  END IF;
  
  end_month := GREATEST(
    date_trunc('month', CURRENT_DATE)::date + interval '3 months',
    current_month + interval '12 months'
  )::date;
  
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