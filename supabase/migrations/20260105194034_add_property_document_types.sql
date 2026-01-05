/*
  # Add Property-Specific Document Types
  
  1. Changes
    - Expand document_type constraint to include property-specific types:
      - floor_plan: Grundrisse und Pläne
      - energy_certificate: Energieausweise
      - insurance: Versicherungsunterlagen
      - property_deed: Grundbuchauszug/Kaufvertrag
      - rental_agreement: Mietverträge
      - utility_bill: Nebenkosten-Abrechnungen
      - maintenance: Wartungsunterlagen
      - photo: Fotos
      - blueprint: Baupläne
      
  2. Notes
    - Existing document types remain valid
    - No data migration needed
*/

-- Drop existing constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'documents_document_type_check'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_document_type_check;
  END IF;
END $$;

-- Add new constraint with extended types
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
  'blueprint'
));