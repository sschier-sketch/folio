/*
  # Clean up duplicate ticket policies

  1. Changes
    - Remove duplicate and conflicting RLS policies from tickets table
    - Keep only the necessary policies for contact tickets
    - Ensure anonymous users can create contact tickets

  2. Notes
    - Fixes RLS policy conflict preventing contact form submissions
*/

-- Remove all duplicate INSERT policies
DROP POLICY IF EXISTS "Users can create own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON tickets;

-- Keep only the anonymous contact ticket creation policy
-- (already created in previous migration)

-- Recreate a single INSERT policy for authenticated users
CREATE POLICY "Authenticated users can create tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (ticket_type = 'property' AND user_id = auth.uid()) OR
    (ticket_type = 'contact' AND user_id IS NULL)
  );
