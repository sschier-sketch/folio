/*
  # Allow authenticated users to read reserved aliases

  1. Security Changes
    - Add SELECT policy on `reserved_email_aliases` for all authenticated users
    - This allows users to check if an alias is reserved before attempting to use it
    - Write operations remain admin-only
*/

CREATE POLICY "Authenticated users can view reserved aliases"
  ON reserved_email_aliases
  FOR SELECT
  TO authenticated
  USING (true);
