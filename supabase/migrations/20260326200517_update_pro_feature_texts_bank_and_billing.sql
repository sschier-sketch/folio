/*
  # Update pro feature texts for bank connection and billing plans

  1. Modified Rows
    - `finances_bank`: Updated description and features list to reflect
      new capabilities (BanksAPI/PSD2, matching rules, auto-apply,
      CAMT053, CSV import, transaction inbox, etc.)
    - `billing_pro_plan`: Added "Bankanbindung (PSD2 & CSV)" and
      "Aufgabenverwaltung & Wartungsplanung" to the Pro plan feature list
    - `billing_upgrade_prompt`: Added the same two features to the
      upgrade prompt feature list

  2. Important Notes
    - No tables created or dropped
    - Only data updates to existing rows in `pro_feature_texts`
*/

UPDATE pro_feature_texts
SET
  description = 'Verbinden Sie Ihr Bankkonto direkt über PSD2 oder importieren Sie Kontoauszüge per CSV/CAMT053. Transaktionen werden automatisch zugeordnet.',
  features = '["Automatischer Bankabruf über PSD2 (BanksAPI)", "CSV- und CAMT053-Import", "Zuordnungs-Inbox mit intelligenten Vorschlägen", "Automatische Zuordnung von Mieteingängen", "Zuordnungsregeln mit Auto-Anwendung", "Import-Historie und Rollback-Funktion", "Mehrere Bankverbindungen gleichzeitig", "Täglicher automatischer Kontoabruf"]'::jsonb,
  updated_at = now()
WHERE feature_key = 'finances_bank';

UPDATE pro_feature_texts
SET
  features = '["Unbegrenzt Immobilien, Mieter & Einheiten", "Ticketsystem & Nachrichten", "Mieterportal", "Betriebskostenabrechnung", "Mahnwesen & Indexmiete", "Cashflow & Finanzanalyse", "Bankanbindung (PSD2 & CSV)", "Aufgabenverwaltung & Wartungsplanung", "Dokumenten-Upload (erweitert)", "Alle Vorlagen inkl. Premium", "Prioritäts-Support (24h)"]'::jsonb,
  updated_at = now()
WHERE feature_key = 'billing_pro_plan';

UPDATE pro_feature_texts
SET
  features = '["Unbegrenzt Immobilien, Mieter & Einheiten", "Ticketsystem & Nachrichten", "Mieterportal", "Betriebskostenabrechnung", "Mahnwesen & Indexmiete", "Cashflow & Finanzanalyse", "Bankanbindung (PSD2 & CSV)", "Aufgabenverwaltung & Wartungsplanung", "Dokumenten-Upload (erweitert)", "Alle Vorlagen inkl. Premium", "Prioritäts-Support (24h)"]'::jsonb,
  updated_at = now()
WHERE feature_key = 'billing_upgrade_prompt';
