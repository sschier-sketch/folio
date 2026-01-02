/*
  # Fix Tenant and Contract Fields

  1. Updates to tenants table
    - Add `name` (text) - combined full name for easier display
    - Add `address` (text) - tenant's address
    - Add `notes` (text) - internal notes

  2. Updates to rental_contracts table
    - Add `status` (text) - contract status (active, ending_soon, terminated, vacant)
    - Add `start_date` (date) - mapped from contract_start for consistency
    - Add `monthly_rent` (decimal) - mapped from base_rent for consistency
    - Add `utilities_advance` (decimal) - mapped from additional_costs for consistency

  3. Security
    - No RLS changes needed, using existing policies
*/

-- Add missing columns to tenants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'name'
  ) THEN
    ALTER TABLE tenants ADD COLUMN name text DEFAULT '';
    UPDATE tenants SET name = first_name || ' ' || last_name WHERE name = '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'address'
  ) THEN
    ALTER TABLE tenants ADD COLUMN address text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'notes'
  ) THEN
    ALTER TABLE tenants ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;

-- Add missing columns to rental_contracts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'status'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'ending_soon', 'terminated', 'vacant'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN start_date date;
    UPDATE rental_contracts SET start_date = contract_start WHERE start_date IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN end_date date;
    UPDATE rental_contracts SET end_date = contract_end WHERE end_date IS NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'monthly_rent'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN monthly_rent decimal DEFAULT 0;
    UPDATE rental_contracts SET monthly_rent = base_rent WHERE monthly_rent = 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'utilities_advance'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN utilities_advance decimal DEFAULT 0;
    UPDATE rental_contracts SET utilities_advance = additional_costs WHERE utilities_advance = 0;
  END IF;
END $$;