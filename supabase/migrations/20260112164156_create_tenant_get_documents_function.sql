/*
  # Create Tenant Document Access Function

  1. New Function
    - `get_tenant_documents(tenant_id_param uuid)` - Returns documents accessible to a specific tenant
    
  2. Security
    - Function is SECURITY DEFINER to bypass RLS
    - Validates that an active token exists for the tenant before returning documents
    - Only returns documents that are:
      - Shared with tenant (shared_with_tenant = true)
      - Not archived (is_archived = false)
      - Associated with the tenant, their property, or their unit
    
  3. Purpose
    - Allows anon role (tenant portal) to access documents without complex RLS policies
    - Provides secure, token-validated document access for tenant portal
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_tenant_documents(uuid);

-- Create function to get documents for a tenant
CREATE OR REPLACE FUNCTION get_tenant_documents(tenant_id_param uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  file_name text,
  file_path text,
  file_size bigint,
  document_type text,
  description text,
  upload_date timestamptz,
  is_archived boolean,
  shared_with_tenant boolean,
  created_at timestamptz,
  updated_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verify that an active token exists for this tenant
  IF NOT EXISTS (
    SELECT 1 
    FROM tenant_impersonation_tokens 
    WHERE tenant_id = tenant_id_param
      AND used_at IS NULL 
      AND expires_at > now()
  ) THEN
    -- Return empty result if no valid token
    RETURN;
  END IF;

  -- Get tenant's property_id and unit_id
  DECLARE
    v_property_id uuid;
    v_unit_id uuid;
  BEGIN
    SELECT t.property_id, t.unit_id
    INTO v_property_id, v_unit_id
    FROM tenants t
    WHERE t.id = tenant_id_param;

    -- Return documents associated with tenant, property, or unit
    RETURN QUERY
    SELECT DISTINCT
      d.id,
      d.user_id,
      d.file_name,
      d.file_path,
      d.file_size,
      d.document_type,
      d.description,
      d.upload_date,
      d.is_archived,
      d.shared_with_tenant,
      d.created_at,
      d.updated_at
    FROM documents d
    WHERE d.shared_with_tenant = true
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
    ORDER BY d.upload_date DESC;
  END;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_tenant_documents(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_tenant_documents(uuid) TO authenticated;
