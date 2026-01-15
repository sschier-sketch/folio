/*
  # Fix Admin Ticket Update Policy

  1. Changes
    - Add UPDATE policy for admins to update all tickets (especially contact tickets)
    - This allows admins to change the status of contact tickets which have user_id = NULL

  2. Security
    - Policy requires user to be in admin_users table
    - Only authenticated users with admin privileges can update tickets
*/

CREATE POLICY "Admins can update all tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );
