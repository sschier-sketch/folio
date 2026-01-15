/*
  # Add Admin Ticket Delete Policy

  1. Changes
    - Add DELETE policy for admins to delete all tickets
    - This allows admins to manage and clean up contact tickets

  2. Security
    - Policy requires user to be in admin_users table
    - Only authenticated users with admin privileges can delete tickets
*/

CREATE POLICY "Admins can delete all tickets"
  ON tickets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );
