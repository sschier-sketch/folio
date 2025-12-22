/*
  # Auto-Generate Rent Payments for Contracts

  This migration adds automatic rent payment generation:

  ## 1. Function to Generate Rent Payments
  Creates a function that generates rent payments for a contract:
    - Generates payments from contract start to current date + 3 months
    - Uses total_rent from contract
    - Sets due_date to the 1st of each month
    - Marks payments as unpaid by default

  ## 2. Trigger for New/Updated Contracts
  Automatically generates rent payments when:
    - A new contract is created
    - An existing contract is updated

  ## 3. Backfill Existing Contracts
  Generates rent payments for all existing contracts that don't have them yet

  ## 4. Security
  Ensures proper RLS and user_id assignment
*/

-- =====================================================
-- 1. CREATE FUNCTION TO GENERATE RENT PAYMENTS
-- =====================================================

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
        notes
      ) VALUES (
        NEW.id,
        NEW.property_id,
        NEW.tenant_id,
        NEW.user_id,
        current_month,
        NEW.total_rent,
        false,
        'Auto-generated'
      );
    END IF;
    
    current_month := (current_month + interval '1 month')::date;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 2. CREATE TRIGGER FOR CONTRACT CREATION/UPDATE
-- =====================================================

DROP TRIGGER IF EXISTS generate_payments_on_contract_insert ON public.rental_contracts;
CREATE TRIGGER generate_payments_on_contract_insert
  AFTER INSERT ON public.rental_contracts
  FOR EACH ROW
  EXECUTE FUNCTION generate_rent_payments_for_contract();

DROP TRIGGER IF EXISTS generate_payments_on_contract_update ON public.rental_contracts;
CREATE TRIGGER generate_payments_on_contract_update
  AFTER UPDATE ON public.rental_contracts
  FOR EACH ROW
  WHEN (
    OLD.contract_start IS DISTINCT FROM NEW.contract_start
    OR OLD.contract_end IS DISTINCT FROM NEW.contract_end
    OR OLD.total_rent IS DISTINCT FROM NEW.total_rent
  )
  EXECUTE FUNCTION generate_rent_payments_for_contract();

-- =====================================================
-- 3. BACKFILL RENT PAYMENTS FOR EXISTING CONTRACTS
-- =====================================================

DO $$
DECLARE
  contract_record RECORD;
  current_month date;
  end_month date;
  existing_count int;
BEGIN
  FOR contract_record IN 
    SELECT * FROM public.rental_contracts
  LOOP
    current_month := date_trunc('month', contract_record.contract_start)::date;
    
    end_month := GREATEST(
      date_trunc('month', CURRENT_DATE)::date + interval '3 months',
      date_trunc('month', contract_record.contract_start)::date + interval '12 months'
    )::date;
    
    IF contract_record.contract_end IS NOT NULL THEN
      end_month := LEAST(end_month, date_trunc('month', contract_record.contract_end)::date);
    END IF;
    
    WHILE current_month <= end_month LOOP
      SELECT COUNT(*) INTO existing_count
      FROM public.rent_payments
      WHERE contract_id = contract_record.id
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
          notes
        ) VALUES (
          contract_record.id,
          contract_record.property_id,
          contract_record.tenant_id,
          contract_record.user_id,
          current_month,
          contract_record.total_rent,
          false,
          'Auto-generated (backfill)'
        );
      END IF;
      
      current_month := (current_month + interval '1 month')::date;
    END LOOP;
  END LOOP;
END $$;
