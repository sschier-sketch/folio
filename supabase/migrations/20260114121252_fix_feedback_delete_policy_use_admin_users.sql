/*
  # Fix Feedback Delete Policy

  ## Changes
    - Fix DELETE policy for user_feedback to use admin_users table instead of user_settings
    - Fix UPDATE policy for user_feedback to use admin_users table instead of user_settings

  ## Details
    The admin system uses the admin_users table, not user_settings, so the policies need to be updated
*/

-- Drop old policies
DROP POLICY IF EXISTS "Admins can delete feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admins can update feedback" ON public.user_feedback;

-- Recreate DELETE policy with correct admin check
CREATE POLICY "Admins can delete feedback"
  ON public.user_feedback FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- Recreate UPDATE policy with correct admin check
CREATE POLICY "Admins can update feedback"
  ON public.user_feedback FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );
