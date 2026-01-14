/*
  # Verbesserte Mieter-Dokumenten-Zugriffsfunktion

  1. Änderungen
    - Erweitert get_tenant_documents Funktion
    - Dokumente ohne Zuordnung werden nun allen Mietern angezeigt
    - Dokumente mit Mieter-Zuordnung werden nur diesem Mieter angezeigt
    - Dokumente mit Immobilien-Zuordnung werden allen Mietern dieser Immobilie angezeigt
    - Dokumente mit Einheiten-Zuordnung werden nur Mietern dieser Einheit angezeigt

  2. Logik
    - shared_with_tenant = true ist Voraussetzung
    - Dokumente OHNE Zuordnung: Für alle Mieter sichtbar
    - Dokumente MIT Zuordnung: Nur für zugeordnete Mieter sichtbar
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_tenant_documents(uuid);

-- Create improved function to get documents for a tenant
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

  -- Get tenant's user_id, property_id and unit_id
  SELECT t.user_id, t.property_id, t.unit_id
  INTO v_user_id, v_property_id, v_unit_id
  FROM tenants t
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
    )
  ORDER BY d.upload_date DESC;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_tenant_documents(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_tenant_documents(uuid) TO authenticated;
