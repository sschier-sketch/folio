/*
  # Add Missing Tenant and Contract Enhancement Fields

  1. Changes to `tenants` table
    - Add `company_name` (text, optional) - for company tenants
    - Add `date_of_birth` (date, optional) - for individual tenants

  2. Changes to `rental_contracts` table
    - Add `graduated_rent_new_amount` (numeric, optional) - new rent amount for graduated rent increases
    
  3. Notes
    - All fields are optional to maintain compatibility with existing data
    - These fields enhance tenant and contract management capabilities
*/

-- Add company_name and date_of_birth to tenants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE tenants ADD COLUMN company_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE tenants ADD COLUMN date_of_birth date;
  END IF;
END $$;

-- Add graduated_rent_new_amount to rental_contracts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'graduated_rent_new_amount'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN graduated_rent_new_amount numeric(10,2);
  END IF;
END $$;