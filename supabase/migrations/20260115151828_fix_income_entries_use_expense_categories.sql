/*
  # Korrektur: income_entries nutzt expense_categories

  1. Änderungen
    - Entferne income_categories Tabelle
    - Ändere income_entries.category_id Referenz auf expense_categories
    - Füge fehlende Felder hinzu:
      - vat_rate (decimal) - MwSt-Satz
      - is_apportionable (boolean) - Umlagefähig
      - is_labor_cost (boolean) - Lohnkosten
      - ignore_in_operating_costs (boolean) - Ignoriert in BK-Abr.

  2. Hinweise
    - Einnahmen und Ausgaben nutzen die gleichen Kategorien
    - Alle neuen Felder haben sinnvolle Defaults
*/

-- 1. Lösche income_categories Tabelle falls vorhanden
DROP TABLE IF EXISTS income_categories CASCADE;

-- 2. Ändere category_id Constraint in income_entries
DO $$
BEGIN
  -- Entferne alte Constraint falls vorhanden
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'income_entries_category_id_fkey'
    AND table_name = 'income_entries'
  ) THEN
    ALTER TABLE income_entries DROP CONSTRAINT income_entries_category_id_fkey;
  END IF;

  -- Füge neue Constraint hinzu die auf expense_categories zeigt
  ALTER TABLE income_entries 
    ADD CONSTRAINT income_entries_category_id_fkey 
    FOREIGN KEY (category_id) 
    REFERENCES expense_categories(id) 
    ON DELETE SET NULL;
END $$;

-- 3. Füge neue Felder zu income_entries hinzu
DO $$
BEGIN
  -- vat_rate
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income_entries' AND column_name = 'vat_rate'
  ) THEN
    ALTER TABLE income_entries ADD COLUMN vat_rate decimal(5,2) DEFAULT 0.00;
  END IF;

  -- is_apportionable
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income_entries' AND column_name = 'is_apportionable'
  ) THEN
    ALTER TABLE income_entries ADD COLUMN is_apportionable boolean DEFAULT false NOT NULL;
  END IF;

  -- is_labor_cost
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income_entries' AND column_name = 'is_labor_cost'
  ) THEN
    ALTER TABLE income_entries ADD COLUMN is_labor_cost boolean DEFAULT false NOT NULL;
  END IF;

  -- ignore_in_operating_costs
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'income_entries' AND column_name = 'ignore_in_operating_costs'
  ) THEN
    ALTER TABLE income_entries ADD COLUMN ignore_in_operating_costs boolean DEFAULT false NOT NULL;
  END IF;
END $$;
