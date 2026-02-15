/*
  # Add Miteigentumsanteil (MEA) allocation key

  1. Modified Tables
    - `operating_cost_line_items`
      - Updated CHECK constraint on `allocation_key` to include 'mea' (Miteigentumsanteil)
  
  2. Changes
    - Drops existing allocation_key check constraint
    - Recreates it with the additional 'mea' value
    - This allows operating cost line items to use co-ownership share (MEA) as allocation key

  3. Important Notes
    - MEA values are stored on property_units.mea as text (e.g. "202/10000")
    - No data is modified, only the constraint is expanded
*/

ALTER TABLE operating_cost_line_items
DROP CONSTRAINT IF EXISTS operating_cost_line_items_allocation_key_check;

ALTER TABLE operating_cost_line_items
ADD CONSTRAINT operating_cost_line_items_allocation_key_check
CHECK (allocation_key IN ('area', 'persons', 'units', 'consumption', 'mea'));
