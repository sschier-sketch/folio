/*
  # Add meter fields for Gas and Strom

  1. Changes
    - Add `market_location_id` (text, optional) - Marktlokations-ID for Gas/Strom meters
    - Add `meter_category` (text, optional) - Category (Hauptzähler, Nebenzähler) for meters
  
  2. Notes
    - These fields are optional and primarily used for Gas and Strom meters
    - Uses IF NOT EXISTS to prevent errors if columns already exist
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meters' AND column_name = 'market_location_id'
  ) THEN
    ALTER TABLE meters ADD COLUMN market_location_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meters' AND column_name = 'meter_category'
  ) THEN
    ALTER TABLE meters ADD COLUMN meter_category text;
  END IF;
END $$;

COMMENT ON COLUMN meters.market_location_id IS 'Marktlokations-ID für Gas/Strom-Zähler';
COMMENT ON COLUMN meters.meter_category IS 'Zählerkategorie (Hauptzähler, Nebenzähler)';
