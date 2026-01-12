/*
  # Optimize RLS Policies - Part 4 (Fixed)

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in RLS policies

  2. Tables Updated
    - operating_costs
    - expenses
    - billing_allocations
    - bank_connections
    - receipts
    - bank_transactions (fixed column name)
*/

-- operating_costs policies
DROP POLICY IF EXISTS "Users can view own operating costs" ON operating_costs;
DROP POLICY IF EXISTS "Users can insert own operating costs" ON operating_costs;
DROP POLICY IF EXISTS "Users can update own operating costs" ON operating_costs;
DROP POLICY IF EXISTS "Users can delete own operating costs" ON operating_costs;

CREATE POLICY "Users can view own operating costs"
  ON operating_costs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_periods
      JOIN properties ON properties.id = billing_periods.property_id
      WHERE billing_periods.id = operating_costs.billing_period_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own operating costs"
  ON operating_costs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_periods
      JOIN properties ON properties.id = billing_periods.property_id
      WHERE billing_periods.id = operating_costs.billing_period_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own operating costs"
  ON operating_costs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_periods
      JOIN properties ON properties.id = billing_periods.property_id
      WHERE billing_periods.id = operating_costs.billing_period_id
      AND properties.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_periods
      JOIN properties ON properties.id = billing_periods.property_id
      WHERE billing_periods.id = operating_costs.billing_period_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own operating costs"
  ON operating_costs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_periods
      JOIN properties ON properties.id = billing_periods.property_id
      WHERE billing_periods.id = operating_costs.billing_period_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

-- expenses policies
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- billing_allocations policies
DROP POLICY IF EXISTS "Users can view own billing allocations" ON billing_allocations;
DROP POLICY IF EXISTS "Users can insert own billing allocations" ON billing_allocations;
DROP POLICY IF EXISTS "Users can update own billing allocations" ON billing_allocations;
DROP POLICY IF EXISTS "Users can delete own billing allocations" ON billing_allocations;

CREATE POLICY "Users can view own billing allocations"
  ON billing_allocations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_periods
      JOIN properties ON properties.id = billing_periods.property_id
      WHERE billing_periods.id = billing_allocations.billing_period_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own billing allocations"
  ON billing_allocations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_periods
      JOIN properties ON properties.id = billing_periods.property_id
      WHERE billing_periods.id = billing_allocations.billing_period_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own billing allocations"
  ON billing_allocations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_periods
      JOIN properties ON properties.id = billing_periods.property_id
      WHERE billing_periods.id = billing_allocations.billing_period_id
      AND properties.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_periods
      JOIN properties ON properties.id = billing_periods.property_id
      WHERE billing_periods.id = billing_allocations.billing_period_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own billing allocations"
  ON billing_allocations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_periods
      JOIN properties ON properties.id = billing_periods.property_id
      WHERE billing_periods.id = billing_allocations.billing_period_id
      AND properties.user_id = (SELECT auth.uid())
    )
  );

-- bank_connections policies
DROP POLICY IF EXISTS "Users can view own bank connections" ON bank_connections;
DROP POLICY IF EXISTS "Users can insert own bank connections" ON bank_connections;
DROP POLICY IF EXISTS "Users can update own bank connections" ON bank_connections;
DROP POLICY IF EXISTS "Users can delete own bank connections" ON bank_connections;

CREATE POLICY "Users can view own bank connections"
  ON bank_connections FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own bank connections"
  ON bank_connections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own bank connections"
  ON bank_connections FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own bank connections"
  ON bank_connections FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- receipts policies
DROP POLICY IF EXISTS "Users can view own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can insert own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can update own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can delete own receipts" ON receipts;

CREATE POLICY "Users can view own receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own receipts"
  ON receipts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own receipts"
  ON receipts FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own receipts"
  ON receipts FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- bank_transactions policies (fixed: using bank_connection_id instead of connection_id)
DROP POLICY IF EXISTS "Users can view own bank transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Users can insert own bank transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Users can update own bank transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Users can delete own bank transactions" ON bank_transactions;

CREATE POLICY "Users can view own bank transactions"
  ON bank_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bank_connections
      WHERE bank_connections.id = bank_transactions.bank_connection_id
      AND bank_connections.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert own bank transactions"
  ON bank_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_connections
      WHERE bank_connections.id = bank_transactions.bank_connection_id
      AND bank_connections.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own bank transactions"
  ON bank_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bank_connections
      WHERE bank_connections.id = bank_transactions.bank_connection_id
      AND bank_connections.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_connections
      WHERE bank_connections.id = bank_transactions.bank_connection_id
      AND bank_connections.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own bank transactions"
  ON bank_transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bank_connections
      WHERE bank_connections.id = bank_transactions.bank_connection_id
      AND bank_connections.user_id = (SELECT auth.uid())
    )
  );
