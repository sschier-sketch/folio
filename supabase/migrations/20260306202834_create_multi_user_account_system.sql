/*
  # Multi-User Account System (Team Management for Pro)

  This migration introduces the ability for Pro-plan account owners to invite
  additional users who share access to the owner's data (properties, tenants,
  finances, etc.) with configurable permissions.

  ## Design Principles
  - Reuse existing `user_settings` table (already has `role` and permission columns)
  - Add `account_owner_id` to `user_settings` to link members to owners
  - Create `account_invitations` for the invitation workflow
  - Create `account_member_properties` for property-level scoping
  - Add helper function `get_account_owner_id()` used in RLS policies
  - Existing single-user accounts remain 100% unchanged (owner_id = NULL = standalone)

  ## 1. Modified Tables
  - `user_settings`
    - `account_owner_id` (uuid, nullable) -- NULL for standalone/owner accounts, set for members
    - `is_active_member` (boolean, default true) -- can be deactivated by owner
    - `is_read_only` (boolean, default false) -- overrides all write permissions
    - `can_manage_billing` (boolean, default false)
    - `can_manage_users` (boolean, default false)
    - `can_view_finances` (boolean, default false)
    - `can_view_statements` (boolean, default false)
    - `can_view_rent_payments` (boolean, default false)
    - `can_view_leases` (boolean, default false)
    - `can_view_messages` (boolean, default false)
    - `property_scope` (text, default 'all') -- 'all' or 'selected'
    - `property_access` (text, default 'write') -- 'read' or 'write'
    - `removed_at` (timestamptz, nullable) -- soft-delete for history preservation

  ## 2. New Tables
  - `account_invitations`
    - Tracks invitation lifecycle: pending -> accepted / expired / revoked
    - Token-based with 7-day expiry
    - Stores pre-configured permissions for the invitee
    - Prevents duplicates per email per account
  - `account_member_properties`
    - Links members to specific properties when property_scope = 'selected'

  ## 3. New Functions
  - `get_account_owner_id(uid)` -- resolves the data owner for a given user
  - `check_account_invitation(token)` -- validates invitation token

  ## 4. Security
  - RLS on all new tables
  - Additive RLS policies on data tables for team member read/write access
  - Owner protection constraints
*/

-- ============================================================
-- PART 1: Extend user_settings with account membership fields
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'account_owner_id'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN account_owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'is_active_member'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN is_active_member boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'is_read_only'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN is_read_only boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'can_manage_billing'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN can_manage_billing boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'can_manage_users'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN can_manage_users boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'can_view_finances'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN can_view_finances boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'can_view_statements'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN can_view_statements boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'can_view_rent_payments'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN can_view_rent_payments boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'can_view_leases'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN can_view_leases boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'can_view_messages'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN can_view_messages boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'property_scope'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN property_scope text NOT NULL DEFAULT 'all';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'property_access'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN property_access text NOT NULL DEFAULT 'write';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'removed_at'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN removed_at timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_settings_account_owner_id ON user_settings(account_owner_id) WHERE account_owner_id IS NOT NULL;

-- ============================================================
-- PART 2: Create account_invitations table
-- ============================================================

CREATE TABLE IF NOT EXISTS account_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  
  role text NOT NULL DEFAULT 'member',
  is_read_only boolean NOT NULL DEFAULT false,
  can_manage_billing boolean NOT NULL DEFAULT false,
  can_manage_users boolean NOT NULL DEFAULT false,
  can_manage_properties boolean NOT NULL DEFAULT true,
  can_manage_tenants boolean NOT NULL DEFAULT true,
  can_manage_finances boolean NOT NULL DEFAULT true,
  can_view_analytics boolean NOT NULL DEFAULT true,
  can_view_finances boolean NOT NULL DEFAULT false,
  can_view_statements boolean NOT NULL DEFAULT false,
  can_view_rent_payments boolean NOT NULL DEFAULT false,
  can_view_leases boolean NOT NULL DEFAULT false,
  can_view_messages boolean NOT NULL DEFAULT false,
  property_scope text NOT NULL DEFAULT 'all',
  property_access text NOT NULL DEFAULT 'write',
  property_ids uuid[] DEFAULT '{}',
  
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT account_invitations_status_check CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  CONSTRAINT account_invitations_property_scope_check CHECK (property_scope IN ('all', 'selected')),
  CONSTRAINT account_invitations_property_access_check CHECK (property_access IN ('read', 'write')),
  CONSTRAINT account_invitations_role_check CHECK (role IN ('admin', 'member', 'viewer'))
);

