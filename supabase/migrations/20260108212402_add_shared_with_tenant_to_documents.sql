/*
  # Add shared_with_tenant field to documents table

  1. Changes
    - Add `shared_with_tenant` column to documents table
      - Boolean field to control tenant portal visibility
      - Defaults to false for security

  2. Security
    - No RLS changes needed - existing policies cover this
*/

-- Add shared_with_tenant column to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'shared_with_tenant'
  ) THEN
    ALTER TABLE documents ADD COLUMN shared_with_tenant boolean DEFAULT false;
  END IF;
END $$;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_documents_shared_with_tenant
  ON documents(shared_with_tenant)
  WHERE shared_with_tenant = true;