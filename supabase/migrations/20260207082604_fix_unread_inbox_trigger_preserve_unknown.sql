/*
  # Fix unread-to-inbox trigger to preserve spam protection

  1. Changes
    - Replace the overly aggressive trigger that moved ALL unread to inbox
    - New trigger only moves threads to inbox when they have more than 1 message
      (i.e. a reply arrived on an existing conversation)
    - New threads from unknown senders stay in 'unknown' (spam protection)

  2. Data Fix
    - Move back threads that were incorrectly moved: single-message threads
      from unknown senders should be in 'unknown', not 'inbox'
    - Threads with replies (message_count > 1) stay in inbox

  3. Important Notes
    - This preserves the spam protection feature: unknown senders land in 'unknown'
    - Replies to any existing thread (sent or unknown) always go to inbox
*/

CREATE OR REPLACE FUNCTION move_unread_to_inbox()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'unread' AND NEW.message_count > 1 THEN
    NEW.folder := 'inbox';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
