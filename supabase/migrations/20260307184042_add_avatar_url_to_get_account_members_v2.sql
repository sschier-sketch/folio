/*
  # Add avatar_url to get_account_members RPC

  1. Modified Functions
    - `get_account_members` - now returns `avatar_url` from account_profiles
      so that the users management view can display profile photos

  2. Important Notes
    - Drops and recreates the function with updated return type
*/

DROP FUNCTION IF EXISTS get_account_members(uuid);

CREATE FUNCTION get_account_members(p_account_owner_id uuid)
RETURNS TABLE (
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
  last_sign_in timestamptz,
  avatar_url text
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
au.last_sign_in_at as last_sign_in,
ap.avatar_url
FROM user_settings ns
JOIN auth.users au ON au.id = ns.user_id
LEFT JOIN account_profiles ap ON ap.user_id = ns.user_id
WHERE ns.account_owner_id = p_account_owner_id
ORDER BY ns.removed_at NULLS FIRST, ns.created_at ASC;
END;
$$;
