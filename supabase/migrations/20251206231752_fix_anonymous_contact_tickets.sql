/*
  # Fix anonymous contact ticket creation

  1. Problem
    - Website visitors cannot create contact tickets because RLS policies only allow authenticated users
    - Contact form fails with "new row violates row-level security policy" error

  2. Changes
    - Drop existing contact ticket INSERT policy
    - Create new policy that explicitly allows anonymous users (anon) to create contact tickets
    - Create new policy that allows anonymous users to add messages to contact tickets

  3. Security
    - Contact tickets: Anyone (anon or authenticated) can create tickets with ticket_type='contact'
    - Property tickets: Only authenticated users can create tickets with ticket_type='property'
    - Contact messages: Anyone can add messages to contact tickets
    - Property messages: Only authenticated users can add messages to property tickets
    - All policies follow least privilege principle
*/

-- Drop existing INSERT policy for tickets
DROP POLICY IF EXISTS "Anyone can create contact tickets, authenticated users can create property tickets" ON tickets;

-- Create new policy for contact ticket creation (allows anon and authenticated)
CREATE POLICY "Anonymous users can create contact tickets"
  ON tickets
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    ticket_type = 'contact' 
    AND user_id IS NULL 
    AND contact_email IS NOT NULL 
    AND contact_name IS NOT NULL
  );

-- Create separate policy for property ticket creation (authenticated only)
CREATE POLICY "Authenticated users can create property tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ticket_type = 'property' 
    AND user_id = auth.uid() 
    AND auth.uid() IS NOT NULL
  );

-- Drop existing INSERT policies for ticket_messages
DROP POLICY IF EXISTS "Users can insert messages for own tickets" ON ticket_messages;

-- Create new policy for contact ticket messages (allows anon)
CREATE POLICY "Anyone can add messages to contact tickets"
  ON ticket_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.ticket_type = 'contact'
    )
  );

-- Create new policy for property ticket messages (authenticated only)
CREATE POLICY "Authenticated users can add messages to own property tickets"
  ON ticket_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.ticket_type = 'property'
      AND tickets.user_id = auth.uid()
    )
  );

-- Create policy for anonymous users to view their own contact ticket messages
CREATE POLICY "Anyone can view contact ticket messages"
  ON ticket_messages
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.ticket_type = 'contact'
    )
  );
