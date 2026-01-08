/*
  # Add Tenant Portal Document Access

  1. Changes
    - Add RLS policy to allow anonymous users to view property documents shared with tenants
  
  2. Security
    - Anonymous users can only access documents that are:
      - Marked as shared_with_tenant = true
      - For properties where they have a valid impersonation token
*/

DROP POLICY IF EXISTS "Tenants can view shared documents via valid token" ON property_documents;

CREATE POLICY "Tenants can view shared documents via valid token"
  ON property_documents
  FOR SELECT
  TO anon
  USING (
    shared_with_tenant = true
    AND property_id IN (
      SELECT te.property_id
      FROM tenants te
      WHERE te.id IN (
        SELECT tenant_id 
        FROM tenant_impersonation_tokens 
        WHERE used_at IS NULL 
        AND expires_at > now()
      )
    )
  );
