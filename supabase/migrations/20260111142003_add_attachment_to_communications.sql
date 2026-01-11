/*
  # Add attachment support to tenant communications

  1. Changes
    - Add `attachment_id` column to `tenant_communications` table to link messages with document attachments
    - This enables direct linking between a communication entry and its attached document

  2. Notes
    - The attachment_id references the documents table
    - This field is optional (nullable) as not all communications have attachments
*/

-- Add attachment_id column to tenant_communications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenant_communications' AND column_name = 'attachment_id'
  ) THEN
    ALTER TABLE tenant_communications ADD COLUMN attachment_id uuid REFERENCES documents(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_communications_attachment_id ON tenant_communications(attachment_id);
