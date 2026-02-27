/*
  # Fix bank_tx_fingerprint function to use explicit pgcrypto schema

  The digest() function from pgcrypto is installed in the extensions schema.
  This migration updates the function to use the fully qualified reference.
*/

CREATE OR REPLACE FUNCTION public.bank_tx_fingerprint(
  p_user_id uuid,
  p_booking_date date,
  p_amount numeric,
  p_iban text,
  p_usage text,
  p_reference text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN encode(
    extensions.digest(
      p_user_id::text
        || '|' || COALESCE(p_booking_date::text, '')
        || '|' || COALESCE(p_amount::text, '')
        || '|' || COALESCE(UPPER(TRIM(p_iban)), '')
        || '|' || COALESCE(LEFT(TRIM(p_usage), 140), '')
        || '|' || COALESCE(TRIM(p_reference), ''),
      'sha256'
    ),
    'hex'
  );
END;
$$;
