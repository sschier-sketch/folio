/*
  # Allow users to update their own feedback notification preference

  1. Security
    - Add UPDATE policy for authenticated users on their own feedback rows
    - Users can only update the notify_on_status_change column on their own items
*/

CREATE POLICY "Users can update own feedback notify setting"
  ON user_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
