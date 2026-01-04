/*
  # Fix rental_contracts rent_type constraint

  1. Changes
    - Drop old rent_type check constraint with values (cold_rent, warm_rent, all_inclusive)
    - Update existing rent_type values to match new constraint
      - cold_rent -> cold_rent_advance
      - warm_rent -> flat_rate
      - all_inclusive -> flat_rate
    - Add new rent_type check constraint with correct values (flat_rate, cold_rent_advance, cold_rent_utilities_heating)
  
  2. Notes
    - This fixes the mismatch between the database constraint and the application code
    - Required for proper tenant and contract creation
*/

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rental_contracts_rent_type_check'
  ) THEN
    ALTER TABLE rental_contracts DROP CONSTRAINT rental_contracts_rent_type_check;
  END IF;
END $$;

UPDATE rental_contracts 
SET rent_type = CASE 
  WHEN rent_type = 'cold_rent' THEN 'cold_rent_advance'
  WHEN rent_type = 'warm_rent' THEN 'flat_rate'
  WHEN rent_type = 'all_inclusive' THEN 'flat_rate'
  ELSE rent_type
END
WHERE rent_type IN ('cold_rent', 'warm_rent', 'all_inclusive');

ALTER TABLE rental_contracts 
ADD CONSTRAINT rental_contracts_rent_type_check 
CHECK (rent_type IN ('flat_rate', 'cold_rent_advance', 'cold_rent_utilities_heating'));