/*
  # Update Document Type Constraint for Tenant Document Types

  1. Changes
    - Updates the CHECK constraint on `documents.document_type` to include:
      - `amendment` (Nachtrag)
      - `addendum` (Zusatzvereinbarung)
      - `termination` (Kuendigung)
      - `protocol` (Protokoll)
      - `correspondence` (Schriftverkehr)
      - `main_contract` (Hauptvertrag)

  2. Notes
    - For production databases where documents table already exists
    - Drops and recreates the constraint with all allowed types
    - No data migration needed
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'documents_document_type_check'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_document_type_check;

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
  END IF;
END $$;
