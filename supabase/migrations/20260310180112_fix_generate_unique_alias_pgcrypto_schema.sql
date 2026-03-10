/*
  # Fix generate_unique_alias: gen_random_bytes not found

  ## Problem
  The `generate_unique_alias` function calls `gen_random_bytes(2)` from
  pgcrypto, but pgcrypto is installed in the `extensions` schema while
  the function's search_path is set to `public` only.

  This caused the `handle_new_user_mailbox` trigger to fail during
  registration, preventing the creation of user mailboxes.

  ## Fix
  Replace `gen_random_bytes(2)` with `substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)`
  which uses the built-in `gen_random_uuid()` function (always available,
  no extension needed) to generate a random 4-character hex suffix.
*/

CREATE OR REPLACE FUNCTION generate_unique_alias(base_alias TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate TEXT;
  suffix TEXT;
  attempts INT := 0;
BEGIN
  candidate := base_alias;

  LOOP
    IF NOT EXISTS (SELECT 1 FROM user_mailboxes WHERE alias_localpart = candidate)
       AND NOT EXISTS (SELECT 1 FROM reserved_email_aliases WHERE alias_localpart = candidate)
    THEN
      RETURN candidate;
    END IF;

    attempts := attempts + 1;
    IF attempts > 50 THEN
      RAISE EXCEPTION 'Could not generate unique alias after 50 attempts for base: %', base_alias;
    END IF;

    suffix := '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
    candidate := left(base_alias, 59) || suffix;
  END LOOP;
END;
$$;
