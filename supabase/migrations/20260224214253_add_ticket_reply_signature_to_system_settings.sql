/*
  # Add ticket reply signature to system settings

  1. Changes
    - Adds `ticket_reply_signature` column to `system_settings` table
    - This allows admins to configure a default signature that is pre-filled
      when replying to support tickets

  2. Notes
    - Column is nullable (no signature by default)
    - Text type to allow multi-line signatures
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'ticket_reply_signature'
  ) THEN
    ALTER TABLE system_settings ADD COLUMN ticket_reply_signature text DEFAULT NULL;
  END IF;
END $$;
