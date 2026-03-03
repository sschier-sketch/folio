/*
  # Add notification columns to loans table

  1. Modified Tables
    - `loans`
      - `email_notification_enabled` (boolean, default true) - Whether to send email reminders for this loan
      - `notification_days_before` (integer, default 90) - How many days before end date to send reminder

  2. Important Notes
    - These columns are referenced by the LoanModal frontend component but were missing from the table
    - This caused PGRST204 errors when users tried to create or edit loans
    - Using IF NOT EXISTS to prevent errors if columns already exist
    - Non-destructive, additive change only
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'email_notification_enabled'
  ) THEN
    ALTER TABLE loans ADD COLUMN email_notification_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'loans' AND column_name = 'notification_days_before'
  ) THEN
    ALTER TABLE loans ADD COLUMN notification_days_before integer DEFAULT 90;
  END IF;
END $$;
