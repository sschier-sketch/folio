/*
  # Add billing Pro plan card text to pro_feature_texts

  1. New Data
    - Inserts a new `pro_feature_texts` row with key `billing_pro_plan`
    - Page: billing, Tab: pro_plan
    - Contains description and feature bullet points for the Pro plan pricing card

  2. Notes
    - Uses INSERT ... ON CONFLICT to avoid duplicates
    - Text is admin-editable via the Pro-Feature admin panel
*/

INSERT INTO pro_feature_texts (page, tab, feature_key, title, description, features, is_active)
VALUES (
  'billing',
  'pro_plan',
  'billing_pro_plan',
  'Rentably Pro',
  'Ideal für professionelle Verwalter',
  '["Bis zu 20 Immobilien", "Unbegrenzt Mieter", "Erweiterte Finanzanalysen", "Prioritäts-Ticketsystem", "Premium Mieterportal", "Prioritäts-Support (24h)", "Detaillierte Reports & Statistiken", "Automatische Erinnerungen", "Export-Funktionen"]',
  true
)
ON CONFLICT (feature_key) DO NOTHING;