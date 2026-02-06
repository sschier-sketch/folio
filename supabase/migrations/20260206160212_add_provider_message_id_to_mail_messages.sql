/*
  # Add provider_message_id to mail_messages

  1. Modified Tables
    - `mail_messages`
      - `provider_message_id` (text, nullable) -- Resend email ID for tracking delivery

  2. Important Notes
    - Stores the Resend API response ID for outbound emails
    - Enables correlating sent emails with delivery webhooks
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mail_messages' AND column_name = 'provider_message_id'
  ) THEN
    ALTER TABLE mail_messages ADD COLUMN provider_message_id TEXT;
  END IF;
END $$;
