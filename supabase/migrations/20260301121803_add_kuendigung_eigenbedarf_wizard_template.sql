/*
  # Add Kündigung wegen Eigenbedarf wizard template

  1. New Data
    - Inserts `kuendigung_eigenbedarf` entry into `wizard_templates` table
    - Category: `kuendigung`
    - Title: Kündigung wegen Eigenbedarf
    - Sort order: 9

  2. Important Notes
    - No destructive changes, purely additive
    - The wizard template ID `kuendigung_eigenbedarf` maps to the frontend component
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'kuendigung_eigenbedarf',
  'kuendigung',
  'Kündigung wegen Eigenbedarf',
  'Erstellen Sie eine Kündigung wegen Eigenbedarfs gemäß §§ 573 Abs. 1, 573 Abs. 2 Nr. 2 BGB mit allen rechtlich erforderlichen Hinweisen.',
  true,
  9
)
ON CONFLICT (id) DO NOTHING;
