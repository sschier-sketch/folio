/*
  # Finanzen-Modul erweitern

  1. Neue Tabelle
    - `income_entries` - Sonstige Einnahmen (zusätzlich zu Mieteinnahmen)
      - Kategorien: Nebenkostenabrechnung, Kaution-Rückzahlung, Sonstiges

  2. Erweiterte Tabelle
    - `expenses` - Bestehende Tabelle erweitern um:
      - `unit_id` - Zuordnung zu Einheit
      - `recipient` - Empfänger/Lieferant
      - `is_apportionable` - Umlagefähig (Nebenkosten)
      - `exclude_from_operating_costs` - In NK-Abrechnung ignorieren
      - `is_cashflow_relevant` - Für Cashflow-Berechnung relevant
      - `due_date` - Fälligkeitsdatum
      - `document_id` - Verknüpfung zu Belegen

  3. Neue Tabelle
    - `expense_splits` - Split-Buchungen für Ausgaben
*/

-- 1. Sonstige Einnahmen erstellen
CREATE TABLE IF NOT EXISTS income_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES property_units(id) ON DELETE SET NULL,
  entry_date date NOT NULL,
  amount decimal(10,2) NOT NULL,
  category text NOT NULL DEFAULT 'Sonstiges',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'verbucht' CHECK (status IN ('verbucht', 'offen', 'ungeklärt', 'archiviert')),
  notes text,
  document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Expenses Tabelle erweitern
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'unit_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN unit_id uuid REFERENCES property_units(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'recipient'
  ) THEN
    ALTER TABLE expenses ADD COLUMN recipient text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'is_apportionable'
  ) THEN
    ALTER TABLE expenses ADD COLUMN is_apportionable boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'exclude_from_operating_costs'
  ) THEN
    ALTER TABLE expenses ADD COLUMN exclude_from_operating_costs boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'is_cashflow_relevant'
  ) THEN
    ALTER TABLE expenses ADD COLUMN is_cashflow_relevant boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE expenses ADD COLUMN due_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'document_id'
  ) THEN
    ALTER TABLE expenses ADD COLUMN document_id uuid REFERENCES documents(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Split-Buchungen für Ausgaben
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES property_units(id) ON DELETE SET NULL,
  category text NOT NULL,
  amount decimal(10,2) NOT NULL,
  is_apportionable boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_income_entries_user_id ON income_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_income_entries_entry_date ON income_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_income_entries_property_id ON income_entries(property_id);
CREATE INDEX IF NOT EXISTS idx_income_entries_status ON income_entries(status);

CREATE INDEX IF NOT EXISTS idx_expenses_unit_id ON expenses(unit_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON expense_splits(expense_id);

-- RLS Policies für income_entries
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own income entries"
  ON income_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own income entries"
  ON income_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own income entries"
  ON income_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own income entries"
  ON income_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies für expense_splits
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expense splits"
  ON expense_splits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own expense splits"
  ON expense_splits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own expense splits"
  ON expense_splits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND expenses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own expense splits"
  ON expense_splits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM expenses
      WHERE expenses.id = expense_splits.expense_id
      AND expenses.user_id = auth.uid()
    )
  );