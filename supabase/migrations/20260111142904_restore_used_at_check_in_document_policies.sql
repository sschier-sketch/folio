/*
  # Restore used_at check in document RLS policies

  1. Changes
    - Restore `used_at IS NULL` check in document RLS policies
    - This works now because the token login no longer marks tokens as used
    - Tokens remain valid until they expire
  
  2. Security
    - Tokens can be reused until they expire
    - The used_at field can be used for tracking/auditing but doesn't affect access
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
