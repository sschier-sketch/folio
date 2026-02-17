/*
  # Add index_increase_notice document type

  1. Modified Tables
    - `documents`
      - Updated `document_type` CHECK constraint to include 'index_increase_notice'
  
  2. Important Notes
    - This allows storing index rent increase letters as documents
    - No data is modified, only the constraint is updated
*/

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_document_type_check
  CHECK (document_type = ANY (ARRAY[
    'contract', 'invoice', 'bill', 'receipt', 'report', 'other',
    'floor_plan', 'energy_certificate', 'insurance', 'property_deed',
    'rental_agreement', 'utility_bill', 'maintenance', 'photo',
    'blueprint', 'expose', 'amendment', 'addendum', 'termination',
    'protocol', 'correspondence', 'main_contract', 'index_increase_notice'
  ]));
