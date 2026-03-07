/*
  # Add member write policies for finance tables

  ## Problem
  Account members with write permissions cannot insert/update/delete records
  on finance tables (expenses, income_entries, rent_payments, index_rent_calculations,
  property_units, property_labels, loans) because existing RLS policies only allow
  `auth.uid() = user_id`. When a member writes with `user_id = account_owner_id`,
  the check fails.

  ## Solution
  Add INSERT, UPDATE, and DELETE policies for active, non-read-only members
  with write property access on each affected table.

  ## Security
  - Only active members (is_active_member=true, removed_at IS NULL)
  - Only non-read-only members (is_read_only=false)
  - Only members with write access (property_access='write')
  - Owner policies remain completely untouched
  - No existing policies are dropped or modified

  ## Affected tables
  - expenses (INSERT, UPDATE, DELETE)
  - income_entries (INSERT, UPDATE, DELETE)
  - rent_payments (INSERT, UPDATE, DELETE)
  - index_rent_calculations (INSERT, UPDATE)
  - property_units (INSERT, UPDATE, DELETE)
  - property_labels (INSERT, DELETE)
  - loans (INSERT, UPDATE, DELETE)
*/

-- Helper: check if current user is a writable member of the given owner
CREATE OR REPLACE FUNCTION is_writable_member_of(owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_settings
    WHERE user_id = (SELECT auth.uid())
      AND account_owner_id = owner_id
      AND is_active_member = true
      AND removed_at IS NULL
      AND is_read_only = false
      AND property_access = 'write'
  );
$$;

-- ========== EXPENSES ==========

CREATE POLICY "Members can insert owner expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (
    is_writable_member_of(user_id)
  );

CREATE POLICY "Members can update owner expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (is_writable_member_of(user_id))
  WITH CHECK (is_writable_member_of(user_id));

CREATE POLICY "Members can delete owner expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (is_writable_member_of(user_id));

-- ========== INCOME_ENTRIES ==========

CREATE POLICY "Members can insert owner income entries"
  ON income_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    is_writable_member_of(user_id)
  );

CREATE POLICY "Members can update owner income entries"
  ON income_entries FOR UPDATE
  TO authenticated
  USING (is_writable_member_of(user_id))
  WITH CHECK (is_writable_member_of(user_id));

CREATE POLICY "Members can delete owner income entries"
  ON income_entries FOR DELETE
  TO authenticated
  USING (is_writable_member_of(user_id));

-- ========== RENT_PAYMENTS ==========

CREATE POLICY "Members can insert owner rent payments"
  ON rent_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    is_writable_member_of(user_id)
  );

CREATE POLICY "Members can update owner rent payments"
  ON rent_payments FOR UPDATE
  TO authenticated
  USING (is_writable_member_of(user_id))
  WITH CHECK (is_writable_member_of(user_id));

CREATE POLICY "Members can delete owner rent payments"
  ON rent_payments FOR DELETE
  TO authenticated
  USING (is_writable_member_of(user_id));

-- ========== INDEX_RENT_CALCULATIONS ==========

CREATE POLICY "Members can insert owner index rent calculations"
  ON index_rent_calculations FOR INSERT
  TO authenticated
  WITH CHECK (
    is_writable_member_of(user_id)
  );

CREATE POLICY "Members can update owner index rent calculations"
  ON index_rent_calculations FOR UPDATE
  TO authenticated
  USING (is_writable_member_of(user_id))
  WITH CHECK (is_writable_member_of(user_id));

-- ========== PROPERTY_UNITS ==========

CREATE POLICY "Members can insert owner property units"
  ON property_units FOR INSERT
  TO authenticated
  WITH CHECK (
    is_writable_member_of(user_id)
  );

CREATE POLICY "Members can update owner property units"
  ON property_units FOR UPDATE
  TO authenticated
  USING (is_writable_member_of(user_id))
  WITH CHECK (is_writable_member_of(user_id));

CREATE POLICY "Members can delete owner property units"
  ON property_units FOR DELETE
  TO authenticated
  USING (is_writable_member_of(user_id));

-- ========== PROPERTY_LABELS ==========

CREATE POLICY "Members can insert owner property labels"
  ON property_labels FOR INSERT
  TO authenticated
  WITH CHECK (
    is_writable_member_of(user_id)
  );

CREATE POLICY "Members can delete owner property labels"
  ON property_labels FOR DELETE
  TO authenticated
  USING (is_writable_member_of(user_id));

-- ========== LOANS ==========

CREATE POLICY "Members can insert owner loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (
    is_writable_member_of(user_id)
  );

CREATE POLICY "Members can update owner loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (is_writable_member_of(user_id))
  WITH CHECK (is_writable_member_of(user_id));

CREATE POLICY "Members can delete owner loans"
  ON loans FOR DELETE
  TO authenticated
  USING (is_writable_member_of(user_id));
