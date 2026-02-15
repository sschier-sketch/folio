/*
  # Add group label to operating cost line items

  1. Modified Tables
    - `operating_cost_line_items`
      - Added `group_label` (text, nullable, default null)
        - Allows grouping line items by source (e.g., "Wohnung", "Stellplatz")
        - Multiple cost statements from different property managers can be combined
        - Null value maintains backwards compatibility with existing items

  2. Important Notes
    - Existing line items will have group_label = null (treated as main/default group)
    - No data migration needed - null is a valid state
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_cost_line_items' AND column_name = 'group_label'
  ) THEN
    ALTER TABLE operating_cost_line_items ADD COLUMN group_label text DEFAULT NULL;
  END IF;
END $$;
