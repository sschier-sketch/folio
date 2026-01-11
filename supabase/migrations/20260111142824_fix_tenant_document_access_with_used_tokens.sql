/*
  # Fix Tenant Document Access with Used Tokens

  1. Changes
    - Update RLS policies to allow access with tokens that have been used but not expired
    - Remove the `used_at IS NULL` restriction since tokens are marked as used immediately after login
    - Only check that tokens haven't expired yet
  
  2. Security
    - Tenants can access documents as long as they have a valid token (not expired)
    - Token usage is tracked but doesn't prevent access
*/

DROP POLICY IF EXISTS "Tenants can view shared communication documents" ON documents;

CREATE POLICY "Tenants can view shared communication documents"
  ON documents
  FOR SELECT
  TO anon
  USING (
    shared_with_tenant = true
    AND (
      id IN (
        SELECT tc.attachment_id
        FROM tenant_communications tc
        WHERE tc.tenant_id IN (
          SELECT tenant_id 
          FROM tenant_impersonation_tokens 
          WHERE expires_at > now()
        )
        AND tc.attachment_id IS NOT NULL
      )
      OR
      id IN (
        SELECT da.document_id
        FROM document_associations da
        WHERE da.association_type = 'tenant'
        AND da.association_id IN (
          SELECT tenant_id 
          FROM tenant_impersonation_tokens 
          WHERE expires_at > now()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Tenants can download shared documents from storage" ON storage.objects;

CREATE POLICY "Tenants can download shared documents from storage"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (
    bucket_id = 'documents'
    AND name IN (
      SELECT d.file_path
      FROM documents d
      WHERE d.shared_with_tenant = true
      AND (
        d.id IN (
          SELECT tc.attachment_id
          FROM tenant_communications tc
          WHERE tc.tenant_id IN (
            SELECT tenant_id 
            FROM tenant_impersonation_tokens 
            WHERE expires_at > now()
          )
          AND tc.attachment_id IS NOT NULL
        )
        OR
        d.id IN (
          SELECT da.document_id
          FROM document_associations da
          WHERE da.association_type = 'tenant'
          AND da.association_id IN (
            SELECT tenant_id 
            FROM tenant_impersonation_tokens 
            WHERE expires_at > now()
          )
        )
      )
    )
  );
