/*
  # Add LetterXpress Credentials Decryption RPC

  This migration adds a SECURITY DEFINER function that decrypts
  LetterXpress API credentials for use by edge functions.

  1. New Functions
    - `get_letterxpress_credentials(p_owner_id uuid)` - Returns decrypted
      username, api_key, and is_test_mode for the given account owner.
      Only callable by the owner themselves or active team members.

  2. Security
    - SECURITY DEFINER ensures vault access works regardless of caller's role
    - Explicit ownership/membership check before returning credentials
    - API key is decrypted only at call time, never stored in plain text
*/

CREATE OR REPLACE FUNCTION get_letterxpress_credentials(p_owner_id uuid)
RETURNS TABLE(username text, api_key text, is_test_mode boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_id uuid;
  v_record record;
BEGIN
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_owner_id != v_caller_id AND NOT is_account_member_of(p_owner_id, v_caller_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT
    la.username,
    la.encrypted_api_key,
    la.is_test_mode,
    la.is_enabled
  INTO v_record
  FROM letterxpress_accounts la
  WHERE la.user_id = p_owner_id;

  IF v_record IS NULL THEN
    RETURN;
  END IF;

  IF NOT v_record.is_enabled THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT
    v_record.username,
    decrypt_letterxpress_api_key(v_record.encrypted_api_key),
    v_record.is_test_mode;
END;
$$;
