/*
  # Add wizard document types to documents table

  1. Changes
    - Update `documents_document_type_check` constraint to include 'kuendigungsbestaetigung'
    - This allows the wizard-generated documents to be stored in the documents table

  2. Notes
    - Non-destructive: only adds new allowed values
    - Existing data is not affected
*/

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;

ALTER TABLE documents ADD CONSTRAINT documents_document_type_check
  CHECK (document_type IN (
    'contract', 'invoice', 'bill', 'receipt', 'report', 'other',
    'floor_plan', 'energy_certificate', 'insurance', 'property_deed',
    'rental_agreement', 'utility_bill', 'maintenance', 'photo',
    'blueprint', 'expose',
    'amendment', 'addendum', 'termination', 'protocol',
    'correspondence', 'main_contract',
    'index_increase_notice',
    'kuendigungsbestaetigung'
  ));
