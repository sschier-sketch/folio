/*
  # Add billing upgrade prompt to pro_feature_texts

  1. New Data
    - Inserts a new `pro_feature_texts` row with key `billing_upgrade_prompt`
    - Page: billing, Tab: upgrade
    - Contains title, description, and feature bullet points for the upgrade box on the billing page

  2. Notes
    - Uses INSERT ... ON CONFLICT to avoid duplicates
    - Text is admin-editable via the Pro-Feature admin panel
*/

INSERT INTO pro_feature_texts (page, tab, feature_key, title, description, features, is_active)
VALUES (
  'billing',
  'upgrade',
  'billing_upgrade_prompt',
  'Schalten Sie Ihr volles Potenzial frei!',
  'Sie nutzen derzeit den Basic-Tarif. Upgraden Sie auf Pro und erhalten Sie Zugriff auf alle Premium-Features für eine professionelle Immobilienverwaltung.',
  '["Unbegrenzte Objekte & Mieter", "Erweiterte Finanzen & Analysen", "Dokumente & Vorlagen", "Ticketsystem & Mieterkommunikation", "Betriebskostenabrechnung", "Alle Pro-Features"]',
  true
)
ON CONFLICT (feature_key) DO NOTHING;