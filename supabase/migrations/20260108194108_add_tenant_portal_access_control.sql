/*
  # Add Tenant Portal Access Control

  1. Changes
    - Add `portal_access_enabled` column to rental_contracts table
    - Add `portal_activated_at` column to tenants table to track first login
    - Add `shared_with_tenant` column to property_documents table
    - Add indexes for performance
  
  2. Security
    - No RLS changes needed as existing policies already handle access
*/

-- Add portal access control to rental contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rental_contracts' AND column_name = 'portal_access_enabled'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN portal_access_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Add portal activation tracking to tenants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenants' AND column_name = 'portal_activated_at'
  ) THEN
    ALTER TABLE tenants ADD COLUMN portal_activated_at timestamptz;
  END IF;
END $$;

-- Add shared flag to property_documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'property_documents' AND column_name = 'shared_with_tenant'
  ) THEN
    ALTER TABLE property_documents ADD COLUMN shared_with_tenant boolean DEFAULT false;
  END IF;
END $$;

-- Add index for portal access queries
CREATE INDEX IF NOT EXISTS idx_rental_contracts_portal_access 
ON rental_contracts(portal_access_enabled) 
WHERE portal_access_enabled = true;

-- Add index for tenant portal queries
CREATE INDEX IF NOT EXISTS idx_tenants_email_portal 
ON tenants(email, user_id) 
WHERE email IS NOT NULL;
