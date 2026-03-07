/*
  # Fix get_account_members email type mismatch

  1. Changes
    - Recreate `get_account_members` function to cast `auth.users.email` 
      from `varchar(255)` to `text` to match the declared return type
    - This fixes the "Returned type character varying(255) does not match 
      expected type text in column 2" error

  2. Notes
    - No data changes, only function definition update
*/

CREATE OR REPLACE FUNCTION get_account_members(p_account_owner_id uuid)
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  role text,
  is_active_member boolean,
  is_read_only boolean,
  can_manage_billing boolean,
  can_manage_users boolean,
  can_manage_properties boolean,
  can_manage_tenants boolean,
  can_manage_finances boolean,
  can_view_analytics boolean,
  can_view_finances boolean,
  can_view_statements boolean,
  can_view_rent_payments boolean,
  can_view_leases boolean,
  can_view_messages boolean,
  property_scope text,
  property_access text,
  removed_at timestamptz,
  joined_at timestamptz,
  last_sign_in timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT auth.uid()) != p_account_owner_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_settings.user_id = (SELECT auth.uid())
        AND account_owner_id = p_account_owner_id
        AND can_manage_users = true
        AND is_active_member = true
        AND user_settings.removed_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    ns.user_id,
    au.email::text,
    ap.first_name,
    ap.last_name,
    ns.role,
    ns.is_active_member,
    ns.is_read_only,
    ns.can_manage_billing,
    ns.can_manage_users,
    ns.can_manage_properties,
    ns.can_manage_tenants,
    ns.can_manage_finances,
    ns.can_view_analytics,
    ns.can_view_finances,
    ns.can_view_statements,
    ns.can_view_rent_payments,
    ns.can_view_leases,
    ns.can_view_messages,
    ns.property_scope,
    ns.property_access,
    ns.removed_at,
    ns.created_at as joined_at,
    au.last_sign_in_at as last_sign_in
  FROM user_settings ns
  JOIN auth.users au ON au.id = ns.user_id
  LEFT JOIN account_profiles ap ON ap.user_id = ns.user_id
  WHERE ns.account_owner_id = p_account_owner_id
  ORDER BY ns.removed_at NULLS FIRST, ns.created_at ASC;
END;
$$;