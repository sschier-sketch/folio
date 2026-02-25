/*
  # Add construction year to properties and property_units

  1. Modified Tables
    - `properties`
      - `construction_year` (integer, nullable) - Year the building was constructed or ready for occupancy
    - `property_units`
      - `construction_year` (integer, nullable) - Year the unit/building was constructed or ready for occupancy

  2. Notes
    - Field is optional on both tables
    - Used for Anlage V tax reporting and depreciation (AfA) calculations
    - On properties: used when ownership_type = 'full_property'
    - On property_units: used when ownership_type = 'units_only'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'construction_year'
  ) THEN
    ALTER TABLE properties ADD COLUMN construction_year integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'construction_year'
  ) THEN
    ALTER TABLE property_units ADD COLUMN construction_year integer;
  END IF;
END $$;
