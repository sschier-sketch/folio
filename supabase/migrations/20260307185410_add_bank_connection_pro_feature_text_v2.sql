/*
  # Add Bank Connection Pro Feature Text

  1. New Data
    - Adds `finances_bank` entry to `pro_feature_texts` table
    - German title and description for the bank connection feature upgrade prompt

  2. Important Notes
    - This ensures Basic users see a proper upgrade prompt when accessing the bank import feature
*/

INSERT INTO pro_feature_texts (page, tab, feature_key, title, description, features, is_active)
VALUES (
  'finances',
  'bank',
  'finances_bank',
  'Bankanbindung',
  'Importieren Sie Ihre Kontoauszüge automatisch und ordnen Sie Transaktionen Ihren Immobilien zu.',
  '["CSV- und CAMT053-Import", "Automatische Zuordnung von Mieteingängen", "Intelligente Vorschläge für Buchungen", "Import-Verlauf und Rollback-Funktion"]'::jsonb,
  true
)
ON CONFLICT (feature_key) DO NOTHING;
