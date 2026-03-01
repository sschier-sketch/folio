/*
  # Add Kündigung nach Abmahnung wizard template

  1. New Data
    - Inserts `kuendigung_abmahnung` entry into `wizard_templates` table
    - Category: `kuendigung`
    - Title: Fristlose Kündigung nach Abmahnung
    - Sort order: 8 (between Räumungsaufforderung at 5 and Kündigungsbestätigung at 10)

  2. Important Notes
    - No destructive changes, purely additive
    - The wizard template ID `kuendigung_abmahnung` maps to the frontend component
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'kuendigung_abmahnung',
  'kuendigung',
  'Kündigung nach Abmahnung',
  'Erstellen Sie eine fristlose Kündigung nach erfolgloser Abmahnung gemäß § 543 BGB mit allen rechtlich erforderlichen Hinweisen.',
  true,
  8
)
ON CONFLICT (id) DO NOTHING;
