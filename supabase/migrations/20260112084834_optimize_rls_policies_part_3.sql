/*
  # Optimize RLS Policies - Part 3

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in RLS policies

  2. Tables Updated
    - property_units
    - property_documents
    - property_history
    - maintenance_tasks
    - billing_periods
    - cost_types
*/

-- property_units policies
DROP POLICY IF EXISTS "Users can view own property units" ON property_units;
DROP POLICY IF EXISTS "Users can insert own property units" ON property_units;
DROP POLICY IF EXISTS "Users can update own property units" ON property_units;
DROP POLICY IF EXISTS "Users can delete own property units" ON property_units;

CREATE POLICY "Users can view own property units"
  ON property_units FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_units.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own property units"
  ON property_units FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_units.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own property units"
  ON property_units FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_units.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_units.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own property units"
  ON property_units FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_units.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

-- property_documents policies
DROP POLICY IF EXISTS "Users can view own property documents" ON property_documents;
DROP POLICY IF EXISTS "Users can insert own property documents" ON property_documents;
DROP POLICY IF EXISTS "Users can update own property documents" ON property_documents;
DROP POLICY IF EXISTS "Users can delete own property documents" ON property_documents;

CREATE POLICY "Users can view own property documents"
  ON property_documents FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own property documents"
  ON property_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own property documents"
  ON property_documents FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own property documents"
  ON property_documents FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- property_history policies
DROP POLICY IF EXISTS "Users can view own property history" ON property_history;
DROP POLICY IF EXISTS "Users can insert own property history" ON property_history;

CREATE POLICY "Users can view own property history"
  ON property_history FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own property history"
  ON property_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- maintenance_tasks policies
DROP POLICY IF EXISTS "Users can view own maintenance tasks" ON maintenance_tasks;
DROP POLICY IF EXISTS "Users can insert own maintenance tasks" ON maintenance_tasks;
DROP POLICY IF EXISTS "Users can update own maintenance tasks" ON maintenance_tasks;
DROP POLICY IF EXISTS "Users can delete own maintenance tasks" ON maintenance_tasks;

CREATE POLICY "Users can view own maintenance tasks"
  ON maintenance_tasks FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own maintenance tasks"
  ON maintenance_tasks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own maintenance tasks"
  ON maintenance_tasks FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own maintenance tasks"
  ON maintenance_tasks FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- billing_periods policies
DROP POLICY IF EXISTS "Users can view own billing periods" ON billing_periods;
DROP POLICY IF EXISTS "Users can insert own billing periods" ON billing_periods;
DROP POLICY IF EXISTS "Users can update own billing periods" ON billing_periods;
DROP POLICY IF EXISTS "Users can delete own billing periods" ON billing_periods;

CREATE POLICY "Users can view own billing periods"
  ON billing_periods FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = billing_periods.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own billing periods"
  ON billing_periods FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = billing_periods.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own billing periods"
  ON billing_periods FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = billing_periods.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = billing_periods.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own billing periods"
  ON billing_periods FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = billing_periods.property_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

-- cost_types policies
DROP POLICY IF EXISTS "Users can view own cost types" ON cost_types;
DROP POLICY IF EXISTS "Users can insert own cost types" ON cost_types;
DROP POLICY IF EXISTS "Users can update own cost types" ON cost_types;
DROP POLICY IF EXISTS "Users can delete own cost types" ON cost_types;

CREATE POLICY "Users can view own cost types"
  ON cost_types FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own cost types"
  ON cost_types FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own cost types"
  ON cost_types FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own cost types"
  ON cost_types FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
