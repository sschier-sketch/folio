/*
  # Fix Tenant Document Access - Include Rental Contract Documents

  1. Problem
    - Documents uploaded in tenant contract tab are associated with 'rental_contract'
    - get_tenant_documents function only checked for 'tenant', 'property', 'unit' associations
    - Result: Documents uploaded for tenant contracts were not visible in tenant portal

  2. Solution
    - Add check for documents associated with tenant's rental contracts
    - Now checks for: tenant, property, unit, AND rental_contract associations

  3. Security
    - Maintains all existing security checks
    - Only returns documents where shared_with_tenant = true
    - Only returns documents for authenticated tenants with valid tokens
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_tenant_documents(uuid);

-- Create improved function to get documents for a tenant including rental contract documents
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
DECLARE
  v_property_id uuid;
  v_unit_id uuid;
  v_user_id uuid;
  v_rental_contract_id uuid;
BEGIN
  -- Verify that an active token exists for this tenant
  IF NOT EXISTS (
    SELECT 1
    FROM tenant_impersonation_tokens
    WHERE tenant_id = tenant_id_param
      AND used_at IS NULL
      AND expires_at > now()
  ) THEN
    RETURN;
  END IF;

  -- Get tenant's user_id, property_id, unit_id, and active rental contract id
  SELECT t.user_id, t.property_id, t.unit_id, rc.id
  INTO v_user_id, v_property_id, v_unit_id, v_rental_contract_id
  FROM tenants t
  LEFT JOIN rental_contracts rc ON rc.id = (
    SELECT id FROM rental_contracts
    WHERE tenant_id = tenant_id_param
    ORDER BY created_at DESC
    LIMIT 1
  )
  WHERE t.id = tenant_id_param;

  -- Return documents that meet the criteria
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
    AND d.user_id = v_user_id
    AND (
      -- Documents without any association (visible to all tenants)
      NOT EXISTS (
        SELECT 1 FROM document_associations da WHERE da.document_id = d.id
      )
      OR
      -- Documents associated with this specific tenant
      EXISTS (
        SELECT 1 FROM document_associations da
        WHERE da.document_id = d.id
          AND da.association_type = 'tenant'
          AND da.association_id = tenant_id_param
      )
      OR
      -- Documents associated with tenant's property
      (
        v_property_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM document_associations da
          WHERE da.document_id = d.id
            AND da.association_type = 'property'
            AND da.association_id = v_property_id
        )
      )
      OR
      -- Documents associated with tenant's unit
      (
        v_unit_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM document_associations da
          WHERE da.document_id = d.id
            AND da.association_type = 'unit'
            AND da.association_id = v_unit_id
        )
      )
      OR
      -- Documents associated with tenant's rental contract (NEW!)
      (
        v_rental_contract_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM document_associations da
          WHERE da.document_id = d.id
            AND da.association_type = 'rental_contract'
            AND da.association_id = v_rental_contract_id
        )
      )
    )
  ORDER BY d.upload_date DESC;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_tenant_documents(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_tenant_documents(uuid) TO authenticated;
