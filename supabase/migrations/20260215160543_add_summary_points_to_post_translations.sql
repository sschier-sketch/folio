/*
  # Add summary points to magazine post translations

  1. Modified Tables
    - `mag_post_translations`
      - Added `summary_points` (jsonb) - Array of bullet point strings for article summary box

  2. Notes
    - summary_points stores an array of strings shown as bullet points at the top of an article
    - Defaults to empty array so existing articles are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mag_post_translations' AND column_name = 'summary_points'
  ) THEN
    ALTER TABLE mag_post_translations ADD COLUMN summary_points jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
