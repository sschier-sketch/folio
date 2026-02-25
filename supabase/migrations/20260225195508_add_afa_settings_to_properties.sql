/*
  # Add AfA settings to properties

  1. Modified Tables
    - `properties`
      - `afa_settings` (jsonb, nullable) - Stores depreciation (AfA) configuration per property
        Contains: enabled, purchase_date, purchase_price_total, building_share_type,
        building_share_value, building_value_amount, construction_year, usage_type,
        afa_rate, ownership_share

  2. Notes
    - JSONB field chosen for fast implementation and flexibility
    - Only property owners (user_id) can read/write via existing RLS policies
    - No new RLS policies needed as the column is on the existing `properties` table
    - Existing RLS on `properties` already restricts access to owner
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'afa_settings'
  ) THEN
    ALTER TABLE properties ADD COLUMN afa_settings jsonb;
  END IF;
END $$;
