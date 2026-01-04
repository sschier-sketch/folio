/*
  # Extend Tenant and Contract Fields for Enhanced Management  1. Changes to `tenants` table
    - Add `salutation` (text) - Anrede (Herr/Frau/Divers)
    - Add `street` (text) - Straße
    - Add `house_number` (text) - Hausnummer
    - Add `zip_code` (text) - PLZ
    - Add `city` (text) - Stadt
    - Add `country` (text) - Land (default: Deutschland)
    - Add `household_size` (integer) - Anzahl Personen im Haushalt
    
  2. Changes to `rental_contracts` table
    - Add `rent_type` (text) - Art der Miete (flat_rate, cold_rent_advance, cold_rent_utilities_heating)
    - Add `flat_rate_amount` (numeric) - Pauschalmiete
    - Add `cold_rent` (numeric) - Kaltmiete
    - Add `total_advance` (numeric) - Gesamtvorauszahlung
    - Add `operating_costs` (numeric) - Betriebskosten
    - Add `heating_costs` (numeric) - Heizkosten
    - Add `deposit_type` (text) - Art der Kaution
    - Add `deposit_due_date` (date) - Kaution fällig zum
    - Add `deposit_payment_type` (text) - Einmalzahlung/3 Monatsraten
    - Add `is_unlimited` (boolean) - Unbefristet

  3. Security
    - No RLS changes needed (inherits from existing policies)
*/

-- Add new fields to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS salutation text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS house_number text,
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Deutschland',
ADD COLUMN IF NOT EXISTS household_size integer DEFAULT 1;

-- Add new fields to rental_contracts table for rent types
ALTER TABLE rental_contracts
ADD COLUMN IF NOT EXISTS rent_type text DEFAULT 'cold_rent_advance' CHECK (rent_type IN ('flat_rate', 'cold_rent_advance', 'cold_rent_utilities_heating')),
ADD COLUMN IF NOT EXISTS flat_rate_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cold_rent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_advance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS operating_costs numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS heating_costs numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_unlimited boolean DEFAULT true;

-- Add new fields to rental_contracts table for deposit types
ALTER TABLE rental_contracts
ADD COLUMN IF NOT EXISTS deposit_payment_type text DEFAULT 'single_payment' CHECK (deposit_payment_type IN ('single_payment', 'three_months')),
ADD COLUMN IF NOT EXISTS deposit_due_date date;

-- Update deposit_type to use new enum values if not already constrained
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'rental_contracts' AND column_name = 'deposit_type'
  ) THEN
    ALTER TABLE rental_contracts
    ADD CONSTRAINT rental_contracts_deposit_type_check 
    CHECK (deposit_type IN ('none', 'cash', 'bank_transfer', 'pledged_savings', 'bank_guarantee'));
  END IF;
END $$;