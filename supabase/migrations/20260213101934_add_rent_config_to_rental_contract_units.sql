/*
  # Add rent configuration to rental_contract_units

  ## Summary
  Adds per-unit rent configuration to the rental_contract_units junction table.
  This allows each unit in a multi-unit lease to specify whether its rent is
  included in the main contract rent, or whether it has a separate rent amount.

  Example: A tenant rents WE 5.1 (apartment) + a parking spot. The parking spot
  rent can either be "included in main rent" or have its own separate amount.

  ## Modified Tables
  ### `rental_contract_units`
  - `rent_included` (boolean, default true) - Whether this unit's rent is included in the main contract rent
  - `separate_rent` (numeric, default 0) - Monthly rent for this unit if not included in main rent
  - `separate_additional_costs` (numeric, default 0) - Monthly additional costs if not included
  - `label` (text, nullable) - Optional label/description for this unit assignment

  ## Notes
  - Existing entries default to rent_included=true (backwards compatible)
  - When rent_included=true, separate_rent and separate_additional_costs are ignored
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_units' AND column_name = 'rent_included'
  ) THEN
    ALTER TABLE rental_contract_units ADD COLUMN rent_included boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_units' AND column_name = 'separate_rent'
  ) THEN
    ALTER TABLE rental_contract_units ADD COLUMN separate_rent numeric DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_units' AND column_name = 'separate_additional_costs'
  ) THEN
    ALTER TABLE rental_contract_units ADD COLUMN separate_additional_costs numeric DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contract_units' AND column_name = 'label'
  ) THEN
    ALTER TABLE rental_contract_units ADD COLUMN label text;
  END IF;
END $$;
