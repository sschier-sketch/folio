/*
  # Add Mietschuldenfreiheitsbescheinigung wizard template

  1. New Data
    - Inserts a new wizard template `mietschuldenfreiheit` in category `sonstiges`
    - Title: Mietschuldenfreiheitsbescheinigung
    - Description: Erstellen Sie eine Bescheinigung über die Mietschuldenfreiheit Ihres Mieters.

  2. Document Type
    - Adds `mietschuldenfreiheit` to the allowed document types in the `documents` table

  3. Notes
    - Template is active by default
    - Sort order 160 places it after existing sonstiges templates
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'mietschuldenfreiheit',
  'sonstiges',
  'Mietschuldenfreiheitsbescheinigung',
  'Erstellen Sie eine Bescheinigung über die Mietschuldenfreiheit Ihres Mieters.',
  true,
  160
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'documents_document_type_check'
      AND table_name = 'documents'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_document_type_check;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'document_type'
  ) THEN
    ALTER TABLE documents ADD CONSTRAINT documents_document_type_check
      CHECK (document_type IN (
        'mietvertrag', 'kuendigung', 'nebenkostenabrechnung', 'uebergabeprotokoll',
        'rechnung', 'mahnung', 'sonstiges', 'expose', 'grundriss', 'energieausweis',
        'teilungserklaerung', 'hausgeldabrechnung', 'wirtschaftsplan',
        'versicherungspolice', 'gutachten', 'protokoll', 'bescheid',
        'mietschuldenfreiheit',
        'kuendigungsbestaetigung', 'zahlungserinnerung',
        'abmahnung_ruhestoerung', 'abmahnung_bauliche_veraenderungen',
        'betriebskosten_vorauszahlungen', 'mieterselbstauskunft',
        'raeumungsaufforderung', 'kuendigung_abmahnung', 'kuendigung_eigenbedarf',
        'kuendigung_zahlungsverzug', 'mietkaution_rueckgriff',
        'schoenheitsreparaturen', 'meldebestaetigung', 'wohnungsgeberbestaetigung',
        'mieterhoehungsverlangen',
        'mietbescheinigung', 'selbstauskunft', 'kaution',
        'handover', 'index_increase_notice',
        'betriebskostenabrechnung'
      ));
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
