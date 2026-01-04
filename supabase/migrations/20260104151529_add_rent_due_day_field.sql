/*
  # Add rent due day field to rental contracts

  1. Changes to Tables
    - `rental_contracts`
      - Add `rent_due_day` (integer) - Tag des Monats, an dem die Miete fällig ist (1-31)

  2. Notes
    - Optional field, defaults to 1 (first day of month)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'rent_due_day'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN rent_due_day integer DEFAULT 1 CHECK (rent_due_day >= 1 AND rent_due_day <= 31);
  END IF;
END $$;