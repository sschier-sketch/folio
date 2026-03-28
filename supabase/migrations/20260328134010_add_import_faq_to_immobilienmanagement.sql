/*
  # Add Excel Import FAQ to Immobilienmanagement Page

  1. Changes
    - Inserts a new FAQ entry on the `immobilienmanagement` page explaining the Excel import feature
    - Placed at sort_order 6 (after existing 5 entries)

  2. Notes
    - Highlights that users can import properties, units, and tenants from Excel
    - Mentions the availability on both the dashboard and the properties page
*/

INSERT INTO faqs (page_slug, question, answer, sort_order, is_active)
VALUES (
  'immobilienmanagement',
  'Kann ich bestehende Daten per Excel importieren?',
  'Ja. Mit der Import-Funktion können Sie Immobilien, Einheiten und Mietverhältnisse direkt aus einer Excel-Datei anlegen. Das spart Ihnen die manuelle Eingabe und ist besonders praktisch, wenn Sie bereits mehrere Objekte verwalten. Den Import starten Sie entweder über das Dashboard oder über die Schaltfläche „Importieren" auf der Immobilienseite. Eine Vorlage wird direkt im Import-Assistenten bereitgestellt.',
  6,
  true
)
ON CONFLICT DO NOTHING;
