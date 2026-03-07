/*
  # Fix RLS infinite recursion on user_settings

  ## Problem
  Multiple RLS policies across many tables contain inline subqueries against
  `user_settings`. The "Managers can view team member settings" policy on
  `user_settings` itself also subqueries `user_settings`, creating an infinite
  recursion chain:
    query user_settings -> evaluate "Managers can view" policy -> query user_settings -> ...

  This causes error 42P17 "infinite recursion detected in policy for relation user_settings"
  for ALL authenticated queries, completely breaking the application.

  ## Solution
  1. Create SECURITY DEFINER helper functions that bypass RLS when reading
     the current user's own settings from `user_settings`.
  2. Replace all 22 problematic policies with equivalent ones that use these
     helper functions instead of inline subqueries.

  ## New helper functions
  - `get_my_account_owner_id()` - returns the account_owner_id for auth.uid()
  - `is_readable_member_of(owner_id)` - checks if auth.uid() is an active member of owner_id
  - `is_my_manager_for_owner(target_owner_id)` - checks if auth.uid() can manage users for target_owner_id
  - `get_my_referral_code()` - returns the referral code for auth.uid()

  ## Security
  - All helpers are SECURITY DEFINER with restricted search_path
  - They only read the current user's own row in user_settings
  - No policies are weakened - exact same conditions are preserved
  - Owner policies remain completely untouched
*/

-- ============================================================
-- PART 1: Create SECURITY DEFINER helper functions
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_account_owner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT us.account_owner_id
  FROM user_settings us
  WHERE us.user_id = (SELECT auth.uid())
    AND us.account_owner_id IS NOT NULL
    AND us.is_active_member = true
    AND us.removed_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_readable_member_of(owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_settings us
    WHERE us.user_id = (SELECT auth.uid())
      AND us.account_owner_id = owner_id
      AND us.is_active_member = true
      AND us.removed_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION is_my_manager_for_owner(target_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_settings us
    WHERE us.user_id = (SELECT auth.uid())
      AND us.account_owner_id = target_owner_id
      AND us.can_manage_users = true
      AND us.is_active_member = true
      AND us.removed_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION get_my_referral_code()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT us.referral_code
  FROM user_settings us
  WHERE us.user_id = (SELECT auth.uid())
  LIMIT 1;
$$;

-- ============================================================
-- PART 2: Fix user_settings self-referential policy
-- ============================================================

DROP POLICY IF EXISTS "Managers can view team member settings" ON user_settings;

CREATE POLICY "Managers can view team member settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (
    is_my_manager_for_owner(account_owner_id)
  );

-- ============================================================
-- PART 3: Fix properties policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner properties" ON properties;
CREATE POLICY "Account members can view owner properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (
    user_id = get_my_account_owner_id()
    AND can_member_access_property((SELECT auth.uid()), id)
  );

DROP POLICY IF EXISTS "Account members can update owner properties" ON properties;
CREATE POLICY "Account members can update owner properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (
    is_writable_member_of(user_id)
    AND can_member_access_property((SELECT auth.uid()), id)
  )
  WITH CHECK (
    is_writable_member_of(user_id)
  );

-- ============================================================
-- PART 4: Fix tenants policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner tenants" ON tenants;
CREATE POLICY "Account members can view owner tenants"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    user_id = get_my_account_owner_id()
  );

DROP POLICY IF EXISTS "Account members can update owner tenants" ON tenants;
CREATE POLICY "Account members can update owner tenants"
  ON tenants
  FOR UPDATE
  TO authenticated
  USING (is_writable_member_of(user_id))
  WITH CHECK (is_writable_member_of(user_id));

-- ============================================================
-- PART 5: Fix rental_contracts policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner rental contracts" ON rental_contracts;
CREATE POLICY "Account members can view owner rental contracts"
  ON rental_contracts
  FOR SELECT
  TO authenticated
  USING (
    user_id = get_my_account_owner_id()
  );

-- ============================================================
-- PART 6: Fix loans policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner loans" ON loans;
CREATE POLICY "Account members can view owner loans"
  ON loans
  FOR SELECT
  TO authenticated
  USING (
    user_id = get_my_account_owner_id()
  );

-- ============================================================
-- PART 7: Fix tickets policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner tickets" ON tickets;
CREATE POLICY "Account members can view owner tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (
    user_id = get_my_account_owner_id()
  );

-- ============================================================
-- PART 8: Fix rent_payments policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner rent payments" ON rent_payments;
CREATE POLICY "Account members can view owner rent payments"
  ON rent_payments
  FOR SELECT
  TO authenticated
  USING (
    user_id = get_my_account_owner_id()
  );

