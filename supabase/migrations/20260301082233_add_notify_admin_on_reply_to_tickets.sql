/*
  # Add notify_admin_on_reply flag to tickets

  1. Changes
    - Adds `notify_admin_on_reply` boolean column to `tickets` table
    - Defaults to `false`
    - When enabled on a ticket, the admin receives an email notification
      at the configured system notification_email whenever the contact
      replies to that ticket

  2. Important Notes
    - No data loss, purely additive change
    - Existing tickets default to not sending notifications
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'notify_admin_on_reply'
  ) THEN
    ALTER TABLE tickets ADD COLUMN notify_admin_on_reply boolean NOT NULL DEFAULT false;
  END IF;
END $$;
