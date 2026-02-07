/*
  # Move unread threads to inbox and enforce via trigger

  1. Data Fix
    - Move all existing unread threads from 'sent' and 'unknown' folders to 'inbox'

  2. New Trigger
    - `move_unread_to_inbox_trigger` on `mail_threads`
      - Fires BEFORE INSERT or UPDATE
      - When status is 'unread', automatically sets folder to 'inbox'
      - Ensures any inbound message reply always appears in the inbox

  3. Important Notes
    - This enforces the rule: unread threads ALWAYS belong in the inbox
    - Sent threads remain in 'sent' only while status is 'read'
    - When a reply arrives and sets status to 'unread', the trigger moves it to inbox
*/

UPDATE mail_threads
SET folder = 'inbox', updated_at = now()
WHERE status = 'unread' AND folder IN ('sent', 'unknown');

CREATE OR REPLACE FUNCTION move_unread_to_inbox()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'unread' THEN
    NEW.folder := 'inbox';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'move_unread_to_inbox_trigger'
  ) THEN
    CREATE TRIGGER move_unread_to_inbox_trigger
      BEFORE INSERT OR UPDATE ON mail_threads
      FOR EACH ROW
      EXECUTE FUNCTION move_unread_to_inbox();
  END IF;
END $$;
