/*
  # Add Mieterselbstauskunft wizard template

  1. New Data
    - Insert wizard template 'mieterselbstauskunft' in category 'sonstiges'
    - Title: Mieterselbstauskunft
    - Includes tenant info, household members, and declarations

  2. Schema Changes
    - Add 'mieterselbstauskunft' to documents and property_documents type constraints
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'mieterselbstauskunft',
  'sonstiges',
  'Mieterselbstauskunft',
  'Erstellen Sie eine Mieterselbstauskunft mit allen relevanten Angaben zum Mietinteressenten, weiteren Bewohnern und rechtlichen Versicherungen.',
  true,
  40
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
    'abmahnung_bauliche_veraenderungen','betriebskosten_vorauszahlungen',
    'mieterselbstauskunft'
  ])
);

ALTER TABLE property_documents DROP CONSTRAINT IF EXISTS property_documents_document_type_check;
ALTER TABLE property_documents ADD CONSTRAINT property_documents_document_type_check CHECK (
  document_type = ANY (ARRAY[
    'floor_plan','energy_certificate','insurance','inspection','other',
    'automatische_vorlage','kuendigungsbestaetigung','expose',
    'zahlungserinnerung','abmahnung_ruhestoerung',
    'abmahnung_bauliche_veraenderungen','betriebskosten_vorauszahlungen',
    'mieterselbstauskunft'
  ])
);
