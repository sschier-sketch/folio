/*
  # Admin RPC: Get User Detail Stats

  Creates a SECURITY DEFINER function that allows admin users to fetch
  detailed stats for any user, bypassing RLS.

  Returns:
    - sub_users: count of team members
    - properties: array of properties with unit counts
    - total_units: total units across all properties
    - total_tenants: total active rental contracts
    - bank_connections: array of active bank connections

  Security:
    - Only callable by users in admin_users table
    - Uses SECURITY DEFINER to bypass RLS
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
        AND deleted_at IS NULL
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
