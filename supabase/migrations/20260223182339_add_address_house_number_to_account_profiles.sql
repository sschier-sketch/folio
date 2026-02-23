/*
  # Split address_street into street and house_number in account_profiles

  1. Changes
    - Add `address_house_number` column to `account_profiles`
    - This separates the house number from the street field
    - Existing data in `address_street` is preserved (may contain house number inline)

  2. Notes
    - Non-destructive: only adds a new column
    - Existing data is not modified
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'account_profiles' AND column_name = 'address_house_number'
  ) THEN
    ALTER TABLE account_profiles ADD COLUMN address_house_number text;
  END IF;
END $$;
