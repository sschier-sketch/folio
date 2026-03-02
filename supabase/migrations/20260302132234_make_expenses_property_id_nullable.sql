/*
  # Make expenses property_id nullable

  1. Changes
    - Alter `expenses.property_id` to allow NULL values
    - This enables recording general expenses (e.g., bank fees, legal costs)
      that are not tied to a specific property

  2. Important Notes
    - No data loss, only removes the NOT NULL constraint
    - Existing rows with property_id values are unaffected
*/

ALTER TABLE expenses ALTER COLUMN property_id DROP NOT NULL;
