/*
  # Insert Property Pro Feature Texts

  1. Inserts
    - Insert all property-related pro feature texts
*/

INSERT INTO pro_feature_texts (feature_key, page, tab, title, description, features) VALUES
(
  'property_history',
  'property',
  'history',
  'Änderungshistorie',
  'Behalten Sie den Überblick über alle Änderungen an Ihrer Immobilie. Dokumentieren Sie automatisch alle wichtigen Ereignisse und Anpassungen.',
  '["Einheit angelegt / geändert", "Mieterwechsel dokumentiert", "Mieterhöhungen nachvollziehen", "Abrechnungen erstellt", "Änderungsprotokoll (wer / wann)"]'::jsonb
),
(
  'property_documents',
  'property',
  'documents',
  'Dokumentenverwaltung',
  'Verwalten Sie alle objektbezogenen Dokumente zentral an einem Ort. Von Grundrissen über Energieausweise bis hin zu Versicherungsunterlagen.',
  '["Upload von Grundrissen und Plänen", "Energieausweise digital hinterlegen", "Versicherungsunterlagen zentral verwalten", "Alle objektbezogenen Dokumente an einem Ort"]'::jsonb
),
(
  'property_contacts',
  'property',
  'contacts',
  'Kontaktverwaltung',
  'Verwalten Sie alle wichtigen Kontakte zu Ihrer Immobilie zentral. Von Hausmeistern über Handwerker bis zu Eigentümern bei Verwaltung.',
  '["Hausmeister-Kontakte zentral verwalten", "Dienstleister und Handwerker hinterlegen", "Eigentümer-Daten bei Verwaltung", "Schneller Zugriff auf alle wichtigen Kontakte"]'::jsonb
),
(
  'property_maintenance',
  'property',
  'maintenance',
  'Instandhaltung',
  'Planen und dokumentieren Sie alle Wartungen und Instandhaltungsmaßnahmen. Behalten Sie Kosten im Blick und verknüpfen Sie Ausgaben mit Belegen.',
  '["Aufgaben je Immobilie verwalten", "Wiederkehrende Wartungen planen", "Kosten erfassen und dokumentieren", "Verknüpfung mit Ausgaben und Belegen"]'::jsonb
),
(
  'property_metrics',
  'property',
  'metrics',
  'Kennzahlen & Analysen',
  'Analysieren Sie die Performance Ihrer Immobilie mit aussagekräftigen Kennzahlen. Von Miete pro m² bis zur ROI-Berechnung.',
  '["Miete pro m² und Leerstandsquote", "Kostenquote und ROI-Berechnung", "Vergleich Vormonat und Vorjahr", "Visuelle Auswertungen und Diagramme"]'::jsonb
)
ON CONFLICT (feature_key) DO NOTHING;
