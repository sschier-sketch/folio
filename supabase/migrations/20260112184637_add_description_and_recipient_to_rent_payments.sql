/*
  # Erweiterung der rent_payments Tabelle

  1. Änderungen
    - Hinzufügen von `description` (text) - Beschreibung der Einnahme
    - Hinzufügen von `recipient` (text) - Name des Zahlers
    - Hinzufügen von `payment_method` (text) - Zahlungsart (bank_transfer, cash, debit, etc.)

  2. Security
    - Keine Änderungen an RLS-Policies notwendig
*/

-- Add description column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payments' AND column_name = 'description'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN description text;
  END IF;
END $$;

-- Add recipient column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payments' AND column_name = 'recipient'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN recipient text;
  END IF;
END $$;

-- Add payment_method column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payments' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN payment_method text DEFAULT 'bank_transfer';
  END IF;
END $$;
