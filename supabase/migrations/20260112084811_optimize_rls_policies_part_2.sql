/*
  # Optimize RLS Policies - Part 2

  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - Improves query performance at scale

  2. Tables Updated
    - handover_protocols
    - tickets
    - ticket_messages
    - admin_users
*/

-- handover_protocols policies - removing duplicates and optimizing
DROP POLICY IF EXISTS "Users can view own handover protocols" ON handover_protocols;
DROP POLICY IF EXISTS "Users can view own protocols" ON handover_protocols;
DROP POLICY IF EXISTS "Users can insert own handover protocols" ON handover_protocols;
DROP POLICY IF EXISTS "Users can insert own protocols" ON handover_protocols;
DROP POLICY IF EXISTS "Users can update own handover protocols" ON handover_protocols;
DROP POLICY IF EXISTS "Users can update own protocols" ON handover_protocols;
DROP POLICY IF EXISTS "Users can delete own handover protocols" ON handover_protocols;
DROP POLICY IF EXISTS "Users can delete own protocols" ON handover_protocols;

CREATE POLICY "Users can view own handover protocols"
  ON handover_protocols FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own handover protocols"
  ON handover_protocols FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own handover protocols"
  ON handover_protocols FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own handover protocols"
  ON handover_protocols FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- tickets policies
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON tickets;
DROP POLICY IF EXISTS "auth_insert_tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;

CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "auth_insert_tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ticket_messages policies
DROP POLICY IF EXISTS "Users can view ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "auth_insert_messages" ON ticket_messages;

CREATE POLICY "Users can view ticket messages"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "auth_insert_messages"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.user_id = (SELECT auth.uid())
    )
  );

-- admin_users policies
DROP POLICY IF EXISTS "Users can view own admin status" ON admin_users;

CREATE POLICY "Users can view own admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
