/*
  # Fix documents document_type constraint - add missing types

  The CHECK constraint on `documents.document_type` is missing 6 types that are
  available in the frontend UI, causing uploads of those types to fail with a generic error.

  1. Changes
    - Drop and recreate the `documents_document_type_check` constraint
    - Add missing types: amendment, addendum, termination, protocol, correspondence, main_contract

  2. Affected Types
    - `protocol` (Protokoll)
    - `amendment` (Nachtrag)
    - `addendum` (Zusatzvereinbarung)
    - `termination` (Kuendigung)
    - `correspondence` (Korrespondenz)
    - `main_contract` (Hauptvertrag)
*/

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;

ALTER TABLE documents
ADD CONSTRAINT documents_document_type_check
CHECK (document_type IN (
  'contract', 'invoice', 'bill', 'receipt', 'report', 'other',
  'floor_plan', 'energy_certificate', 'insurance', 'property_deed',
  'rental_agreement', 'utility_bill', 'maintenance', 'photo',
  'blueprint', 'expose',
  'amendment', 'addendum', 'termination', 'protocol',
  'correspondence', 'main_contract'
));
