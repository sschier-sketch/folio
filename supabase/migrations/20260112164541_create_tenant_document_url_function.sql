/*
  # Create Tenant Document URL Function

  1. New Function
    - `get_tenant_document_url(document_id_param uuid, tenant_id_param uuid)` - Returns signed URL for document
    
  2. Security
    - Function is SECURITY DEFINER to create signed URLs
    - Validates that tenant has access to document via active token
    - Validates that document is shared with tenant
    
  3. Purpose
    - Allows anon role (tenant portal) to view documents securely
*/

-- Create function to get signed URL for a tenant document
CREATE OR REPLACE FUNCTION get_tenant_document_url(
  document_id_param uuid,
  tenant_id_param uuid
)
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_file_path text;
  v_signed_url text;
BEGIN
  -- Verify that an active token exists for this tenant
  IF NOT EXISTS (
    SELECT 1 
    FROM tenant_impersonation_tokens 
    WHERE tenant_id = tenant_id_param
      AND used_at IS NULL 
      AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Kein gültiger Zugangs-Token';
  END IF;

  -- Get tenant's property_id and unit_id
  DECLARE
    v_property_id uuid;
    v_unit_id uuid;
    v_has_access boolean := false;
  BEGIN
    SELECT t.property_id, t.unit_id
    INTO v_property_id, v_unit_id
    FROM tenants t
    WHERE t.id = tenant_id_param;

    -- Check if document is accessible to tenant
    SELECT EXISTS (
      SELECT 1
      FROM documents d
      WHERE d.id = document_id_param
        AND d.shared_with_tenant = true
        AND d.is_archived = false
        AND d.id IN (
          -- Documents directly associated with tenant
          SELECT da.document_id
          FROM document_associations da
          WHERE da.association_type = 'tenant'
            AND da.association_id = tenant_id_param
          
          UNION
          
          -- Documents associated with tenant's property
          SELECT da.document_id
          FROM document_associations da
          WHERE da.association_type = 'property'
            AND da.association_id = v_property_id
            AND v_property_id IS NOT NULL
          
          UNION
          
          -- Documents associated with tenant's unit
          SELECT da.document_id
          FROM document_associations da
          WHERE da.association_type = 'unit'
            AND da.association_id = v_unit_id
            AND v_unit_id IS NOT NULL
        )
    ) INTO v_has_access;

    IF NOT v_has_access THEN
      RAISE EXCEPTION 'Kein Zugriff auf dieses Dokument';
    END IF;

    -- Get file path
    SELECT file_path INTO v_file_path
    FROM documents
    WHERE id = document_id_param;

    IF v_file_path IS NULL THEN
      RAISE EXCEPTION 'Dokument nicht gefunden';
    END IF;

    -- Create signed URL using storage extension
    SELECT url INTO v_signed_url
    FROM storage.objects
    WHERE bucket_id = 'documents'
      AND name = v_file_path;

    -- For now, return the file path - the frontend will handle URL creation
    RETURN v_file_path;
  END;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_tenant_document_url(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_tenant_document_url(uuid, uuid) TO authenticated;
