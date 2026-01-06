/*
  # Erweiterte Kredit-Verwaltung

  1. Neue Felder für die `loans` Tabelle
    ## Zinsbindung & Fristen
    - `fixed_interest_start_date` - Beginn der Zinsbindung
    - `fixed_interest_end_date` - Ende der Zinsbindung
    - `fixed_interest_equals_loan_end` - Zinsbindung entspricht Kreditende

    ## Sondertilgung
    - `special_repayment_allowed` - Sondertilgung erlaubt (Ja/Nein)
    - `special_repayment_max_amount` - Max. Sondertilgung pro Jahr (EUR)
    - `special_repayment_max_percent` - Max. Sondertilgung pro Jahr (%)
    - `special_repayment_due_date` - Stichtag für Sondertilgung
    - `special_repayment_annual_end` - Jährlich zum Jahresende
    - `special_repayment_used_amount` - Bereits geleistete Sondertilgung

    ## Status & Verantwortung
    - `loan_status` - Status (aktiv, beendet, in Umschuldung)
    - `responsible_person` - Verantwortliche Person

  2. Neue Tabelle `loan_reminders`
    - Speichert alle Erinnerungen für Kredite
    - Typen: Zinsbindungsende, Kreditende, Sondertilgungstermin

  3. Security
    - RLS für loan_reminders aktiviert
    - Policies für authenticated users
*/

-- Erweitere die loans Tabelle mit neuen Feldern
DO $$
BEGIN
  -- Zinsbindung & Fristen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'fixed_interest_start_date'
  ) THEN
    ALTER TABLE loans ADD COLUMN fixed_interest_start_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'fixed_interest_end_date'
  ) THEN
    ALTER TABLE loans ADD COLUMN fixed_interest_end_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'fixed_interest_equals_loan_end'
  ) THEN
    ALTER TABLE loans ADD COLUMN fixed_interest_equals_loan_end boolean DEFAULT false;
  END IF;

  -- Sondertilgung
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'special_repayment_allowed'
  ) THEN
    ALTER TABLE loans ADD COLUMN special_repayment_allowed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'special_repayment_max_amount'
  ) THEN
    ALTER TABLE loans ADD COLUMN special_repayment_max_amount numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'special_repayment_max_percent'
  ) THEN
    ALTER TABLE loans ADD COLUMN special_repayment_max_percent numeric(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'special_repayment_due_date'
  ) THEN
    ALTER TABLE loans ADD COLUMN special_repayment_due_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'special_repayment_annual_end'
  ) THEN
    ALTER TABLE loans ADD COLUMN special_repayment_annual_end boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'special_repayment_used_amount'
  ) THEN
    ALTER TABLE loans ADD COLUMN special_repayment_used_amount numeric(10,2) DEFAULT 0;
  END IF;

  -- Status & Verantwortung
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'loan_status'
  ) THEN
    ALTER TABLE loans ADD COLUMN loan_status text DEFAULT 'active';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'responsible_person'
  ) THEN
    ALTER TABLE loans ADD COLUMN responsible_person text;
  END IF;
END $$;

-- Füge CHECK constraint für loan_status hinzu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'loans_loan_status_check'
  ) THEN
    ALTER TABLE loans ADD CONSTRAINT loans_loan_status_check 
    CHECK (loan_status IN ('active', 'ended', 'refinancing'));
  END IF;
END $$;

-- Erstelle loan_reminders Tabelle
CREATE TABLE IF NOT EXISTS loan_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid REFERENCES loans(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_type text NOT NULL CHECK (reminder_type IN ('fixed_interest_end', 'loan_end', 'special_repayment')),
  reminder_date date NOT NULL,
  days_before integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'dismissed')),
  sent_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_loan_reminders_loan_id ON loan_reminders(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_reminders_user_id ON loan_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_reminders_reminder_date ON loan_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_loan_reminders_status ON loan_reminders(status);

-- RLS für loan_reminders
ALTER TABLE loan_reminders ENABLE ROW LEVEL SECURITY;

-- Policies für loan_reminders
DROP POLICY IF EXISTS "Users can view own loan reminders" ON loan_reminders;
CREATE POLICY "Users can view own loan reminders"
  ON loan_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own loan reminders" ON loan_reminders;
CREATE POLICY "Users can insert own loan reminders"
  ON loan_reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own loan reminders" ON loan_reminders;
CREATE POLICY "Users can update own loan reminders"
  ON loan_reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own loan reminders" ON loan_reminders;
CREATE POLICY "Users can delete own loan reminders"
  ON loan_reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Funktion zum automatischen Erstellen von Reminders
CREATE OR REPLACE FUNCTION create_loan_reminders()
RETURNS trigger AS $$
BEGIN
  -- Lösche alte Reminders für diesen Kredit
  DELETE FROM loan_reminders WHERE loan_id = NEW.id;

  -- Erstelle Reminders für Zinsbindungsende
  IF NEW.fixed_interest_end_date IS NOT NULL THEN
    -- 180 Tage vorher
    INSERT INTO loan_reminders (loan_id, user_id, reminder_type, reminder_date, days_before)
    VALUES (NEW.id, NEW.user_id, 'fixed_interest_end', NEW.fixed_interest_end_date - INTERVAL '180 days', 180);

    -- 90 Tage vorher
    INSERT INTO loan_reminders (loan_id, user_id, reminder_type, reminder_date, days_before)
    VALUES (NEW.id, NEW.user_id, 'fixed_interest_end', NEW.fixed_interest_end_date - INTERVAL '90 days', 90);

    -- 30 Tage vorher
    INSERT INTO loan_reminders (loan_id, user_id, reminder_type, reminder_date, days_before)
    VALUES (NEW.id, NEW.user_id, 'fixed_interest_end', NEW.fixed_interest_end_date - INTERVAL '30 days', 30);
  END IF;

  -- Erstelle Reminders für Kreditende
  IF NEW.end_date IS NOT NULL THEN
    -- 90 Tage vorher
    INSERT INTO loan_reminders (loan_id, user_id, reminder_type, reminder_date, days_before)
    VALUES (NEW.id, NEW.user_id, 'loan_end', NEW.end_date - INTERVAL '90 days', 90);

    -- 30 Tage vorher
    INSERT INTO loan_reminders (loan_id, user_id, reminder_type, reminder_date, days_before)
    VALUES (NEW.id, NEW.user_id, 'loan_end', NEW.end_date - INTERVAL '30 days', 30);
  END IF;

  -- Erstelle Reminders für Sondertilgung
  IF NEW.special_repayment_allowed AND NEW.special_repayment_due_date IS NOT NULL THEN
    -- 30 Tage vorher
    INSERT INTO loan_reminders (loan_id, user_id, reminder_type, reminder_date, days_before)
    VALUES (NEW.id, NEW.user_id, 'special_repayment', NEW.special_repayment_due_date - INTERVAL '30 days', 30);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für automatische Reminder-Erstellung
DROP TRIGGER IF EXISTS trigger_create_loan_reminders ON loans;
CREATE TRIGGER trigger_create_loan_reminders
  AFTER INSERT OR UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION create_loan_reminders();
