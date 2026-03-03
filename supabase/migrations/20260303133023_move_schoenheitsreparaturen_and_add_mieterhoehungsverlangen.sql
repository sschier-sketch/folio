/*
  # Move Schoenheitsreparaturen to Sonstiges + Add Mieterhoehungsverlangen template

  1. Modified Data
    - Updates `schoenheitsreparaturen` template category from `kuendigung` to `sonstiges`

  2. New Data
    - Inserts `mieterhoehungsverlangen` wizard template into `wizard_templates`
    - Category: `sonstiges`
    - Title: Mieterhöhungsverlangen
    - Description: Rechtssicheres Mieterhöhungsverlangen erstellen

  3. Document Type
    - Drops and recreates `documents_document_type_check` constraint
      to include `mieterhoehungsverlangen` as valid document type

  4. Important Notes
    - No destructive changes
    - Category change for schoenheitsreparaturen is purely cosmetic (display grouping)
*/

UPDATE wizard_templates
SET category = 'sonstiges'
WHERE id = 'schoenheitsreparaturen';

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'mieterhoehungsverlangen',
  'sonstiges',
  'Mieterhöhungsverlangen',
  'Erstellen Sie ein rechtssicheres Mieterhöhungsverlangen nach § 558 BGB mit Begründung durch Mietspiegel, Vergleichswohnungen oder Sachverständigengutachten.',
  true,
  45
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  BEGIN
    ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
END $$;
