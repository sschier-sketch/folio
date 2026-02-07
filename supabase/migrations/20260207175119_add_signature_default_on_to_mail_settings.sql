/*
  # Add signature default toggle to user mail settings

  1. Modified Tables
    - `user_mail_settings`
      - Added `signature_default_on` (boolean, default true)
        Controls whether the signature checkbox is checked by default
        when replying to messages

  2. Important Notes
    - Defaults to true so existing users get signatures appended by default
    - Users can toggle this per-reply and change the default in settings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_mail_settings' AND column_name = 'signature_default_on'
  ) THEN
    ALTER TABLE user_mail_settings ADD COLUMN signature_default_on boolean NOT NULL DEFAULT true;
  END IF;
END $$;
