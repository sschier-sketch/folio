/*
  # Property Enhancements - Country, MEA, Location, and Deposit Details

  1. Changes to `properties` table
    - Add `country` field (text) for country selection, defaults to 'Deutschland'
  
  2. Changes to `property_units` table
    - Add `mea` (Miteigentumsanteil) field (text) for ownership share
    - Add `location` field (text) for unit location within property
  
  3. Changes to `rental_contracts` table
    - Add `deposit_type` field (text) for deposit type (Bar, Konto, Mietkautionskonto)
    - Add `deposit_account` field (text) for account details
    - Add `deposit_received_date` field (date) for when deposit was received
*/

-- Add country field to properties table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'country'
  ) THEN
    ALTER TABLE properties ADD COLUMN country text DEFAULT 'Deutschland';
  END IF;
END $$;

-- Add MEA and location fields to property_units table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'mea'
  ) THEN
    ALTER TABLE property_units ADD COLUMN mea text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'location'
  ) THEN
    ALTER TABLE property_units ADD COLUMN location text;
  END IF;
END $$;

-- Add deposit detail fields to rental_contracts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'deposit_type'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN deposit_type text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'deposit_account'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN deposit_account text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'deposit_received_date'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN deposit_received_date date;
  END IF;
END $$;