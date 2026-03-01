/*
  # Add Wohnungsgeberbestätigung wizard template

  1. New Data
    - Inserts `wohnungsgeberbestaetigung` into `wizard_templates`
    - Category: `kuendigung`
    - Title: Wohnungsgeberbestätigung
    - Sort order: 11

  2. Important Notes
    - Purely additive, no destructive changes
    - The template ID maps to the frontend WohnungsgeberbestaetigungWizard component
    - Official form per § 19 BMG
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'wohnungsgeberbestaetigung',
  'kuendigung',
  'Wohnungsgeberbestätigung',
  'Erstellen Sie eine Wohnungsgeberbestätigung nach § 19 BMG über den Einzug oder Auszug Ihrer Mieter.',
  true,
  11
)
ON CONFLICT (id) DO NOTHING;