-- ============================================================
-- PART 9: Fix expenses policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner expenses" ON expenses;
CREATE POLICY "Account members can view owner expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (
    user_id = get_my_account_owner_id()
  );

-- ============================================================
-- PART 10: Fix handover_protocols policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner handover protocols" ON handover_protocols;
CREATE POLICY "Account members can view owner handover protocols"
  ON handover_protocols
  FOR SELECT
  TO authenticated
  USING (
    user_id = get_my_account_owner_id()
  );

-- ============================================================
-- PART 11: Fix property_units policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner property units" ON property_units;
CREATE POLICY "Account members can view owner property units"
  ON property_units
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_units.property_id
        AND p.user_id = get_my_account_owner_id()
    )
  );

-- ============================================================
-- PART 12: Fix documents policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner documents" ON documents;
CREATE POLICY "Account members can view owner documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (
    user_id = get_my_account_owner_id()
  );

-- ============================================================
-- PART 13: Fix meters policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner meters" ON meters;
CREATE POLICY "Account members can view owner meters"
  ON meters
  FOR SELECT
  TO authenticated
  USING (
    user_id = get_my_account_owner_id()
  );

-- ============================================================
-- PART 14: Fix account_profiles policies
-- ============================================================

DROP POLICY IF EXISTS "Owners can view team member profiles" ON account_profiles;
CREATE POLICY "Owners can view team member profiles"
  ON account_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT us2.user_id
      FROM user_settings us2
      WHERE us2.account_owner_id = (SELECT auth.uid())
        AND us2.removed_at IS NULL
    )
  );
-- Note: This policy is evaluated on account_profiles, not user_settings,
-- so the subquery against user_settings will trigger RLS on user_settings.
-- We need a SECURITY DEFINER function for this pattern too.

-- Actually, let's replace it properly:
DROP POLICY IF EXISTS "Owners can view team member profiles" ON account_profiles;
CREATE POLICY "Owners can view team member profiles"
  ON account_profiles
  FOR SELECT
  TO authenticated
  USING (
    is_account_member_of((SELECT auth.uid()), user_id)
  );

-- ============================================================
-- PART 15: Fix income_entries policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner income entries" ON income_entries;
CREATE POLICY "Account members can view owner income entries"
  ON income_entries
  FOR SELECT
  TO authenticated
  USING (
    user_id = get_my_account_owner_id()
  );

-- ============================================================
-- PART 16: Fix operating_cost_statements policies
-- ============================================================

DROP POLICY IF EXISTS "Account members can view owner operating cost statements" ON operating_cost_statements;
CREATE POLICY "Account members can view owner operating cost statements"
  ON operating_cost_statements
  FOR SELECT
  TO authenticated
  USING (
    user_id = get_my_account_owner_id()
  );

-- ============================================================
-- PART 17: Fix referral_click_events policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view own referral clicks" ON referral_click_events;
CREATE POLICY "Users can view own referral clicks"
  ON referral_click_events
  FOR SELECT
  TO authenticated
  USING (
    referral_code = get_my_referral_code()
    OR referral_code IN (
      SELECT a.affiliate_code FROM affiliates a WHERE a.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- PART 18: Fix account_invitations policies
-- ============================================================

DROP POLICY IF EXISTS "Owners can insert invitations" ON account_invitations;
CREATE POLICY "Owners can insert invitations"
  ON account_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    account_owner_id = (SELECT auth.uid())
    OR is_my_manager_for_owner(account_owner_id)
  );

DROP POLICY IF EXISTS "Owners can update their invitations" ON account_invitations;
CREATE POLICY "Owners can update their invitations"
  ON account_invitations
  FOR UPDATE
  TO authenticated
  USING (
    account_owner_id = (SELECT auth.uid())
    OR is_my_manager_for_owner(account_owner_id)
  )
  WITH CHECK (
    account_owner_id = (SELECT auth.uid())
    OR is_my_manager_for_owner(account_owner_id)
  );

DROP POLICY IF EXISTS "Users with can_manage_users can view invitations" ON account_invitations;
CREATE POLICY "Users with can_manage_users can view invitations"
  ON account_invitations
  FOR SELECT
  TO authenticated
  USING (
    is_my_manager_for_owner(account_owner_id)
  );

-- ============================================================
-- PART 19: Fix account_member_properties policies
-- ============================================================

DROP POLICY IF EXISTS "Owners can manage member property assignments" ON account_member_properties;
CREATE POLICY "Owners can manage member property assignments"
  ON account_member_properties
  FOR ALL
  TO authenticated
  USING (
    account_owner_id = (SELECT auth.uid())
    OR is_my_manager_for_owner(account_owner_id)
  )
  WITH CHECK (
    account_owner_id = (SELECT auth.uid())
    OR is_my_manager_for_owner(account_owner_id)
  );
