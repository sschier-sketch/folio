/*
  # Add unit_id to operating_cost_statements

  1. Changes
    - Add `unit_id` field to operating_cost_statements table
    - Unit selection is required when property has multiple units
    - Enables per-unit operating cost statements

  2. Details
    - unit_id references property_units table
    - Field is nullable to support whole-property statements (single-unit properties)
    - Index added for performance
*/

-- Add unit_id column to operating_cost_statements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_cost_statements' AND column_name = 'unit_id'
  ) THEN
    ALTER TABLE operating_cost_statements
    ADD COLUMN unit_id uuid REFERENCES property_units(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for unit_id
CREATE INDEX IF NOT EXISTS idx_operating_cost_statements_unit_id 
ON operating_cost_statements(unit_id);