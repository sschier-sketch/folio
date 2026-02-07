/*
  # Add trash folder to mail threads

  1. Modified Tables
    - `mail_threads`
      - Updated `folder` CHECK constraint to include 'trash'
      - Threads can now be moved to trash instead of permanently deleted

  2. New Index
    - `idx_mail_threads_trash` on (user_id, folder) WHERE folder = 'trash'
      for efficient trash folder queries

  3. Important Notes
    - Existing threads are not affected
    - The trash folder acts as a soft-delete mechanism
    - Users can move threads to trash and restore them
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'mail_threads_folder_check'
  ) THEN
    ALTER TABLE mail_threads DROP CONSTRAINT mail_threads_folder_check;
  END IF;
END $$;

ALTER TABLE mail_threads ADD CONSTRAINT mail_threads_folder_check
  CHECK (folder IN ('inbox', 'sent', 'unknown', 'trash'));

CREATE INDEX IF NOT EXISTS idx_mail_threads_trash
  ON mail_threads (user_id, last_message_at DESC)
  WHERE folder = 'trash';
