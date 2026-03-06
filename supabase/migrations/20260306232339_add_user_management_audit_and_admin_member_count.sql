/*
  # Add User Management Audit Logging and Admin Member Count

  1. Schema Changes
    - Make `property_history.property_id` nullable to support account-level audit entries
    - Drop NOT NULL constraint and recreate FK as nullable

  2. New Function
    - `log_user_management_action()` - helper to insert audit entries for user management actions

  3. Updated RPC Functions
    - `update_account_member_permissions` - now logs permission changes
    - `deactivate_account_member` - now logs deactivation
    - `reactivate_account_member` - now logs reactivation
    - `remove_account_member` - now logs removal

  4. Updated Admin Function
    - `admin_get_users` - now returns `team_members_count` column

  5. Security
    - No RLS changes needed (property_history RLS already exists)
    - All existing data remains intact
*/

-- ============================================================
-- PART 1: Make property_id nullable in property_history
-- ============================================================

ALTER TABLE property_history ALTER COLUMN property_id DROP NOT NULL;

-- ============================================================
-- PART 2: Helper function to log user management actions
-- ============================================================

CREATE OR REPLACE FUNCTION log_user_management_action(
  p_actor_user_id uuid,
  p_event_type text,
  p_description text,
  p_target_user_id uuid DEFAULT NULL,
  p_target_email text DEFAULT NULL,
  p_changes jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name text;
BEGIN
  SELECT COALESCE(
    NULLIF(TRIM(COALESCE(ap.first_name, '') || ' ' || COALESCE(ap.last_name, '')), ''),
    u.email::text,
    'System'
  ) INTO v_actor_name
  FROM auth.users u
  LEFT JOIN account_profiles ap ON ap.user_id = u.id
  WHERE u.id = p_actor_user_id;

  IF v_actor_name IS NULL THEN
    v_actor_name := 'System';
  END IF;

  BEGIN
    INSERT INTO property_history (
      property_id, user_id, event_type, event_description,
      changed_by_name, metadata, entity_type, entity_id,
      action, source, changes
    ) VALUES (
      NULL,
      p_actor_user_id,
      p_event_type,
      p_description,
      v_actor_name,
      p_metadata || jsonb_build_object(
        'target_user_id', p_target_user_id,
        'target_email', p_target_email
      ),
      'account_member',
      COALESCE(p_target_user_id, p_actor_user_id),
      CASE
        WHEN p_event_type LIKE '%_invited' THEN 'create'
        WHEN p_event_type LIKE '%_removed' THEN 'delete'
        ELSE 'update'
      END,
      'app',
      p_changes
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'User management audit log failed: %', SQLERRM;
  END;
END;
$$;

-- ============================================================
-- PART 3: Recreate update_account_member_permissions with audit
-- ============================================================

CREATE OR REPLACE FUNCTION update_account_member_permissions(
  p_member_user_id uuid,
  p_role text DEFAULT NULL,
  p_is_read_only boolean DEFAULT NULL,
  p_can_manage_billing boolean DEFAULT NULL,
  p_can_manage_users boolean DEFAULT NULL,
  p_can_manage_properties boolean DEFAULT NULL,
  p_can_manage_tenants boolean DEFAULT NULL,
  p_can_manage_finances boolean DEFAULT NULL,
  p_can_view_analytics boolean DEFAULT NULL,
  p_can_view_finances boolean DEFAULT NULL,
  p_can_view_statements boolean DEFAULT NULL,
  p_can_view_rent_payments boolean DEFAULT NULL,
  p_can_view_leases boolean DEFAULT NULL,
  p_can_view_messages boolean DEFAULT NULL,
  p_property_scope text DEFAULT NULL,
  p_property_access text DEFAULT NULL,
  p_property_ids uuid[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_owner_id uuid;
  v_caller_uid uuid := (SELECT auth.uid());
  v_old_record jsonb;
  v_changes jsonb := '{}'::jsonb;
  v_member_email text;
BEGIN
  SELECT account_owner_id INTO v_member_owner_id
  FROM user_settings
  WHERE user_id = p_member_user_id AND removed_at IS NULL;

  IF v_member_owner_id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF v_caller_uid != v_member_owner_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_id = v_caller_uid
        AND account_owner_id = v_member_owner_id
        AND can_manage_users = true
        AND is_active_member = true
        AND removed_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;

  SELECT jsonb_build_object(
    'role', role,
    'is_read_only', is_read_only,
    'can_manage_billing', can_manage_billing,
    'can_manage_users', can_manage_users,
    'can_manage_properties', can_manage_properties,
    'can_manage_tenants', can_manage_tenants,
    'can_manage_finances', can_manage_finances,
    'can_view_analytics', can_view_analytics,
    'can_view_finances', can_view_finances,
    'can_view_statements', can_view_statements,
    'can_view_rent_payments', can_view_rent_payments,
    'can_view_leases', can_view_leases,
    'can_view_messages', can_view_messages,
    'property_scope', property_scope,
    'property_access', property_access
  ) INTO v_old_record
  FROM user_settings WHERE user_id = p_member_user_id;

  UPDATE user_settings SET
    role = COALESCE(p_role, role),
    is_read_only = COALESCE(p_is_read_only, is_read_only),
    can_manage_billing = COALESCE(p_can_manage_billing, can_manage_billing),
    can_manage_users = COALESCE(p_can_manage_users, can_manage_users),
    can_manage_properties = COALESCE(p_can_manage_properties, can_manage_properties),
    can_manage_tenants = COALESCE(p_can_manage_tenants, can_manage_tenants),
    can_manage_finances = COALESCE(p_can_manage_finances, can_manage_finances),
    can_view_analytics = COALESCE(p_can_view_analytics, can_view_analytics),
    can_view_finances = COALESCE(p_can_view_finances, can_view_finances),
    can_view_statements = COALESCE(p_can_view_statements, can_view_statements),
    can_view_rent_payments = COALESCE(p_can_view_rent_payments, can_view_rent_payments),
    can_view_leases = COALESCE(p_can_view_leases, can_view_leases),
    can_view_messages = COALESCE(p_can_view_messages, can_view_messages),
    property_scope = COALESCE(p_property_scope, property_scope),
    property_access = COALESCE(p_property_access, property_access),
    updated_at = now()
  WHERE user_id = p_member_user_id;

  IF p_property_ids IS NOT NULL THEN
    DELETE FROM account_member_properties WHERE member_user_id = p_member_user_id;

    IF p_property_scope = 'selected' OR (p_property_scope IS NULL AND (SELECT property_scope FROM user_settings WHERE user_id = p_member_user_id) = 'selected') THEN
      INSERT INTO account_member_properties (member_user_id, property_id, account_owner_id)
      SELECT p_member_user_id, unnest(p_property_ids), v_member_owner_id;
    END IF;
  END IF;

  SELECT jsonb_build_object(
    'role', role,
    'is_read_only', is_read_only,
    'can_manage_billing', can_manage_billing,
    'can_manage_users', can_manage_users,
    'can_manage_properties', can_manage_properties,
    'can_manage_tenants', can_manage_tenants,
    'can_manage_finances', can_manage_finances,
    'can_view_analytics', can_view_analytics,
    'can_view_finances', can_view_finances,
    'can_view_statements', can_view_statements,
    'can_view_rent_payments', can_view_rent_payments,
    'can_view_leases', can_view_leases,
    'can_view_messages', can_view_messages,
    'property_scope', property_scope,
    'property_access', property_access
  ) INTO v_changes
  FROM user_settings WHERE user_id = p_member_user_id;

  SELECT u.email::text INTO v_member_email
  FROM auth.users u WHERE u.id = p_member_user_id;

  IF v_old_record IS DISTINCT FROM v_changes THEN
    PERFORM log_user_management_action(
      v_caller_uid,
      'member_permissions_updated',
      'Benutzerrechte geaendert',
      p_member_user_id,
      v_member_email,
      jsonb_build_object('old', v_old_record, 'new', v_changes)
    );
  END IF;

  IF p_property_ids IS NOT NULL THEN
    PERFORM log_user_management_action(
      v_caller_uid,
      'member_properties_updated',
      'Immobilienzuordnung geaendert',
      p_member_user_id,
      v_member_email,
      jsonb_build_object('property_ids', p_property_ids, 'property_scope', COALESCE(p_property_scope, (SELECT property_scope FROM user_settings WHERE user_id = p_member_user_id)))
    );
  END IF;
END;
$$;

-- ============================================================
-- PART 4: Recreate deactivate_account_member with audit
-- ============================================================

CREATE OR REPLACE FUNCTION deactivate_account_member(p_member_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_owner_id uuid;
  v_member_role text;
  v_caller_uid uuid := (SELECT auth.uid());
  v_member_email text;
BEGIN
  SELECT account_owner_id, role INTO v_member_owner_id, v_member_role
  FROM user_settings
  WHERE user_id = p_member_user_id AND removed_at IS NULL;

  IF v_member_owner_id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF v_member_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot deactivate the account owner';
  END IF;

  IF v_caller_uid != v_member_owner_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_id = v_caller_uid
        AND account_owner_id = v_member_owner_id
        AND can_manage_users = true
        AND is_active_member = true
        AND removed_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;

  UPDATE user_settings
  SET is_active_member = false, updated_at = now()
  WHERE user_id = p_member_user_id;

  SELECT u.email::text INTO v_member_email
  FROM auth.users u WHERE u.id = p_member_user_id;

  PERFORM log_user_management_action(
    v_caller_uid,
    'member_deactivated',
    'Benutzer deaktiviert',
    p_member_user_id,
    v_member_email
  );
END;
$$;

-- ============================================================
-- PART 5: Recreate reactivate_account_member with audit
-- ============================================================

CREATE OR REPLACE FUNCTION reactivate_account_member(p_member_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_owner_id uuid;
  v_caller_uid uuid := (SELECT auth.uid());
  v_member_email text;
BEGIN
  SELECT account_owner_id INTO v_member_owner_id
  FROM user_settings
  WHERE user_id = p_member_user_id AND removed_at IS NULL;

  IF v_member_owner_id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF v_caller_uid != v_member_owner_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_id = v_caller_uid
        AND account_owner_id = v_member_owner_id
        AND can_manage_users = true
        AND is_active_member = true
        AND removed_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;

  UPDATE user_settings
  SET is_active_member = true, updated_at = now()
  WHERE user_id = p_member_user_id;

  SELECT u.email::text INTO v_member_email
  FROM auth.users u WHERE u.id = p_member_user_id;

  PERFORM log_user_management_action(
    v_caller_uid,
    'member_reactivated',
    'Benutzer reaktiviert',
    p_member_user_id,
    v_member_email
  );
END;
$$;

-- ============================================================
-- PART 6: Recreate remove_account_member with audit
-- ============================================================

CREATE OR REPLACE FUNCTION remove_account_member(p_member_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_owner_id uuid;
  v_member_role text;
  v_caller_uid uuid := (SELECT auth.uid());
  v_member_email text;
BEGIN
  SELECT account_owner_id, role INTO v_member_owner_id, v_member_role
  FROM user_settings
  WHERE user_id = p_member_user_id AND removed_at IS NULL;

  IF v_member_owner_id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF v_member_role = 'owner' THEN
    RAISE EXCEPTION 'Cannot remove the account owner';
  END IF;

  IF v_caller_uid != v_member_owner_id THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_id = v_caller_uid
        AND account_owner_id = v_member_owner_id
        AND can_manage_users = true
        AND is_active_member = true
        AND removed_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;

  SELECT u.email::text INTO v_member_email
  FROM auth.users u WHERE u.id = p_member_user_id;

  PERFORM log_user_management_action(
    v_caller_uid,
    'member_removed',
    'Benutzer entfernt',
    p_member_user_id,
    v_member_email
  );

  UPDATE user_settings
  SET
    removed_at = now(),
    is_active_member = false,
    account_owner_id = NULL,
    updated_at = now()
  WHERE user_id = p_member_user_id;

  DELETE FROM account_member_properties WHERE member_user_id = p_member_user_id;
END;
$$;

-- ============================================================
-- PART 7: Recreate admin_get_users with team_members_count
-- ============================================================

DROP FUNCTION IF EXISTS admin_get_users();

CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE(
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  subscription_plan text,
  subscription_status text,
  first_name text,
  last_name text,
  company_name text,
  properties_count bigint,
  tenants_count bigint,
  is_admin boolean,
  banned boolean,
  ban_reason text,
  customer_number text,
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  newsletter_opt_in boolean,
  team_members_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    CASE
      WHEN ss.status::text IN ('active', 'trialing', 'past_due') THEN 'pro'::text
      WHEN bi.subscription_ends_at IS NOT NULL AND bi.subscription_ends_at > now() THEN 'pro'::text
      WHEN bi.subscription_plan = 'pro' AND bi.subscription_status = 'active' THEN 'pro'::text
      ELSE COALESCE(bi.subscription_plan, 'free')::text
    END AS subscription_plan,
    CASE
      WHEN ss.status::text IN ('active', 'trialing', 'past_due') THEN 'active'::text
      WHEN bi.subscription_ends_at IS NOT NULL AND bi.subscription_ends_at > now() THEN 'active'::text
      WHEN bi.subscription_plan = 'pro' AND bi.subscription_status = 'active' THEN 'active'::text
      ELSE COALESCE(bi.subscription_status, 'inactive')::text
    END AS subscription_status,
    ap.first_name,
    ap.last_name,
    ap.company_name,
    (SELECT COUNT(*) FROM public.properties WHERE properties.user_id = u.id) AS properties_count,
    (SELECT COUNT(*) FROM public.tenants WHERE tenants.user_id = u.id) AS tenants_count,
    EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = u.id) AS is_admin,
    COALESCE(ap.banned, false) AS banned,
    ap.ban_reason,
    ap.customer_number,
    bi.trial_ends_at,
    COALESCE(
      bi.subscription_ends_at,
      CASE WHEN ss.cancel_at_period_end = true AND ss.current_period_end IS NOT NULL
        THEN to_timestamp(ss.current_period_end)
        ELSE NULL
      END
    ) AS subscription_ends_at,
    COALESCE(ap.newsletter_opt_in, false) AS newsletter_opt_in,
    (SELECT COUNT(*) FROM public.user_settings us
     WHERE us.account_owner_id = u.id
       AND us.removed_at IS NULL
       AND us.role != 'owner'
    ) AS team_members_count
  FROM auth.users u
  LEFT JOIN public.billing_info bi ON bi.user_id = u.id
  LEFT JOIN public.account_profiles ap ON ap.user_id = u.id
  LEFT JOIN public.stripe_customers sc ON sc.user_id = u.id
  LEFT JOIN public.stripe_subscriptions ss ON ss.customer_id = sc.customer_id
  ORDER BY u.created_at DESC;
END;
$$;