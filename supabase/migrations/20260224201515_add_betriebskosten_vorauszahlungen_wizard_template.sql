/*
  # Add Betriebskostenvorauszahlungen wizard template

  1. New Data
    - Insert wizard template 'betriebskosten_vorauszahlungen' in category 'sonstiges'
    - Title: Anpassung Betriebskostenvorauszahlungen
    - Supports two modes: senken (reduce) and erhöhen (increase)

  2. Schema Changes
    - Add 'betriebskosten_vorauszahlungen' to documents.document_type check constraint
    - Add 'betriebskosten_vorauszahlungen' to property_documents.document_type check constraint
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'betriebskosten_vorauszahlungen',
  'sonstiges',
  'Anpassung Betriebskostenvorauszahlungen',
  'Erstellen Sie ein Schreiben zur Anpassung der monatlichen Betriebskostenvorauszahlungen – entweder zur Erhöhung oder Senkung.',
  true,
  30
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_document_type_check CHECK (
  document_type = ANY (ARRAY[
    'contract','invoice','bill','receipt','report','other',
    'floor_plan','energy_certificate','insurance','property_deed',
    'rental_agreement','utility_bill','maintenance','photo',
    'blueprint','expose','amendment','addendum','termination',
    'protocol','correspondence','main_contract','index_increase_notice',
    'kuendigungsbestaetigung','zahlungserinnerung','abmahnung_ruhestoerung',
    'abmahnung_bauliche_veraenderungen','betriebskosten_vorauszahlungen'
  ])
);

ALTER TABLE property_documents DROP CONSTRAINT IF EXISTS property_documents_document_type_check;
ALTER TABLE property_documents ADD CONSTRAINT property_documents_document_type_check CHECK (
  document_type = ANY (ARRAY[
    'floor_plan','energy_certificate','insurance','inspection','other',
    'automatische_vorlage','kuendigungsbestaetigung','expose',
    'zahlungserinnerung','abmahnung_ruhestoerung',
    'abmahnung_bauliche_veraenderungen','betriebskosten_vorauszahlungen'
  ])
);
