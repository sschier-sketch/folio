/*
  # Add custom unit MEA override to operating cost line items

  1. Modified Tables
    - `operating_cost_line_items`
      - `custom_unit_mea` (numeric, nullable) - per-line-item override for the unit's MEA share count.
        When set, this value is used instead of the statement-level alloc_unit_mea for MEA-based allocations.
        This allows charging different MEA counts per cost position (e.g. adding a virtual share for parking).

  2. Important Notes
    - When custom_unit_mea is NULL, the system falls back to the statement's alloc_unit_mea
    - This enables flexible per-position MEA overrides without changing the global allocation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operating_cost_line_items' AND column_name = 'custom_unit_mea'
  ) THEN
    ALTER TABLE operating_cost_line_items ADD COLUMN custom_unit_mea numeric DEFAULT NULL;
  END IF;
END $$;
