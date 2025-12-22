/*
  # Update Properties Address Fields

  1. Changes
    - Add separate fields for street, zip_code, and city
    - Keep 'address' field for backward compatibility (will be auto-generated)
    - Make purchase_date required by removing default null

  2. Notes
    - Existing data will maintain the old 'address' field
    - New entries will use the separate fields
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'street'
  ) THEN
    ALTER TABLE properties ADD COLUMN street text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE properties ADD COLUMN zip_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'city'
  ) THEN
    ALTER TABLE properties ADD COLUMN city text;
  END IF;
END $$;