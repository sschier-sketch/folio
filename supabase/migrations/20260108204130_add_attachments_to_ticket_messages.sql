/*
  # Add Attachments to Ticket Messages

  1. Changes
    - Add attachments column to ticket_messages table to store image attachments
  
  2. Details
    - Column stores array of attachment objects with filename, url, and size
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_messages' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE ticket_messages ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
