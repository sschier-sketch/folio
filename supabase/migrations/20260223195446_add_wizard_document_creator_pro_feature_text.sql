/*
  # Add PRO feature text for Wizard Document Creator

  1. New Data
    - `pro_feature_texts` row for `wizard_document_creator`
      - Page: templates, Tab: wizard
      - Title: "Dokument erstellen"
      - Description: Explains the wizard feature
      - Features: List of benefits
  2. Notes
    - Used by PremiumUpgradePrompt on the Vorlagen page for Basic users
*/

INSERT INTO pro_feature_texts (feature_key, page, tab, title, description, features, is_active)
VALUES (
  'wizard_document_creator',
  'templates',
  'wizard',
  'Dokument erstellen',
  'Erstellen Sie rechtssichere Dokumente wie Kündigungsbestätigungen, Mieterhöhungen und mehr – automatisch ausgefüllt mit Ihren Daten.',
  '["Automatisches Ausfüllen mit Vermieter- & Mieterdaten", "Rechtssichere Vorlagen von Experten erstellt", "PDF-Erstellung & direkter E-Mail-Versand", "Dokumente werden automatisch gespeichert"]'::jsonb,
  true
)
ON CONFLICT (feature_key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;
