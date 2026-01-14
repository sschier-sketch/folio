/*
  # Fix Feedback Delete and Contact Form Issues

  ## Changes
    1. Add DELETE policy for admins on user_feedback table
    2. Restore anonymous contact ticket creation policies
    3. Restore anonymous contact ticket message creation policies

  ## Details
    - Admins can now delete feedback entries
    - Anonymous users (not logged in) can create contact form tickets again
    - Anonymous users can add messages to contact tickets
*/

-- =====================================================
-- 1. ADD DELETE POLICY FOR FEEDBACK
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Admins can delete feedback' 
    AND tablename = 'user_feedback'
  ) THEN
    CREATE POLICY "Admins can delete feedback"
      ON public.user_feedback FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_settings
          WHERE user_settings.user_id = (SELECT auth.uid())
          AND user_settings.role = 'admin'
        )
      );
  END IF;
END $$;

-- =====================================================
-- 2. RESTORE ANONYMOUS CONTACT TICKET CREATION
-- =====================================================

-- Drop existing conflicting policy
DROP POLICY IF EXISTS "auth_insert_tickets" ON tickets;

-- Recreate policy for authenticated property tickets
CREATE POLICY "auth_insert_tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    (ticket_type = 'property' AND user_id = (SELECT auth.uid()))
    OR
    (ticket_type = 'contact' AND user_id IS NULL)
  );

-- Create policy for anonymous contact ticket creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'anon_insert_contact_tickets' 
    AND tablename = 'tickets'
  ) THEN
    CREATE POLICY "anon_insert_contact_tickets"
      ON tickets FOR INSERT
      TO anon
      WITH CHECK (
        ticket_type = 'contact' 
        AND user_id IS NULL 
        AND contact_email IS NOT NULL 
        AND contact_name IS NOT NULL
      );
  END IF;
END $$;

-- =====================================================
-- 3. RESTORE ANONYMOUS TICKET MESSAGE CREATION
-- =====================================================

-- Drop existing policy
DROP POLICY IF EXISTS "auth_insert_messages" ON ticket_messages;

-- Recreate policy for authenticated users
CREATE POLICY "auth_insert_messages"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND (
        tickets.user_id = (SELECT auth.uid())
        OR tickets.ticket_type = 'contact'
      )
    )
  );

-- Create policy for anonymous contact ticket messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'anon_insert_contact_messages' 
    AND tablename = 'ticket_messages'
  ) THEN
    CREATE POLICY "anon_insert_contact_messages"
      ON ticket_messages FOR INSERT
      TO anon
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM tickets
          WHERE tickets.id = ticket_messages.ticket_id
          AND tickets.ticket_type = 'contact'
        )
      );
  END IF;
END $$;
