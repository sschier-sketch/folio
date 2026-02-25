/*
  # Add category column to email_templates

  1. Modified Tables
    - `email_templates`
      - Added `category` column (text, default 'transactional')
        - Values: 'transactional' or 'marketing'
      - Backfill existing templates with correct category

  2. Notes
    - All existing templates default to 'transactional'
    - Only referral_invitation is categorized as 'marketing'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_templates' AND column_name = 'category'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN category text NOT NULL DEFAULT 'transactional';
  END IF;
END $$;

UPDATE email_templates SET category = 'marketing' WHERE template_key IN ('referral_invitation');
