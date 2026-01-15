/*
  # Erweitere income_entries mit Feldern wie bei expenses

  1. Änderungen
    - Erstelle `income_categories` Tabelle ähnlich wie `expense_categories`
    - Füge `category_id` zu `income_entries` hinzu (statt text category)
    - Füge `due_date` zu `income_entries` hinzu
    - Füge `recipient` zu `income_entries` hinzu
    - Füge `is_cashflow_relevant` zu `income_entries` hinzu (boolean, default true)

  2. Security
    - Enable RLS für `income_categories`
    - Policies für authenticated users

  3. Hinweise
    - Bestehende `category` Spalte wird durch `category_id` ersetzt
    - Standardkategorien werden automatisch erstellt
*/

-- 1. Erstelle income_categories Tabelle
CREATE TABLE IF NOT EXISTS income_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  color text,
  sort_order integer DEFAULT 0,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Füge neue Felder zu income_entries hinzu
DO $$
BEGIN
  -- category_id hinzufügen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income_entries' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE income_entries ADD COLUMN category_id uuid REFERENCES income_categories(id) ON DELETE SET NULL;
  END IF;

  -- due_date hinzufügen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income_entries' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE income_entries ADD COLUMN due_date date;
  END IF;

  -- recipient hinzufügen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income_entries' AND column_name = 'recipient'
  ) THEN
    ALTER TABLE income_entries ADD COLUMN recipient text;
  END IF;

  -- is_cashflow_relevant hinzufügen
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income_entries' AND column_name = 'is_cashflow_relevant'
  ) THEN
    ALTER TABLE income_entries ADD COLUMN is_cashflow_relevant boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- 3. Füge Standard-Kategorien für Einnahmen hinzu
INSERT INTO income_categories (name, description, is_system, sort_order) VALUES
  ('Mieteinnahme', 'Reguläre Mieteinnahmen', true, 1),
  ('Nebenkostenabrechnung', 'Nachzahlungen aus Nebenkostenabrechnungen', true, 2),
  ('Kautionsrückzahlung', 'Rückzahlungen von Kautionen', true, 3),
  ('Steuerrückerstattung', 'Erstattungen vom Finanzamt', true, 4),
  ('Versicherungsleistung', 'Zahlungen von Versicherungen', true, 5),
  ('Parkplatzvermietung', 'Einnahmen aus Stellplatzvermietung', true, 6),
  ('Gewerbevermietung', 'Einnahmen aus Gewerbevermietung', true, 7),
  ('Sonderzahlung', 'Einmalige Sonderzahlungen', true, 8),
  ('Fördermittel', 'Zuschüsse und Fördermittel', true, 9),
  ('Sonstiges', 'Sonstige Einnahmen', true, 10)
ON CONFLICT (name) DO NOTHING;

-- 4. Erstelle Index für category_id
CREATE INDEX IF NOT EXISTS idx_income_entries_category_id ON income_entries(category_id);

-- 5. RLS für income_categories
ALTER TABLE income_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view income categories"
  ON income_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage income categories"
  ON income_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );