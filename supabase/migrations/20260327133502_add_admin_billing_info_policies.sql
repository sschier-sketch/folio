/*
  # Add admin RLS policies for billing_info table

  1. Security Changes
    - Add SELECT policy so admins can view all billing info records
    - Add UPDATE policy so admins can modify billing info (e.g. extend trials)

  2. Important Notes
    - Fixes the issue where admin trial extensions were silently blocked by RLS
    - Uses the standard admin_users check pattern consistent with other tables
    - Does not affect existing user self-access policies
*/

CREATE POLICY "Admins can view all billing info"
  ON billing_info
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all billing info"
  ON billing_info
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
