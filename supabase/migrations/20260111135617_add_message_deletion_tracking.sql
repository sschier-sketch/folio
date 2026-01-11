/*
  # Add Message Deletion Tracking

  1. Changes to tenant_communications
    - Add `is_deleted` boolean field (default false)
    - Add `deleted_at` timestamp field
    - Add `deleted_by` user reference field
    
  2. Security
    - No RLS changes needed - existing policies handle access
    
  3. Notes
    - Deleted messages remain in database but are marked as deleted
    - Deletion timestamp and user tracked for audit purposes
*/

-- Add deletion tracking fields to tenant_communications
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenant_communications' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE tenant_communications 
    ADD COLUMN is_deleted boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenant_communications' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE tenant_communications 
    ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenant_communications' AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE tenant_communications 
    ADD COLUMN deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;