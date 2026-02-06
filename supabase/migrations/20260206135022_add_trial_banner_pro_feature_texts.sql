/*
  # Add Trial Banner Pro Feature Texts

  1. New Data
    - `trial_banner_active` - Editable text for the active trial banner on the Dashboard
    - `trial_banner_expired` - Editable text for the expired trial banner on the Dashboard
    - `billing_trial_active` - Editable text for the active trial box in Tarif & Abrechnungen
    - `billing_trial_expired` - Editable text for the expired trial box in Tarif & Abrechnungen

  2. Notes
    - The `features` array on `trial_banner_active` stores the button text as the first element
    - The `features` array on `billing_trial_active` stores the feature bullet points
    - Descriptions support `{date}` placeholder for trial end date
*/

INSERT INTO pro_feature_texts (page, tab, feature_key, title, description, features, is_active)
VALUES
  (
    'dashboard',
    'trial_banner',
    'trial_banner_active',
    'Gratis-Testphase aktiv',
    'Sie haben vollen Zugriff auf alle Pro-Features bis zum {date}. Upgraden Sie jetzt, um alle Funktionen dauerhaft zu nutzen.',
    '["Jetzt auf Pro upgraden"]',
    true
  ),
  (
    'dashboard',
    'trial_banner',
    'trial_banner_expired',
    'Gratis-Testphase beendet',
    'Ihre Gratis-Testphase ist abgelaufen. Upgrade auf Pro, um alle Funktionen weiter zu nutzen.',
    '["Jetzt auf Pro upgraden"]',
    true
  ),
  (
    'billing',
    'trial_banner',
    'billing_trial_active',
    'Gratis-Testphase aktiv',
    'Sie haben vollen Zugriff auf alle Pro-Features bis zum {date}. Upgraden Sie jetzt, um alle Funktionen nach Ende der Testphase weiter zu nutzen.',
    '["Unbegrenzte Objekte und Mieter", "Ticketsystem und Mieterkommunikation", "Finanzanalysen und Renditeberechnung"]',
    true
  ),
  (
    'billing',
    'trial_banner',
    'billing_trial_expired',
    'Gratis-Testphase beendet',
    'Ihre Gratis-Testphase ist am {date} abgelaufen. Upgrade auf Pro, um alle Funktionen weiter zu nutzen.',
    '[]',
    true
  )
ON CONFLICT (feature_key) DO NOTHING;