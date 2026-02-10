/*
  # Add Hausgeld (monthly) to property units

  1. Schema Changes
    - Adds `housegeld_monthly_cents` (BIGINT, NOT NULL, DEFAULT 0) to `property_units`
    - Stores the monthly Hausgeld payment in Euro-Cents for precision
    - CHECK constraint ensures value is never negative

  2. Backfill
    - All existing units default to 0 (no Hausgeld set)

  3. Important
    - Hausgeld is the monthly WEG fee owners pay for shared building costs
    - UI displays the value in EUR with decimals; DB stores in cents
    - Additive change only, no existing columns or data modified
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_units' AND column_name = 'housegeld_monthly_cents'
  ) THEN
    ALTER TABLE property_units
      ADD COLUMN housegeld_monthly_cents BIGINT NOT NULL DEFAULT 0;

    ALTER TABLE property_units
      ADD CONSTRAINT property_units_housegeld_non_negative
      CHECK (housegeld_monthly_cents >= 0);
  END IF;
END $$;
