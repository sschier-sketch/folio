/*
  # Make tickets.user_id nullable for contact tickets

  1. Changes
    - Make user_id column nullable in tickets table
    - Contact tickets from external users don't have a user_id
    - Property tickets will still have user_id set

  2. Notes
    - Preserves existing data
    - Updates check constraint to allow null user_id for contact tickets
*/

-- Make user_id nullable
ALTER TABLE tickets ALTER COLUMN user_id DROP NOT NULL;

-- Update check constraint to handle nullable user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tickets_type_validation'
  ) THEN
    ALTER TABLE tickets DROP CONSTRAINT tickets_type_validation;
  END IF;
END $$;

-- Add new constraint that allows null user_id for contact tickets
ALTER TABLE tickets ADD CONSTRAINT tickets_type_validation CHECK (
  (ticket_type = 'property' AND property_id IS NOT NULL AND user_id IS NOT NULL) OR
  (ticket_type = 'contact' AND contact_email IS NOT NULL AND contact_name IS NOT NULL)
);

-- Update RLS policies to handle nullable user_id
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
CREATE POLICY "Users can view own tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (ticket_type = 'contact' AND EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can create own tickets" ON tickets;
CREATE POLICY "Users can create own tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow anonymous users to create contact tickets
DROP POLICY IF EXISTS "Allow anonymous contact ticket creation" ON tickets;
CREATE POLICY "Allow anonymous contact ticket creation"
  ON tickets
  FOR INSERT
  TO anon
  WITH CHECK (ticket_type = 'contact' AND user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own tickets" ON tickets;
CREATE POLICY "Users can update own tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (ticket_type = 'contact' AND EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    ))
  )
  WITH CHECK (
    user_id = auth.uid() OR
    (ticket_type = 'contact' AND EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    ))
  );

-- Update ticket_messages policies for contact tickets
DROP POLICY IF EXISTS "Allow anonymous contact messages" ON ticket_messages;
CREATE POLICY "Allow anonymous contact messages"
  ON ticket_messages
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_id
      AND tickets.ticket_type = 'contact'
    )
  );

DROP POLICY IF EXISTS "Users can view ticket messages" ON ticket_messages;
CREATE POLICY "Users can view ticket messages"
  ON ticket_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_id
      AND (
        tickets.user_id = auth.uid() OR
        (tickets.ticket_type = 'contact' AND EXISTS (
          SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
        ))
      )
    )
  );

-- Allow admins to insert messages on contact tickets
DROP POLICY IF EXISTS "Admins can insert ticket messages" ON ticket_messages;
CREATE POLICY "Admins can insert ticket messages"
  ON ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_id
      AND tickets.ticket_type = 'contact'
      AND EXISTS (
        SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
      )
    )
  );
