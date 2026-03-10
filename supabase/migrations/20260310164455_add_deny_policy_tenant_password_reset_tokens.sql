/*
  # Add explicit deny policy for tenant_password_reset_tokens

  1. Security
    - Add explicit deny-all policy for authenticated users on `tenant_password_reset_tokens`
    - This table is only accessed by backend Edge Functions using the service role key
    - Service role bypasses RLS, so backend flows remain unaffected
    - Resolves Supabase security warning about missing policies

  2. No Changes
    - Table structure unchanged
    - Password reset flow unchanged (uses service role key)
*/

CREATE POLICY "Service role only - deny all client access"
  ON public.tenant_password_reset_tokens
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
