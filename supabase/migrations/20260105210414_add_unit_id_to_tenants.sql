/*
  # Add unit_id to tenants table

  1. Changes
    - Add `unit_id` column to tenants table
    - References property_units(id) with ON DELETE SET NULL
    - Nullable field to support tenants without specific unit assignment

  2. Security
    - No RLS changes needed (inherits from existing policies)
*/

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES property_units(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_unit_id ON tenants(unit_id);
