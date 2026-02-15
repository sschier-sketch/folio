/*
  # Add allocation parameters to operating cost statements

  1. Modified Tables
    - `operating_cost_statements`
      - `alloc_unit_area` (numeric) - Unit area in m² for area-based allocation
      - `alloc_total_area` (numeric) - Total property area in m² for area-based allocation
      - `alloc_unit_persons` (integer) - Number of persons in unit for person-based allocation
      - `alloc_total_persons` (integer) - Total persons in property for person-based allocation
      - `alloc_total_units` (integer) - Total number of units for unit-based allocation
      - `alloc_unit_mea` (numeric) - Unit's MEA share (numerator)
      - `alloc_total_mea` (numeric) - Total MEA (sum of all numerators)

  2. Important Notes
    - All fields are nullable for backwards compatibility
    - When null, computeResults falls back to querying the DB directly
    - Pre-populated from property/unit/tenant data when creating a statement
    - User can override values in Step 2 of the wizard
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_cost_statements' AND column_name = 'alloc_unit_area'
  ) THEN
    ALTER TABLE operating_cost_statements ADD COLUMN alloc_unit_area numeric DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_cost_statements' AND column_name = 'alloc_total_area'
  ) THEN
    ALTER TABLE operating_cost_statements ADD COLUMN alloc_total_area numeric DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_cost_statements' AND column_name = 'alloc_unit_persons'
  ) THEN
    ALTER TABLE operating_cost_statements ADD COLUMN alloc_unit_persons integer DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_cost_statements' AND column_name = 'alloc_total_persons'
  ) THEN
    ALTER TABLE operating_cost_statements ADD COLUMN alloc_total_persons integer DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_cost_statements' AND column_name = 'alloc_total_units'
  ) THEN
    ALTER TABLE operating_cost_statements ADD COLUMN alloc_total_units integer DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_cost_statements' AND column_name = 'alloc_unit_mea'
  ) THEN
    ALTER TABLE operating_cost_statements ADD COLUMN alloc_unit_mea numeric DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_cost_statements' AND column_name = 'alloc_total_mea'
  ) THEN
    ALTER TABLE operating_cost_statements ADD COLUMN alloc_total_mea numeric DEFAULT NULL;
  END IF;
END $$;
