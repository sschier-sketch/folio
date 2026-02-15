/*
  # Add Direktumlage and lt. Verbrauchsabrechnung allocation keys

  1. Changes
    - Extend the allocation_key CHECK constraint on `operating_cost_line_items`
      to also allow 'direct' (Direktumlage) and 'consumption_billing' (lt. Verbrauchsabrechnung)
    - Both keys pass costs 1:1 to the tenant without proportional splitting

  2. Important Notes
    - 'direct' = Direktumlage: costs are forwarded 1:1 to the tenant
    - 'consumption_billing' = lt. Verbrauchsabrechnung: costs taken from external billing, forwarded 1:1
*/

ALTER TABLE operating_cost_line_items
  DROP CONSTRAINT IF EXISTS operating_cost_line_items_allocation_key_check;

ALTER TABLE operating_cost_line_items
  ADD CONSTRAINT operating_cost_line_items_allocation_key_check
  CHECK (allocation_key = ANY (ARRAY[
    'area'::text,
    'persons'::text,
    'units'::text,
    'consumption'::text,
    'mea'::text,
    'direct'::text,
    'consumption_billing'::text
  ]));
