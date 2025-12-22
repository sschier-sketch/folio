/*
  # Add Parking Spot Support

  1. Changes
    - Add `parking_spot_number` column to `properties` table
      - Stores optional parking spot number (e.g., "P-12", "A5")
      - Only relevant for parking spot property type
  
  2. Notes
    - Field is optional (nullable)
    - No index needed as this field is rarely queried
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'parking_spot_number'
  ) THEN
    ALTER TABLE properties ADD COLUMN parking_spot_number text;
  END IF;
END $$;