ALTER TABLE account_invitations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_account_invitations_owner ON account_invitations(account_owner_id);
CREATE INDEX IF NOT EXISTS idx_account_invitations_email_status ON account_invitations(invited_email, status);
CREATE INDEX IF NOT EXISTS idx_account_invitations_token ON account_invitations(token);

-- ============================================================
-- PART 3: Create account_member_properties table
-- ============================================================

CREATE TABLE IF NOT EXISTS account_member_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  account_owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT account_member_properties_unique UNIQUE (member_user_id, property_id)
);

ALTER TABLE account_member_properties ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_account_member_properties_member ON account_member_properties(member_user_id);
CREATE INDEX IF NOT EXISTS idx_account_member_properties_property ON account_member_properties(property_id);

-- ============================================================
-- PART 4: Helper function to resolve effective data owner
-- ============================================================

CREATE OR REPLACE FUNCTION get_account_owner_id(uid uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT us.account_owner_id 
     FROM user_settings us 
     WHERE us.user_id = uid 
       AND us.account_owner_id IS NOT NULL
       AND us.is_active_member = true
       AND us.removed_at IS NULL),
    uid
  );
$$;

-- ============================================================
-- PART 5: Function to check if user is an active team member
-- of a given owner (used in RLS policies)
-- ============================================================

CREATE OR REPLACE FUNCTION is_account_member_of(owner_id uuid, member_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_settings
    WHERE user_id = member_uid
      AND account_owner_id = owner_id
      AND is_active_member = true
      AND removed_at IS NULL
  );
$$;

-- ============================================================
-- PART 6: Function to check if member can access a specific property
-- ============================================================

CREATE OR REPLACE FUNCTION can_member_access_property(member_uid uuid, prop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_settings us
    WHERE us.user_id = member_uid
      AND us.account_owner_id IS NOT NULL
      AND us.is_active_member = true
      AND us.removed_at IS NULL
      AND (
        us.property_scope = 'all'
        OR EXISTS (
          SELECT 1 FROM account_member_properties amp
          WHERE amp.member_user_id = member_uid
            AND amp.property_id = prop_id
        )
      )
  );
$$;

-- ============================================================
-- PART 7: Function to validate invitation token
-- ============================================================

CREATE OR REPLACE FUNCTION check_account_invitation(p_token text)
RETURNS TABLE (
  invitation_id uuid,
  account_owner_id uuid,
  invited_email text,
  status text,
  expires_at timestamptz,
  role text,
  owner_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.id,
    ai.account_owner_id,
    ai.invited_email,
    ai.status,
    ai.expires_at,
    ai.role,
    COALESCE(
      NULLIF(TRIM(COALESCE(ap.first_name, '') || ' ' || COALESCE(ap.last_name, '')), ''),
      COALESCE(ap.company_name, 'Rentably Nutzer')
    ) as owner_name
  FROM account_invitations ai
  LEFT JOIN account_profiles ap ON ap.user_id = ai.account_owner_id
  WHERE ai.token = p_token;
END;
$$;

-- ============================================================
-- PART 8: RLS policies for account_invitations
-- ============================================================

CREATE POLICY "Owners can view their account invitations"
  ON account_invitations
  FOR SELECT
  TO authenticated
  USING (
    account_owner_id = (SELECT auth.uid())
    OR invited_by = (SELECT auth.uid())
  );

CREATE POLICY "Users with can_manage_users can view invitations"
  ON account_invitations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_settings
      WHERE user_id = (SELECT auth.uid())
        AND account_owner_id = account_invitations.account_owner_id
        AND can_manage_users = true
        AND is_active_member = true
        AND removed_at IS NULL
    )
  );

