/*
  # Fix Rent Payments Auto-Generation Trigger

  1. Problem
    - The `generate_rent_payments_for_contract()` function still references `NEW.tenant_id`
    - Since the schema restructure, `tenant_id` is nullable in `rental_contracts`
    - The relationship is now: tenants.contract_id -> rental_contracts.id
    - This causes the trigger to fail or create invalid rent payments

  2. Solution
    - Update the function to set tenant_id to NULL
    - The tenant relationship is maintained via contract_id in the tenants table
    - Ensure payment_status field is set correctly

  3. Notes
    - Existing rent_payments will keep their structure
    - New payments will be generated with tenant_id = NULL
    - Trigger will work correctly for new and updated contracts
*/

-- Update the function to not use tenant_id from rental_contracts
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
  current_month := date_trunc('month', NEW.contract_start)::date;
  
  end_month := GREATEST(
    date_trunc('month', CURRENT_DATE)::date + interval '3 months',
    date_trunc('month', NEW.contract_start)::date + interval '12 months'
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