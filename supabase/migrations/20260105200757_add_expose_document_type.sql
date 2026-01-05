/*
  # Add Exposé Document Type
  
  1. Changes
    - Add 'expose' to document_type constraint
    
  2. Notes
    - Exposé is a marketing document for properties
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'documents_document_type_check'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_document_type_check;
  END IF;
END $$;

ALTER TABLE documents
ADD CONSTRAINT documents_document_type_check
CHECK (document_type IN (
  'contract',
  'invoice', 
  'bill',
  'receipt',
  'report',
  'other',
  'floor_plan',
  'energy_certificate',
  'insurance',
  'property_deed',
  'rental_agreement',
  'utility_bill',
  'maintenance',
  'photo',
  'blueprint',
  'expose'
));