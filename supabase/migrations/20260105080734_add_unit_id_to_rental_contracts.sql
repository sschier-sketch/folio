-- Add unit_id column to rental_contracts table
ALTER TABLE rental_contracts
ADD COLUMN unit_id uuid REFERENCES property_units(id) ON DELETE SET NULL;