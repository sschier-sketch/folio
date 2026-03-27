/*
  # Admin: Get user detail stats RPC

  Creates a security-definer function that admins can call to retrieve
  comprehensive usage stats for any user, bypassing RLS.

  1. Returns:
    - sub_users: count of team members (account_members, excluding owner)
    - properties: array of {id, name, address_street, address_city, units_count}
    - total_units: total property units across all properties
    - total_tenants: count of active rental contracts
    - bank_connections: array of bank connection details

  2. Security:
    - Only callable by admin users (checked via admin_users table)
    - Uses SECURITY DEFINER to bypass RLS
*/

DROP FUNCTION IF EXISTS admin_get_user_detail_stats(uuid);

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

  SELECT COALESCE(jsonb_agg(row_to_json(sub)::jsonb ORDER BY sub.name), '[]'::jsonb)
  INTO v_properties
  FROM (
    SELECT
      p.id,
      p.name,
      p.address_street,
      p.address_city,
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
  WHERE user_id = p_user_id
    AND deleted_at IS NULL;

  SELECT COALESCE(jsonb_agg(row_to_json(bc)::jsonb ORDER BY bc.created_at DESC), '[]'::jsonb)
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
