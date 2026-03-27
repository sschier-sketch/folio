/*
  # Fix Admin User Detail Stats RPC

  Fixes the rental_contracts query - removes deleted_at filter 
  (column does not exist on rental_contracts).
*/

CREATE OR REPLACE FUNCTION admin_get_user_detail_stats(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  is_admin boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'sub_users', (
      SELECT count(*)::int
      FROM user_settings
      WHERE account_owner_id = target_user_id
        AND user_id != target_user_id
    ),
    'properties', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'address_street', p.address_street,
          'address_city', p.address_city,
          'units_count', COALESCE(u.cnt, 0)
        )
        ORDER BY p.name
      )
      FROM properties p
      LEFT JOIN (
        SELECT property_id, count(*)::int AS cnt
        FROM property_units
        GROUP BY property_id
      ) u ON u.property_id = p.id
      WHERE p.user_id = target_user_id
    ), '[]'::jsonb),
    'total_units', (
      SELECT count(*)::int
      FROM property_units pu
      JOIN properties p ON p.id = pu.property_id
      WHERE p.user_id = target_user_id
    ),
    'total_tenants', (
      SELECT count(*)::int
      FROM rental_contracts
      WHERE user_id = target_user_id
    ),
    'bank_connections', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', bc.id,
          'bank_name', bc.bank_name,
          'status', bc.status,
          'last_sync_at', bc.last_sync_at,
          'error_message', bc.error_message,
          'last_issue_message', bc.last_issue_message,
          'created_at', bc.created_at
        )
        ORDER BY bc.created_at DESC
      )
      FROM banksapi_connections bc
      WHERE bc.user_id = target_user_id
        AND bc.status != 'disconnected'
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;
