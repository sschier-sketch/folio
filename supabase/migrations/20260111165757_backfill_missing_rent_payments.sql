/*
  # Backfill Missing Rent Payments

  1. Purpose
    - Generate missing rent payments for existing rental contracts
    - Ensure all contracts have their expected rent payments

  2. Process
    - Find all rental contracts without rent payments
    - Generate rent payments according to contract dates
    - Use the same logic as the trigger function

  3. Notes
    - Only creates payments for contracts that don't have any
    - Uses tenant_id = NULL (new schema)
    - Respects contract start/end dates
*/

DO $$
DECLARE
  contract_record RECORD;
  current_month date;
  end_month date;
  total_payments_created int := 0;
BEGIN
  FOR contract_record IN
    SELECT * FROM public.rental_contracts
    WHERE NOT EXISTS (
      SELECT 1 FROM public.rent_payments
      WHERE contract_id = rental_contracts.id
    )
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
        contract_record.id,
        contract_record.property_id,
        NULL,
        contract_record.user_id,
        current_month,
        contract_record.total_rent,
        false,
        'unpaid',
        'Auto-generated (backfill)'
      );
      
      total_payments_created := total_payments_created + 1;
      current_month := (current_month + interval '1 month')::date;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Created % rent payments for contracts without payments', total_payments_created;
END $$;