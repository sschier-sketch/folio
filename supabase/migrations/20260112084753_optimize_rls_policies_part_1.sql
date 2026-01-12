/*
  # Optimize RLS Policies - Part 1

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale

  2. Tables Updated
    - contract_documents
    - rent_history
    - deposit_history
    - rent_payment_reminders
    - tenant_communications
*/

-- contract_documents policies
DROP POLICY IF EXISTS "Users can view own contract documents" ON contract_documents;
DROP POLICY IF EXISTS "Users can insert own contract documents" ON contract_documents;
DROP POLICY IF EXISTS "Users can update own contract documents" ON contract_documents;
DROP POLICY IF EXISTS "Users can delete own contract documents" ON contract_documents;

CREATE POLICY "Users can view own contract documents"
  ON contract_documents FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own contract documents"
  ON contract_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own contract documents"
  ON contract_documents FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own contract documents"
  ON contract_documents FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- rent_history policies
DROP POLICY IF EXISTS "Users can view own rent history" ON rent_history;
DROP POLICY IF EXISTS "Users can insert own rent history" ON rent_history;
DROP POLICY IF EXISTS "Users can update own rent history" ON rent_history;
DROP POLICY IF EXISTS "Users can delete own rent history" ON rent_history;

CREATE POLICY "Users can view own rent history"
  ON rent_history FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own rent history"
  ON rent_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own rent history"
  ON rent_history FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own rent history"
  ON rent_history FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- deposit_history policies
DROP POLICY IF EXISTS "Users can view own deposit history" ON deposit_history;
DROP POLICY IF EXISTS "Users can insert own deposit history" ON deposit_history;
DROP POLICY IF EXISTS "Users can update own deposit history" ON deposit_history;
DROP POLICY IF EXISTS "Users can delete own deposit history" ON deposit_history;

CREATE POLICY "Users can view own deposit history"
  ON deposit_history FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own deposit history"
  ON deposit_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own deposit history"
  ON deposit_history FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own deposit history"
  ON deposit_history FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- rent_payment_reminders policies
DROP POLICY IF EXISTS "Users can view own reminders" ON rent_payment_reminders;
DROP POLICY IF EXISTS "Users can insert own reminders" ON rent_payment_reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON rent_payment_reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON rent_payment_reminders;

CREATE POLICY "Users can view own reminders"
  ON rent_payment_reminders FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own reminders"
  ON rent_payment_reminders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own reminders"
  ON rent_payment_reminders FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own reminders"
  ON rent_payment_reminders FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- tenant_communications policies
DROP POLICY IF EXISTS "Users can view own tenant communications" ON tenant_communications;
DROP POLICY IF EXISTS "Users can insert own tenant communications" ON tenant_communications;
DROP POLICY IF EXISTS "Users can update own tenant communications" ON tenant_communications;
DROP POLICY IF EXISTS "Users can delete own tenant communications" ON tenant_communications;

CREATE POLICY "Users can view own tenant communications"
  ON tenant_communications FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own tenant communications"
  ON tenant_communications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own tenant communications"
  ON tenant_communications FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own tenant communications"
  ON tenant_communications FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
