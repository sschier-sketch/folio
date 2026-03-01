/*
  # Add Meldebestätigung wizard template

  1. New Data
    - Inserts `meldebestaetigung` entry into `wizard_templates` table
    - Category: `sonstiges`
    - Title: Meldebestätigung (Wohnungsgeberbestätigung)
    - Sort order: 10

  2. Important Notes
    - No destructive changes, purely additive
    - The wizard template ID `meldebestaetigung` maps to the frontend component
    - This is the official Wohnungsgeberbestätigung nach § 19 BMG
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'meldebestaetigung',
  'sonstiges',
  'Meldebestätigung (Wohnungsgeberbestätigung)',
  'Erstellen Sie eine Wohnungsgeberbestätigung nach § 19 BMG für den Ein- oder Auszug Ihrer Mieter.',
  true,
  10
)
ON CONFLICT (id) DO NOTHING;
