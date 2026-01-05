/*
  # Add Unit Assignment to Property Documents

  1. Changes
    - Add unit_id field to property_documents table
      - `unit_id` (uuid, nullable): Links document to a specific unit
      - Foreign key to property_units table

  2. Notes
    - Documents can now be assigned to specific units (optional)
    - If unit_id is null, document applies to entire property
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_documents' AND column_name = 'unit_id'
  ) THEN
    ALTER TABLE property_documents 
    ADD COLUMN unit_id uuid REFERENCES property_units(id) ON DELETE SET NULL DEFAULT NULL;
  END IF;
END $$;