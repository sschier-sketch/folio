/*
  # Add option to control historic rent payments generation

  1. Changes
    - Add `generate_historic_payments` boolean field to `rental_contracts` table
    - Default is true (current behavior - generate payments from contract start)
    - When false, only generate payments from current month onwards

  2. Security
    - No RLS changes needed (field is part of existing table with RLS enabled)

  3. Notes
    - This helps users who create contracts for existing long-term tenancies
    - Prevents having to manually manage hundreds of historical payment records
    - Only affects new contract creation
*/

-- Add the new field to rental_contracts
ALTER TABLE rental_contracts 
ADD COLUMN IF NOT EXISTS generate_historic_payments boolean DEFAULT true;

-- Update the function to respect the generate_historic_payments flag
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
  -- Otherwise start from contract start date
  IF NEW.generate_historic_payments = false THEN
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