/*
  # Add Tenant Portal Access to Communication Documents

  1. Changes
    - Add RLS policy to allow tenants to view documents in the documents table that are shared with them
    - Add storage policy to allow tenants to download documents from the documents bucket
  
  2. Security
    - Tenants (anonymous users with valid tokens) can only access documents that are:
      - Marked as shared_with_tenant = true
      - Associated with their tenant record via document_associations or tenant_communications
      - Have a valid, unexpired impersonation token
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
          WHERE used_at IS NULL 
          AND expires_at > now()
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
          WHERE used_at IS NULL 
          AND expires_at > now()
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
            WHERE used_at IS NULL 
            AND expires_at > now()
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
            WHERE used_at IS NULL 
            AND expires_at > now()
          )
        )
      )
    )
  );
