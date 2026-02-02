/*
  # Add Betriebskosten Pro Feature Text

  1. New Data
    - Adds pro feature text entry for "Betriebskosten" feature
    - Page: billing
    - Tab: operating_costs
    - Feature key: billing_operating_costs
    - Includes title, description, and feature bullet points in German
  
  2. Purpose
    - Allows admin to customize the upgrade prompt text for Betriebskosten feature
    - Displays when non-pro users attempt to access operating costs
*/

INSERT INTO pro_feature_texts (feature_key, page, tab, title, description, features) VALUES
(
  'billing_operating_costs',
  'billing',
  'operating_costs',
  'Betriebskostenabrechnung',
  'Erstellen Sie professionelle Betriebskostenabrechnungen für Ihre Mieter. Sparen Sie Zeit und vermeiden Sie Fehler mit unserem intelligenten Abrechnungsassistenten.',
  '["Automatische Berechnung nach Verteilerschlüsseln", "Rechtssichere Abrechnungen gemäß Betriebskostenverordnung", "Import von Rechnungen und Belegen", "Automatische Zuordnung zu Kostenpositionen", "Export als PDF mit Mieter-Anschreiben", "Versand per E-Mail direkt aus der Software"]'::jsonb
)
ON CONFLICT (feature_key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  updated_at = now();