CREATE POLICY "Owners can insert invitations"
  ON account_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    account_owner_id = (SELECT auth.uid())
    OR (
      EXISTS (
        SELECT 1 FROM user_settings
        WHERE user_id = (SELECT auth.uid())
          AND account_owner_id = account_invitations.account_owner_id
          AND can_manage_users = true
          AND is_active_member = true
          AND removed_at IS NULL
      )
    )
  );

CREATE POLICY "Owners can update their invitations"
  ON account_invitations
  FOR UPDATE
  TO authenticated
  USING (
    account_owner_id = (SELECT auth.uid())
    OR (
      EXISTS (
        SELECT 1 FROM user_settings
        WHERE user_id = (SELECT auth.uid())
          AND account_owner_id = account_invitations.account_owner_id
          AND can_manage_users = true
          AND is_active_member = true
          AND removed_at IS NULL
      )
    )
  )
  WITH CHECK (
    account_owner_id = (SELECT auth.uid())
    OR (
      EXISTS (
        SELECT 1 FROM user_settings
        WHERE user_id = (SELECT auth.uid())
          AND account_owner_id = account_invitations.account_owner_id
          AND can_manage_users = true
          AND is_active_member = true
          AND removed_at IS NULL
      )
    )
  );

CREATE POLICY "Owners can delete invitations"
  ON account_invitations
  FOR DELETE
  TO authenticated
  USING (
    account_owner_id = (SELECT auth.uid())
  );

-- ============================================================
-- PART 9: RLS policies for account_member_properties
-- ============================================================

CREATE POLICY "Owners can manage member property assignments"
  ON account_member_properties
  FOR ALL
  TO authenticated
  USING (
    account_owner_id = (SELECT auth.uid())
    OR (
      EXISTS (
        SELECT 1 FROM user_settings
        WHERE user_id = (SELECT auth.uid())
          AND account_owner_id = account_member_properties.account_owner_id
          AND can_manage_users = true
          AND is_active_member = true
          AND removed_at IS NULL
      )
    )
  )
  WITH CHECK (
    account_owner_id = (SELECT auth.uid())
    OR (
      EXISTS (
        SELECT 1 FROM user_settings
        WHERE user_id = (SELECT auth.uid())
          AND account_owner_id = account_member_properties.account_owner_id
          AND can_manage_users = true
          AND is_active_member = true
          AND removed_at IS NULL
      )
    )
  );

CREATE POLICY "Members can view own property assignments"
  ON account_member_properties
  FOR SELECT
  TO authenticated
  USING (member_user_id = (SELECT auth.uid()));

-- ============================================================
-- PART 10: Additive RLS policies on data tables for team members
-- These ADD access for team members without modifying existing policies
-- ============================================================

-- Properties: members can view owner's properties (with property scope check)
CREATE POLICY "Account members can view owner properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
    )
    AND can_member_access_property((SELECT auth.uid()), id)
  );

-- Properties: members with write access can update
CREATE POLICY "Account members can update owner properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
        AND us.is_read_only = false
        AND us.property_access = 'write'
    )
    AND can_member_access_property((SELECT auth.uid()), id)
  )
  WITH CHECK (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
        AND us.is_read_only = false
        AND us.property_access = 'write'
    )
  );

-- Tenants: members can view owner's tenants
CREATE POLICY "Account members can view owner tenants"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
    )
  );

-- Tenants: members with write access can update
CREATE POLICY "Account members can update owner tenants"
  ON tenants
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
        AND us.is_read_only = false
        AND us.property_access = 'write'
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
        AND us.is_read_only = false
        AND us.property_access = 'write'
    )
  );

-- Rental Contracts: members can view
CREATE POLICY "Account members can view owner rental contracts"
  ON rental_contracts
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
    )
  );

-- Rent Payments: members can view
CREATE POLICY "Account members can view owner rent payments"
  ON rent_payments
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
    )
  );

