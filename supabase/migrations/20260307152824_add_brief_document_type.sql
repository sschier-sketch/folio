/*
  # Add 'brief' document type to documents constraint

  1. Changes
    - Drops and recreates the `documents_document_type_check` constraint
    - Adds 'brief' type for postal letter documents

  2. Important Notes
    - No data changes, only constraint modification
    - All existing types preserved
*/

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
        'betriebskostenabrechnung',
        'brief'
      ));
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
