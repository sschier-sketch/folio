/*
  # Add payment_type to rent_payments

  1. Changes
    - Added `payment_type` (text, NOT NULL, default 'rent') to `rent_payments`
      - 'rent' = regular monthly rent (existing behavior)
      - 'nebenkosten' = operating cost back-payment (Nachzahlung from Betriebskostenabrechnung)
    - Added CHECK constraint for valid payment_type values
    - Added `operating_cost_statement_id` (uuid, nullable) for linking Nebenkosten entries back to their source statement
    - Added index on `payment_type` for efficient filtering
    - Added index on `operating_cost_statement_id` for lookups

  2. Notes
    - All existing rows default to 'rent', no data changes
    - Dunning, partial payments, status calculation all work automatically
    - Nebenkosten entries appear in the same Mieteingänge view with a filter option
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payments' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN payment_type text NOT NULL DEFAULT 'rent';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payments' AND column_name = 'operating_cost_statement_id'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN operating_cost_statement_id uuid REFERENCES operating_cost_statements(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rent_payments_payment_type_check'
  ) THEN
    ALTER TABLE rent_payments
      ADD CONSTRAINT rent_payments_payment_type_check
      CHECK (payment_type IN ('rent', 'nebenkosten'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rent_payments_payment_type
  ON rent_payments(payment_type);

CREATE INDEX IF NOT EXISTS idx_rent_payments_operating_cost_statement
  ON rent_payments(operating_cost_statement_id)
  WHERE operating_cost_statement_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rent_payments_due_date
  ON rent_payments(due_date);

CREATE INDEX IF NOT EXISTS idx_rent_payments_payment_status
  ON rent_payments(payment_status);
