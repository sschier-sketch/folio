/*
  # Add Abmahnung wegen Ruhestörung wizard template

  1. New Data
    - Insert new wizard template 'abmahnung_ruhestoerung' in category 'abmahnungen'
    - Title: Abmahnung wegen Ruhestörung
    - Description: Formal warning letter for noise disturbance

  2. Schema Changes
    - Add 'abmahnung_ruhestoerung' to documents.document_type check constraint
    - Add 'abmahnung_ruhestoerung' to property_documents.document_type check constraint
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'abmahnung_ruhestoerung',
  'abmahnungen',
  'Abmahnung wegen Ruhestörung',
  'Erstellen Sie eine formelle Abmahnung bei wiederholter Ruhestörung mit detaillierter Auflistung der Störungsereignisse.',
  true,
  25
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
    'kuendigungsbestaetigung','zahlungserinnerung','abmahnung_ruhestoerung'
  ])
);

ALTER TABLE property_documents DROP CONSTRAINT IF EXISTS property_documents_document_type_check;
ALTER TABLE property_documents ADD CONSTRAINT property_documents_document_type_check CHECK (
  document_type = ANY (ARRAY[
    'floor_plan','energy_certificate','insurance','inspection','other',
    'automatische_vorlage','kuendigungsbestaetigung','expose',
    'zahlungserinnerung','abmahnung_ruhestoerung'
  ])
);
