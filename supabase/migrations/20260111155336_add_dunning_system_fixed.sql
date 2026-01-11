/*
  # Mahnwesen (Dunning System)

  1. Neue Tabellen
    - `rent_payment_reminders`
      - Tracking aller gesendeten Erinnerungen und Mahnungen
      - Mahnstufen (level 1-3)
      - Sendehistorie und Status
      - Verknüpfung mit rent_payments

  2. Erweiterungen
    - Fügt Felder zu rent_payments hinzu:
      - `dunning_level` - aktuelle Mahnstufe (0-3)
      - `last_reminder_sent` - Datum der letzten Erinnerung
      - `days_overdue` - berechnete Tage überfällig

  3. Sicherheit
    - RLS auf allen neuen Tabellen aktiviert
    - Policies für user-spezifischen Zugriff
*/

-- Tabelle für Mahnungen/Erinnerungen
CREATE TABLE IF NOT EXISTS rent_payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rent_payment_id uuid REFERENCES rent_payments(id) ON DELETE CASCADE NOT NULL,
  dunning_level integer NOT NULL DEFAULT 1 CHECK (dunning_level BETWEEN 1 AND 3),
  sent_at timestamptz DEFAULT now() NOT NULL,
  sent_via text DEFAULT 'email' NOT NULL,
  recipient_email text,
  subject text,
  message text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'bounced')),
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Erweitere rent_payments um Mahnwesen-Felder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rent_payments' AND column_name = 'dunning_level'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN dunning_level integer DEFAULT 0 NOT NULL CHECK (dunning_level BETWEEN 0 AND 3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rent_payments' AND column_name = 'last_reminder_sent'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN last_reminder_sent timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rent_payments' AND column_name = 'days_overdue'
  ) THEN
    ALTER TABLE rent_payments ADD COLUMN days_overdue integer DEFAULT 0;
  END IF;
END $$;

-- Funktion zur Berechnung der überfälligen Tage
CREATE OR REPLACE FUNCTION calculate_days_overdue(due_date date, is_paid boolean)
RETURNS integer AS $$
BEGIN
  IF is_paid THEN
    RETURN 0;
  END IF;
  
  RETURN GREATEST(0, (CURRENT_DATE - due_date));
END;
$$ LANGUAGE plpgsql;

-- Trigger zur automatischen Berechnung der days_overdue
CREATE OR REPLACE FUNCTION update_days_overdue()
RETURNS trigger AS $$
BEGIN
  NEW.days_overdue := calculate_days_overdue(NEW.due_date, NEW.paid);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS trg_update_days_overdue ON rent_payments;
  
  CREATE TRIGGER trg_update_days_overdue
  BEFORE INSERT OR UPDATE ON rent_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_days_overdue();
END $$;

-- Aktualisiere bestehende Zahlungen
UPDATE rent_payments
SET days_overdue = calculate_days_overdue(due_date, paid)
WHERE days_overdue = 0;

-- RLS aktivieren
ALTER TABLE rent_payment_reminders ENABLE ROW LEVEL SECURITY;

-- Policies für rent_payment_reminders
CREATE POLICY "Users can view own reminders"
  ON rent_payment_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON rent_payment_reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON rent_payment_reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON rent_payment_reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_rent_payment_reminders_user_id 
  ON rent_payment_reminders(user_id);
  
CREATE INDEX IF NOT EXISTS idx_rent_payment_reminders_rent_payment_id 
  ON rent_payment_reminders(rent_payment_id);
  
CREATE INDEX IF NOT EXISTS idx_rent_payment_reminders_sent_at 
  ON rent_payment_reminders(sent_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_rent_payments_dunning_level 
  ON rent_payments(dunning_level) WHERE dunning_level > 0;