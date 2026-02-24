/*
  # Add Zahlungserinnerung (Payment Reminder) wizard template

  1. New Data
    - Insert new wizard template 'zahlungserinnerung' in category 'abmahnungen'
    - Title: Erinnerung zur Zahlung ausstehender Mieten
    - Description: Payment reminder document for outstanding rent

  2. Schema Changes
    - Add 'zahlungserinnerung' to documents.document_type check constraint
    - Add 'zahlungserinnerung' to property_documents.document_type check constraint

  3. Important Notes
    - This extends the existing wizard system
    - The new document type allows storing generated PDFs
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'zahlungserinnerung',
  'abmahnungen',
  'Erinnerung zur Zahlung ausstehender Mieten',
  'Erstellen Sie eine höfliche Zahlungserinnerung für ausstehende Mietforderungen mit allen relevanten Details wie Betrag und Zahlungsfrist.',
  true,
  20
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
    'kuendigungsbestaetigung','zahlungserinnerung'
  ])
);

ALTER TABLE property_documents DROP CONSTRAINT IF EXISTS property_documents_document_type_check;
ALTER TABLE property_documents ADD CONSTRAINT property_documents_document_type_check CHECK (
  document_type = ANY (ARRAY[
    'floor_plan','energy_certificate','insurance','inspection','other',
    'automatische_vorlage','kuendigungsbestaetigung','expose',
    'zahlungserinnerung'
  ])
);