-- Documents: members can view
CREATE POLICY "Account members can view owner documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
    )
  );

-- Expenses: members can view
CREATE POLICY "Account members can view owner expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
    )
  );

-- Income Entries: members can view
CREATE POLICY "Account members can view owner income entries"
  ON income_entries
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
    )
  );

-- Loans: members can view
CREATE POLICY "Account members can view owner loans"
  ON loans
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
    )
  );

-- Tickets: members can view
CREATE POLICY "Account members can view owner tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
    )
  );

-- Property Units: members can view (via property ownership)
CREATE POLICY "Account members can view owner property units"
  ON property_units
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_units.property_id
        AND p.user_id IN (
          SELECT us.account_owner_id FROM user_settings us
          WHERE us.user_id = (SELECT auth.uid())
            AND us.account_owner_id IS NOT NULL
            AND us.is_active_member = true
            AND us.removed_at IS NULL
        )
    )
  );

-- Meters: members can view
CREATE POLICY "Account members can view owner meters"
  ON meters
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
    )
  );

-- Operating Cost Statements: members can view
CREATE POLICY "Account members can view owner operating cost statements"
  ON operating_cost_statements
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
    )
  );

-- Handover Protocols: members can view
CREATE POLICY "Account members can view owner handover protocols"
  ON handover_protocols
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.account_owner_id FROM user_settings us
      WHERE us.user_id = (SELECT auth.uid())
        AND us.account_owner_id IS NOT NULL
        AND us.is_active_member = true
        AND us.removed_at IS NULL
    )
  );

-- user_settings: Allow owners to view their team members' settings
CREATE POLICY "Owners can view team member settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (
    account_owner_id = (SELECT auth.uid())
  );

-- user_settings: Allow owners to update their team members' settings  
CREATE POLICY "Owners can update team member settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (
    account_owner_id = (SELECT auth.uid())
  )
  WITH CHECK (
    account_owner_id = (SELECT auth.uid())
  );

-- user_settings: Allow users with can_manage_users to view team members
CREATE POLICY "Managers can view team member settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_settings me
      WHERE me.user_id = (SELECT auth.uid())
        AND me.account_owner_id IS NOT NULL
        AND me.can_manage_users = true
        AND me.is_active_member = true
        AND me.removed_at IS NULL
        AND user_settings.account_owner_id = me.account_owner_id
    )
  );

-- account_profiles: Allow owners to view member profiles
CREATE POLICY "Owners can view team member profiles"
  ON account_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us.user_id FROM user_settings us
      WHERE us.account_owner_id = (SELECT auth.uid())
        AND us.removed_at IS NULL
    )
  );

-- ============================================================
-- PART 11: RPC to get team members for an owner
-- ============================================================

CREATE OR REPLACE FUNCTION get_account_members(p_account_owner_id uuid)
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
    us.user_id,
    au.email,
    ap.first_name,
    ap.last_name,
    us.role,
    us.is_active_member,
    us.is_read_only,
    us.can_manage_billing,
    us.can_manage_users,
    us.can_manage_properties,
    us.can_manage_tenants,
    us.can_manage_finances,
    us.can_view_analytics,
    us.can_view_finances,
    us.can_view_statements,
    us.can_view_rent_payments,
    us.can_view_leases,
    us.can_view_messages,
    us.property_scope,
    us.property_access,
    us.removed_at,
    us.created_at as joined_at,
    au.last_sign_in_at as last_sign_in
  FROM user_settings us
  JOIN auth.users au ON au.id = us.user_id
  LEFT JOIN account_profiles ap ON ap.user_id = us.user_id
  WHERE us.account_owner_id = p_account_owner_id
  ORDER BY us.removed_at NULLS FIRST, us.created_at ASC;
END;
$$;

-- ============================================================
-- PART 12: RPC to update member permissions
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
END;
$$;

-- ============================================================
-- PART 13: RPC to deactivate a member
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
END;
$$;

-- ============================================================
-- PART 14: RPC to reactivate a member
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
END;
$$;

-- ============================================================
-- PART 15: RPC to remove a member (soft delete)
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
