/*
  # Teilzahlungen für Mieteingänge

  1. Änderungen
    - Fügt `paid_amount` Spalte hinzu (Betrag der bereits gezahlt wurde)
    - Fügt `payment_status` Spalte hinzu (paid, partial, unpaid)
    - Fügt `partial_payments` JSONB Spalte hinzu für Historie der Teilzahlungen

  2. Sicherheit
    - Keine Änderungen an RLS-Richtlinien erforderlich
*/

-- Add paid_amount column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payments' AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN paid_amount numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add payment_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payments' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'partial', 'unpaid'));
  END IF;
END $$;

-- Add partial_payments column for history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rent_payments' AND column_name = 'partial_payments'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN partial_payments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Update existing records: set payment_status based on paid field
UPDATE rent_payments 
SET payment_status = CASE 
  WHEN paid = true THEN 'paid'
  ELSE 'unpaid'
END,
paid_amount = CASE
  WHEN paid = true THEN amount
  ELSE 0
END
WHERE payment_status IS NULL OR payment_status = 'unpaid';