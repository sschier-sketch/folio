/*
  # Add hero_image_alt to mag_posts

  1. Changes
    - Adds `hero_image_alt` column (text, nullable) to `mag_posts` table
    - Allows editors to specify alt text for hero images for better SEO and accessibility

  2. Important
    - No existing data is modified
    - Column is nullable, so existing posts are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mag_posts' AND column_name = 'hero_image_alt'
  ) THEN
    ALTER TABLE mag_posts ADD COLUMN hero_image_alt text;
  END IF;
END $$;
