/*
  # Fix invitation lookup - add service role policy

  ## Problem  
  The `handle_new_user` trigger (running as postgres via SECURITY DEFINER)
  cannot read `account_invitations` due to RLS. The `SET role` approach
  is not allowed within security-definer functions.

  ## Fix
  1. Remove the `SET role` from helper functions
  2. Add a SELECT policy for the `postgres` role on `account_invitations`
     so the trigger can read invitations during user creation
  3. Also add a policy for UPDATE so the trigger can mark invitations as accepted

  ## Security Changes
  - Add SELECT policy for `postgres` on `account_invitations`
  - Add UPDATE policy for `postgres` on `account_invitations`
*/

-- Fix the helper functions: remove SET role
CREATE OR REPLACE FUNCTION public.lookup_pending_invitation(p_token text)
RETURNS SETOF account_invitations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM account_invitations
  WHERE token = p_token
  AND status = 'pending'
  AND expires_at > now()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.lookup_pending_invitation_by_email(p_email text)
RETURNS SETOF account_invitations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM account_invitations
  WHERE invited_email = p_email
  AND status = 'pending'
  AND expires_at > now()
  LIMIT 1;
$$;

-- Add policies for postgres role (used by SECURITY DEFINER trigger functions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'account_invitations'::regclass
    AND polname = 'Service role can read invitations'
  ) THEN
    CREATE POLICY "Service role can read invitations"
      ON account_invitations
      FOR SELECT
      TO postgres
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'account_invitations'::regclass
    AND polname = 'Service role can update invitations'
  ) THEN
    CREATE POLICY "Service role can update invitations"
      ON account_invitations
      FOR UPDATE
      TO postgres
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
