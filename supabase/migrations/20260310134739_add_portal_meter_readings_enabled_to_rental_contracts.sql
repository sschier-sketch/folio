/*
  # Add per-tenant meter reading toggle to rental contracts

  1. Modified Tables
    - `rental_contracts`
      - `portal_meter_readings_enabled` (boolean, default true) - Controls whether
        tenants can submit meter readings via the tenant portal

  2. Notes
    - Defaults to true so existing tenants retain current behavior
    - Landlords can disable this per-contract from the Mieterportal settings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'portal_meter_readings_enabled'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN portal_meter_readings_enabled boolean DEFAULT true NOT NULL;
  END IF;
END $$;
