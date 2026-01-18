/*
  # Insert Initial Pro Feature Texts

  1. Inserts
    - Insert all existing pro feature texts from the application
*/

INSERT INTO pro_feature_texts (feature_key, page, tab, title, description, features) VALUES
(
  'rent_payments_dunning',
  'rent_payments',
  'dunning',
  'Mahnwesen',
  'Automatisieren Sie Ihr Mahnwesen und behalten Sie ausstehende Mietzahlungen im Blick. Versenden Sie professionelle Zahlungserinnerungen mit nur einem Klick.',
  '["Automatische Mahnstufen mit individuellen Fristen", "Professionelle Mahnvorlagen gemäß gesetzlicher Vorgaben", "Tracking aller versendeten Mahnungen pro Mieter", "Automatische Berechnung von Mahngebühren und Verzugszinsen", "Übersicht über kritische Zahlungsverzüge", "Export aller Mahnungen für Ihre Buchhaltung"]'::jsonb
),
(
  'tenant_details_contract',
  'tenant_details',
  'contract',
  'Vertrag & Dokumente',
  'Verwalten Sie alle Vertrags- und Dokumentendaten zentral an einem Ort. Laden Sie Verträge, Übergabeprotokolle und weitere wichtige Dokumente hoch.',
  '["Digitale Verwaltung aller Mietverträge", "Upload und Archivierung von Dokumenten pro Mieter", "Automatische Erinnerungen für Vertragsfristen", "Sichere Speicherung mit Zugriffsprotokollen", "Schnelles Auffinden durch intelligente Suche", "Export für rechtliche Zwecke"]'::jsonb
),
(
  'tenant_details_communication',
  'tenant_details',
  'communication',
  'Kommunikation',
  'Führen Sie alle Kommunikation mit Ihren Mietern an einem zentralen Ort. Behalten Sie den Überblick über alle Nachrichten, Anfragen und Vereinbarungen.',
  '["Zentraler Posteingang für alle Mieter-Nachrichten", "Nachrichtenverlauf mit vollständiger Historie", "Anhänge für Dokumente und Bilder", "Automatische Benachrichtigungen bei neuen Nachrichten", "Suchfunktion für vergangene Konversationen", "Rechtssichere Dokumentation aller Kommunikation"]'::jsonb
),
(
  'tenant_details_handover',
  'tenant_details',
  'handover',
  'Übergabe & Wechsel',
  'Dokumentieren Sie Wohnungsübergaben professionell mit digitalen Übergabeprotokollen. Halten Sie den Zustand der Immobilie bei Ein- und Auszug fest.',
  '["Digitale Übergabeprotokolle mit Fotos", "Raumweise Dokumentation des Zustands", "Automatische Erinnerungen für Übergabetermine", "Vergleich zwischen Ein- und Auszugsprotokoll", "Rechtssichere PDF-Exports", "Nachvollziehbare Historie aller Übergaben"]'::jsonb
),
(
  'finances_cashflow',
  'finances',
  'cashflow',
  'Cashflow-Übersicht',
  'Behalten Sie Ihre Liquidität im Blick mit detaillierten Cashflow-Analysen. Verstehen Sie Ihre Ein- und Auszahlungsströme und optimieren Sie Ihre finanzielle Planung.',
  '["Monatliche und jährliche Cashflow-Übersichten", "Visualisierung von Ein- und Auszahlungen", "Prognosen für zukünftige Cashflows", "Automatische Kategorisierung aller Transaktionen", "Export für Steuerberater und Buchhaltung", "Kennzahlen zur Liquiditätsplanung"]'::jsonb
),
(
  'finances_indexrent',
  'finances',
  'indexrent',
  'Indexmiete',
  'Passen Sie Ihre Mieten automatisch an die Inflation an. Berechnen Sie gesetzeskonforme Mietanpassungen auf Basis des Verbraucherpreisindex.',
  '["Automatische Berechnung nach aktuellem VPI", "Gesetzeskonforme Mieterhöhungsvorlagen", "Historie aller Indexanpassungen", "Fristen-Tracking für Mieterhöhungen", "Automatische Benachrichtigungen bei möglichen Anpassungen", "Dokumentation für rechtliche Zwecke"]'::jsonb
)
ON CONFLICT (feature_key) DO NOTHING;
