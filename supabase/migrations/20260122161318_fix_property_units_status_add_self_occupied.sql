/*
  # Fix property_units status constraint to include self_occupied

  This migration updates the status check constraint on the property_units table to include 'self_occupied' as a valid status option.

  1. Changes
    - Drop the existing status check constraint
    - Add new constraint allowing: 'vacant', 'rented', 'maintenance', 'self_occupied'

  2. Notes
    - This does not affect existing data
    - The frontend already uses 'self_occupied' status
*/

-- Drop the old constraint
ALTER TABLE property_units DROP CONSTRAINT IF EXISTS property_units_status_check;

-- Add the new constraint with self_occupied included
ALTER TABLE property_units ADD CONSTRAINT property_units_status_check 
  CHECK (status IN ('vacant', 'rented', 'maintenance', 'self_occupied'));
