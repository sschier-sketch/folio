/*
  # Add Anlage V Pro Feature Text

  1. Changes
    - Insert pro_feature_texts entry for finances_anlage_v
    - This text is displayed when free users try to access the Anlage V tab

  2. Notes
    - Feature key: finances_anlage_v
    - Page: finances, Tab: anlage_v
*/

INSERT INTO public.pro_feature_texts (page, tab, feature_key, title, description, features, is_active)
VALUES (
  'finances',
  'anlage_v',
  'finances_anlage_v',
  'Anlage V - Steuerhelfer',
  'Erstelle automatisch eine Jahresuebersicht deiner Vermietungs-Einnahmen und -Ausgaben als Grundlage fuer deine Steuererklaerung.',
  '["Automatische Zusammenfassung aller Mieteinnahmen nach Zuflussprinzip", "Uebersicht aller Ausgaben nach Abflussprinzip", "Export als PDF und CSV fuer deinen Steuerberater", "Filterbar nach Immobilie, Einheit und Steuerjahr", "Eigentumsanteil-Berechnung fuer Miteigentum"]'::jsonb,
  true
)
ON CONFLICT (feature_key) DO NOTHING;
