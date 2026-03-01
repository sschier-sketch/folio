/*
  # Add Schönheitsreparaturen wizard template

  1. New Data
    - Inserts `schoenheitsreparaturen` entry into `wizard_templates` table
    - Category: `kuendigung`
    - Title: Aufforderung zu Schönheitsreparaturen
    - Sort order: 9

  2. Important Notes
    - No destructive changes, purely additive
    - The wizard template ID `schoenheitsreparaturen` maps to the frontend component
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'schoenheitsreparaturen',
  'kuendigung',
  'Aufforderung zu Schönheitsreparaturen',
  'Fordern Sie Ihren Mieter zur Durchführung von Schönheitsreparaturen, Instandsetzung und Rückbau auf, mit Fristsetzung und Hinweis auf Schadensersatz.',
  true,
  9
)
ON CONFLICT (id) DO NOTHING;
