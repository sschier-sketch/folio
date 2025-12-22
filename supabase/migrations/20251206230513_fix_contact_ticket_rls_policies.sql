/*
  # Fix contact ticket RLS policies

  1. Changes
    - Drop all existing INSERT policies for tickets
    - Create new simplified policies that allow contact tickets from anyone
    - Ensure property tickets can only be created by authenticated users

  2. Security
    - Contact tickets can be created by anyone (anon or authenticated)
    - Property tickets require authentication and ownership
    - All policies are restrictive and follow least privilege principle
*/

-- Drop all existing INSERT policies
DROP POLICY IF EXISTS "Allow anonymous contact ticket creation" ON tickets;
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON tickets;

-- Create a single unified INSERT policy for all ticket creation
CREATE POLICY "Anyone can create contact tickets, authenticated users can create property tickets"
  ON tickets
  FOR INSERT
  WITH CHECK (
    -- Contact tickets can be created by anyone (anon or authenticated)
    (ticket_type = 'contact' AND user_id IS NULL AND contact_email IS NOT NULL AND contact_name IS NOT NULL)
    OR
    -- Property tickets can only be created by authenticated users for themselves
    (ticket_type = 'property' AND user_id = auth.uid() AND auth.uid() IS NOT NULL)
  );
