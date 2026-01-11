/*
  # Fix expenses category field constraint

  1. Changes
    - Make the `category` column in `expenses` table nullable
    - The application now uses `category_id` (foreign key) instead of the old text `category` field
    - This resolves the NOT NULL constraint violation when inserting new expenses

  2. Notes
    - Existing data is preserved
    - The category_id field is the primary way to categorize expenses
    - The legacy category text field is kept for backwards compatibility but made optional
*/

-- Make category column nullable in expenses table
DO $$
BEGIN
  ALTER TABLE expenses ALTER COLUMN category DROP NOT NULL;
END $$;

-- Set default value for category to empty string for any future legacy code
ALTER TABLE expenses ALTER COLUMN category SET DEFAULT '';
