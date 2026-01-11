/*
  # Remove category check constraint from expenses table

  1. Changes
    - Drop the `expenses_category_check` constraint
    - This constraint was checking for old enum values but the app now uses `category_id` (foreign key) instead
    - The text `category` field is now legacy/optional and shouldn't have restrictions

  2. Notes
    - The constraint was preventing inserts because the app uses category_id instead of category text field
    - Removing this constraint allows the legacy category field to be empty or null
*/

-- Drop the old category check constraint
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
