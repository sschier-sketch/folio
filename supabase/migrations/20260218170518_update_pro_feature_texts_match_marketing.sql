/*
  # Update Pro-Feature Texts to Match Marketing Pages

  1. Updated Records
    - `billing_upgrade_prompt`: Updated features list to match actual Pro plan features from pricing/marketing pages
    - `billing_trial_active`: Updated features list to reflect full Pro feature highlights
    - `billing_pro_plan`: Updated features list to match the Pro plan definition in plans.ts

  2. Changes
    - All three records now use consistent feature descriptions matching the marketing/pricing pages
    - Feature lists align with what users see on the Pricing page and landing page
*/

UPDATE pro_feature_texts
SET
  features = '[
    "Unbegrenzt Immobilien, Mieter & Einheiten",
    "Ticketsystem & Nachrichten",
    "Mieterportal",
    "Betriebskostenabrechnung",
    "Mahnwesen & Indexmiete",
    "Cashflow & Finanzanalyse",
    "Dokumenten-Upload (erweitert)",
    "Alle Vorlagen inkl. Premium",
    "Prioritäts-Support (24h)"
  ]'::jsonb,
  updated_at = now()
WHERE feature_key = 'billing_upgrade_prompt';

UPDATE pro_feature_texts
SET
  features = '[
    "Unbegrenzt Immobilien, Mieter & Einheiten",
    "Ticketsystem & Nachrichten",
    "Betriebskostenabrechnung",
    "Mahnwesen & Indexmiete",
    "Cashflow & Finanzanalyse"
  ]'::jsonb,
  updated_at = now()
WHERE feature_key = 'billing_trial_active';

UPDATE pro_feature_texts
SET
  features = '[
    "Unbegrenzt Immobilien, Mieter & Einheiten",
    "Ticketsystem & Nachrichten",
    "Mieterportal",
    "Betriebskostenabrechnung",
    "Mahnwesen & Indexmiete",
    "Cashflow & Finanzanalyse",
    "Dokumenten-Upload (erweitert)",
    "Alle Vorlagen inkl. Premium",
    "Prioritäts-Support (24h)"
  ]'::jsonb,
  updated_at = now()
WHERE feature_key = 'billing_pro_plan';
