/*
  # Fix admin user detail stats: exclude disconnected bank connections

  1. Changes
    - Filter out `disconnected` bank connections from admin_get_user_detail_stats RPC
    - Disconnected connections are replaced/inactive and should not appear in diagnostics
    - Only show active, errored, or pending connections

  2. Important Notes
    - This fixes the issue where a user with two connections (one active, one disconnected)
      would see the disconnected one shown with wrong status in admin diagnostics
*/

CREATE OR REPLACE FUNCTION admin_get_user_detail_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_is_admin boolean;
  v_sub_users integer;
  v_properties jsonb;
  v_total_units integer;
  v_total_tenants integer;
  v_bank_connections jsonb;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Forbidden: admin access required';
  END IF;

  SELECT count(*)::integer INTO v_sub_users
  FROM user_settings
  WHERE account_owner_id = p_user_id
    AND user_id != p_user_id;

  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb)
  INTO v_properties
  FROM (
    SELECT
      p.id,
      p.name,
      p.street AS address_street,
      p.city AS address_city,
      (SELECT count(*)::integer FROM property_units pu WHERE pu.property_id = p.id) AS units_count
    FROM properties p
    WHERE p.user_id = p_user_id
    ORDER BY p.name
  ) sub;

  SELECT COALESCE(sum((elem->>'units_count')::integer), 0)::integer
  INTO v_total_units
  FROM jsonb_array_elements(v_properties) elem;

  SELECT count(*)::integer INTO v_total_tenants
  FROM rental_contracts
  WHERE user_id = p_user_id;

  SELECT COALESCE(jsonb_agg(row_to_json(bc)::jsonb), '[]'::jsonb)
  INTO v_bank_connections
  FROM (
    SELECT
      id,
      bank_name,
      status,
      last_sync_at,
      error_message,
      last_issue_message,
      created_at
    FROM banksapi_connections
    WHERE user_id = p_user_id
      AND status != 'disconnected'
    ORDER BY created_at DESC
  ) bc;

  v_result := jsonb_build_object(
    'sub_users', v_sub_users,
    'properties', v_properties,
    'total_units', v_total_units,
    'total_tenants', v_total_tenants,
    'bank_connections', v_bank_connections
  );

  RETURN v_result;
END;
$$;
