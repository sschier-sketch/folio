/*
  # Add Pro Feature Text for Messages

  1. New Data
    - Insert pro_feature_texts entry for the Messages overview page
    - feature_key: `messages_overview`
    - Contains title, description, and feature list for the upgrade prompt

  2. Purpose
    - Provides admin-manageable text for the Pro upgrade prompt shown
      to Basic users when they access the Messages section
*/

INSERT INTO pro_feature_texts (page, tab, feature_key, title, description, features, is_active)
VALUES (
  'messages',
  'overview',
  'messages_overview',
  'Nachrichten - Pro Feature',
  'Verwalten Sie Ihre gesamte Mieterkommunikation direkt in Rentably. Empfangen und senden Sie E-Mails, organisieren Sie Konversationen und behalten Sie den Ueberblick.',
  '["Eigene E-Mail-Adresse (@rentab.ly) fuer Ihre Immobilienverwaltung", "E-Mails direkt aus Rentably senden und empfangen", "Automatische Zuordnung von Nachrichten zu Mietern", "Vorlagen fuer wiederkehrende Nachrichten erstellen", "Uebersichtlicher Posteingang mit Ordnerstruktur", "Nachrichtenverlauf pro Mieter nachvollziehbar"]'::jsonb,
  true
)
ON CONFLICT (feature_key) DO NOTHING;
