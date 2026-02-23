/*
  # Add wizard document types to property_documents

  1. Changes
    - Update `property_documents_document_type_check` constraint to include
      'kuendigungsbestaetigung' and 'automatische_vorlage' document types
    - These types are used by the new document wizard feature

  2. Notes
    - Non-destructive: only adds new allowed values
    - Existing data is not affected
*/

ALTER TABLE property_documents DROP CONSTRAINT IF EXISTS property_documents_document_type_check;

ALTER TABLE property_documents ADD CONSTRAINT property_documents_document_type_check
  CHECK (document_type IN (
    'floor_plan',
    'energy_certificate',
    'insurance',
    'inspection',
    'other',
    'automatische_vorlage',
    'kuendigungsbestaetigung',
    'expose'
  ));
