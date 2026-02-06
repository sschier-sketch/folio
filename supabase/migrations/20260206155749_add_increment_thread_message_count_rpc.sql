/*
  # Add RPC to increment thread message count

  1. New Function
    - `increment_thread_message_count(p_thread_id uuid)`
      - Atomically increments `message_count` on a mail_thread by 1
      - SECURITY DEFINER to bypass RLS for internal use from edge functions

  2. Important Notes
    - Used by the inbound email webhook to safely increment counters
    - Does not require auth context (called from service role)
*/

CREATE OR REPLACE FUNCTION increment_thread_message_count(p_thread_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE mail_threads
  SET message_count = message_count + 1
  WHERE id = p_thread_id;
END;
$$;
