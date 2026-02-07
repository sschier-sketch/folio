/*
  # Sync landlord mail replies to ticket_messages

  1. Purpose
    - When a landlord replies to a ticket-originated thread in the Messages module,
      the reply must also appear in the tenant portal's ticket conversation.
    - The tenant portal reads from `ticket_messages`, but replies via the mail system
      are stored in `mail_messages`. This trigger bridges the gap.

  2. Trigger Function
    - `sync_outbound_mail_to_ticket_messages()`: After INSERT on `mail_messages`,
      checks if the thread has a `ticket_id`. If so, and the message is outbound
      (landlord reply), inserts a corresponding row into `ticket_messages`.

  3. Security
    - Uses SECURITY DEFINER to ensure insert permission
    - Only triggers for outbound messages on ticket-linked threads
*/

CREATE OR REPLACE FUNCTION sync_outbound_mail_to_ticket_messages()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_ticket_id uuid;
  v_user_name text;
  v_user_email text;
BEGIN
  IF NEW.direction <> 'outbound' THEN
    RETURN NEW;
  END IF;

  SELECT mt.ticket_id
  INTO v_ticket_id
  FROM mail_threads mt
  WHERE mt.id = NEW.thread_id
  AND mt.ticket_id IS NOT NULL;

  IF v_ticket_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(ap.company_name, TRIM(COALESCE(ap.first_name, '') || ' ' || COALESCE(ap.last_name, '')), 'Vermieter'),
    au.email
  INTO v_user_name, v_user_email
  FROM auth.users au
  LEFT JOIN account_profiles ap ON ap.user_id = au.id
  WHERE au.id = NEW.user_id;

  INSERT INTO ticket_messages (
    ticket_id,
    sender_type,
    sender_name,
    sender_email,
    message
  ) VALUES (
    v_ticket_id,
    'landlord',
    COALESCE(v_user_name, 'Vermieter'),
    COALESCE(v_user_email, ''),
    NEW.body_text
  );

  UPDATE tickets SET
    updated_at = now(),
    answered_at = now()
  WHERE id = v_ticket_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_outbound_mail_to_ticket_messages ON mail_messages;
CREATE TRIGGER trigger_sync_outbound_mail_to_ticket_messages
  AFTER INSERT ON mail_messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_outbound_mail_to_ticket_messages();
