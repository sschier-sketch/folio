/*
  # Prevent Reserved Alias Assignment

  1. Security Enhancement
    - Add trigger to prevent reserved aliases from being assigned to users
    - Ensures data integrity at database level
    - Protects against reserved aliases being assigned through any method

  2. Changes
    - Create trigger function to check against reserved_email_aliases
    - Apply trigger to user_mailboxes INSERT and UPDATE operations
*/

-- Function to prevent reserved alias assignment
CREATE OR REPLACE FUNCTION prevent_reserved_alias_assignment()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reserved_email_aliases
    WHERE alias_localpart = NEW.alias_localpart
  ) THEN
    RAISE EXCEPTION 'Cannot assign reserved alias: %', NEW.alias_localpart;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS check_reserved_alias_before_insert ON user_mailboxes;
DROP TRIGGER IF EXISTS check_reserved_alias_before_update ON user_mailboxes;

-- Create triggers for INSERT and UPDATE
CREATE TRIGGER check_reserved_alias_before_insert
  BEFORE INSERT ON user_mailboxes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_reserved_alias_assignment();

CREATE TRIGGER check_reserved_alias_before_update
  BEFORE UPDATE OF alias_localpart ON user_mailboxes
  FOR EACH ROW
  WHEN (OLD.alias_localpart IS DISTINCT FROM NEW.alias_localpart)
  EXECUTE FUNCTION prevent_reserved_alias_assignment();
