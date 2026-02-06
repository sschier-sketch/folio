/*
  # Fix get_tenant_documents: robust rental contract lookup

  1. Problem
    - get_tenant_documents looked up rental contract only via rental_contracts.tenant_id
    - tenants.contract_id may point to a different contract ID
    - This mismatch caused documents uploaded from tenant contract tab to not appear in tenant portal

  2. Solution
    - Also check tenants.contract_id for the rental contract association
    - Documents are now visible if associated with EITHER:
      - The contract found via rental_contracts.tenant_id
      - OR the contract referenced by tenants.contract_id

  3. Security
    - No changes to security model
    - Same token validation and user_id checks remain
*/

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
  v_tenant_contract_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM tenant_impersonation_tokens
    WHERE tenant_id = tenant_id_param
      AND used_at IS NULL
      AND expires_at > now()
  ) THEN
    RETURN;
  END IF;

  SELECT t.user_id, t.property_id, t.unit_id, t.contract_id, rc.id
  INTO v_user_id, v_property_id, v_unit_id, v_tenant_contract_id, v_rental_contract_id
  FROM tenants t
  LEFT JOIN rental_contracts rc ON rc.id = (
    SELECT rci.id FROM rental_contracts rci
    WHERE rci.tenant_id = tenant_id_param
    ORDER BY rci.created_at DESC
    LIMIT 1
  )
  WHERE t.id = tenant_id_param;

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
      NOT EXISTS (
        SELECT 1 FROM document_associations da WHERE da.document_id = d.id
      )
      OR
      EXISTS (
        SELECT 1 FROM document_associations da
        WHERE da.document_id = d.id
          AND da.association_type = 'tenant'
          AND da.association_id = tenant_id_param
      )
      OR
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
      (
        v_rental_contract_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM document_associations da
          WHERE da.document_id = d.id
            AND da.association_type = 'rental_contract'
            AND da.association_id = v_rental_contract_id
        )
      )
      OR
      (
        v_tenant_contract_id IS NOT NULL
        AND v_tenant_contract_id IS DISTINCT FROM v_rental_contract_id
        AND EXISTS (
          SELECT 1 FROM document_associations da
          WHERE da.document_id = d.id
            AND da.association_type = 'rental_contract'
            AND da.association_id = v_tenant_contract_id
        )
      )
    )
  ORDER BY d.upload_date DESC;
END;
$$;
