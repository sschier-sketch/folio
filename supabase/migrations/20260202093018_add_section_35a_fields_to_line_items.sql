/*
  # Erweiterung der Betriebskosten-Positionen um §35a EStG Felder

  1. Neue Spalten in operating_cost_line_items
    - `is_section_35a` (boolean): Markiert, ob die Position steuerlich nach §35a EStG relevant ist
    - `section_35a_category` (text): Kategorie der steuerlichen Absetzbarkeit
      - "haushaltsnahe_dienstleistungen" für haushaltsnahe Dienstleistungen
      - "handwerkerleistungen" für Handwerkerleistungen
      - NULL wenn is_section_35a = false

  2. Änderungen
    - Standardwerte: is_section_35a = false, section_35a_category = NULL
    - Check Constraint: section_35a_category kann nur gesetzt werden, wenn is_section_35a = true
    - Enum-ähnliche Validierung für section_35a_category

  3. Hinweise
    - Haushaltsnahe Dienstleistungen: max. 20% von 20.000€ = 4.000€/Jahr steuerlich absetzbar
    - Handwerkerleistungen: max. 20% von 6.000€ = 1.200€/Jahr steuerlich absetzbar
*/

ALTER TABLE operating_cost_line_items
ADD COLUMN IF NOT EXISTS is_section_35a boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS section_35a_category text;

ALTER TABLE operating_cost_line_items
DROP CONSTRAINT IF EXISTS check_section_35a_category_valid;

ALTER TABLE operating_cost_line_items
ADD CONSTRAINT check_section_35a_category_valid
CHECK (
  section_35a_category IS NULL OR
  section_35a_category IN ('haushaltsnahe_dienstleistungen', 'handwerkerleistungen')
);

ALTER TABLE operating_cost_line_items
DROP CONSTRAINT IF EXISTS check_section_35a_category_requires_flag;

ALTER TABLE operating_cost_line_items
ADD CONSTRAINT check_section_35a_category_requires_flag
CHECK (
  (is_section_35a = false AND section_35a_category IS NULL) OR
  (is_section_35a = true)
);

COMMENT ON COLUMN operating_cost_line_items.is_section_35a IS 'Markiert, ob die Kostenposition nach §35a EStG steuerlich absetzbar ist';
COMMENT ON COLUMN operating_cost_line_items.section_35a_category IS 'Kategorie für §35a EStG: haushaltsnahe_dienstleistungen oder handwerkerleistungen';
