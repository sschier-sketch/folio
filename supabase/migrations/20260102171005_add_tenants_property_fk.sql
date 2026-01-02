/*
  # Add Foreign Key Relationship between Tenants and Properties

  1. Changes
    - Add foreign key constraint from tenants.property_id to properties.id
    - This allows Supabase to automatically join the tables

  2. Security
    - No RLS changes needed
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tenants_property_id_fkey'
  ) THEN
    ALTER TABLE tenants 
    ADD CONSTRAINT tenants_property_id_fkey 
    FOREIGN KEY (property_id) 
    REFERENCES properties(id) 
    ON DELETE SET NULL;
  END IF;
END $$;