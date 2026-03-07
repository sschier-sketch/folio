/*
  # Add Pro Feature Text for User Management (Benutzerverwaltung)

  1. New Data
    - Inserts a pro_feature_texts entry for the user management page
    - feature_key: users_management
    - Describes the multi-user / team management capabilities

  2. Purpose
    - Shown in the PremiumFeatureGuard when non-Pro users access Benutzerverwaltung
    - Listed in the Admin Pro-Features overview
*/

INSERT INTO pro_feature_texts (page, tab, feature_key, title, description, features, is_active)
VALUES (
  'settings',
  'users',
  'users_management',
  'Benutzerverwaltung',
  'Verwalten Sie Ihr Team und steuern Sie den Zugriff auf Ihre Immobiliendaten. Laden Sie Mitarbeiter oder Verwalter ein und vergeben Sie individuelle Berechtigungen.',
  '["Teammitglieder einladen und verwalten", "Individuelle Rollen und Berechtigungen vergeben", "Zugriff auf einzelne Bereiche steuern", "Aktivitäten und Änderungen nachverfolgen", "Mehrbenutzerzugriff auf alle Immobiliendaten", "Sichere Trennung zwischen Kontoinhaber und Teammitgliedern"]'::jsonb,
  true
)
ON CONFLICT (feature_key) DO NOTHING;
