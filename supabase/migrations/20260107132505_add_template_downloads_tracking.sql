/*
  # Add Download Tracking to Templates

  1. Changes
    - Add `download_count` column to templates table
    - Add index on download_count for analytics

  2. Purpose
    - Track how many times each template has been downloaded
    - Allow admins to see popular templates
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'templates' AND column_name = 'download_count'
  ) THEN
    ALTER TABLE templates ADD COLUMN download_count integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS templates_download_count_idx ON templates(download_count DESC);