/*
  # Make maintenance_tasks.property_id nullable

  ## Changes
  - Alter `maintenance_tasks.property_id` to allow NULL values
  - This allows creating tasks that are not linked to a specific property
    (e.g. general administrative tasks, personal reminders)

  ## Important Notes
  - No existing data is modified (all existing rows have a property_id set)
  - The foreign key constraint to `properties(id)` is preserved
  - RLS policies are not affected
*/

ALTER TABLE maintenance_tasks ALTER COLUMN property_id DROP NOT NULL;