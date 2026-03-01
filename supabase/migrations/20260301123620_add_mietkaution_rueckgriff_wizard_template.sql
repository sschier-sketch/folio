/*
  # Add Mietkaution Rückgriff wizard template

  1. New Data
    - Inserts `mietkaution_rueckgriff` entry into `wizard_templates` table
    - Category: `kuendigung`
    - Title: Rückgriff auf Mietkaution wegen Mietrückstand
    - Sort order: 8

  2. Important Notes
    - No destructive changes, purely additive
    - The wizard template ID `mietkaution_rueckgriff` maps to the frontend component
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'mietkaution_rueckgriff',
  'kuendigung',
  'Rückgriff auf Mietkaution wegen Mietrückstand',
  'Erstellen Sie eine Abrechnung der Mietkaution mit Aufrechnung gegen offene Forderungen wie Mietrückstand, Schadensersatz und Betriebskostennachzahlung.',
  true,
  8
)
ON CONFLICT (id) DO NOTHING;
