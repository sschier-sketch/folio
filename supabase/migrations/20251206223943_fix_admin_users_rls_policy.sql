/*
  # Fix Admin Users RLS Policy

  1. Changes
    - Drop the existing circular RLS policy
    - Create a simple policy that allows users to view their own admin status
    
  2. Security
    - Users can only view their own admin_users record
    - No circular dependency in the policy logic
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;

-- Create a simple policy that allows users to view their own admin status
CREATE POLICY "Users can view own admin status"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
