/*
  # Add description column to property_units table

  1. Changes
    - Add `description` column to property_units table
    - Type: text, nullable
    - Purpose: Allow users to add optional descriptions to property units

  2. Security
    - No RLS changes needed as property_units inherits RLS from parent policies
*/

-- Add description column to property_units table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'description'
  ) THEN
    ALTER TABLE property_units ADD COLUMN description text;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN property_units.description IS 'Optional description or notes about the property unit';
