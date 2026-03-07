/*
  # Add Admin-only LetterXpress Test Mode Control

  This migration adds a SECURITY DEFINER function that only allows
  admin users (from the admin_users table) to toggle the test mode
  setting on a LetterXpress account.

  1. New Functions
    - `set_letterxpress_test_mode(p_owner_id uuid, p_test_mode boolean)` -
      Sets the is_test_mode flag on a LetterXpress account.
      Only callable by admin users.

  2. Security
    - Checks that the caller exists in the admin_users table
    - Normal users and team members cannot toggle test mode
    - SECURITY DEFINER ensures consistent behavior
*/

CREATE OR REPLACE FUNCTION set_letterxpress_test_mode(
  p_owner_id uuid,
  p_test_mode boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
  v_is_admin boolean;
BEGIN
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM admin_users WHERE user_id = v_caller_id
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can change the test mode setting';
  END IF;

  UPDATE letterxpress_accounts
  SET is_test_mode = p_test_mode,
      updated_at = now()
  WHERE user_id = p_owner_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No LetterXpress configuration found for this account');
  END IF;

  RETURN jsonb_build_object('success', true, 'is_test_mode', p_test_mode);
END;
$$;
