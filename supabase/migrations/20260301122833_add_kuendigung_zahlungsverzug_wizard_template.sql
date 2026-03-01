/*
  # Add Kündigung wegen Zahlungsverzug wizard template

  1. New Data
    - Inserts `kuendigung_zahlungsverzug` entry into `wizard_templates` table
    - Category: `kuendigung`
    - Title: Kündigung wegen Zahlungsverzug
    - Sort order: 7

  2. Important Notes
    - No destructive changes, purely additive
    - The wizard template ID `kuendigung_zahlungsverzug` maps to the frontend component
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'kuendigung_zahlungsverzug',
  'kuendigung',
  'Kündigung wegen Zahlungsverzug',
  'Erstellen Sie eine fristlose Kündigung wegen Zahlungsverzug gemäß § 543 BGB mit Auflistung der offenen Zahlungen.',
  true,
  7
)
ON CONFLICT (id) DO NOTHING;
