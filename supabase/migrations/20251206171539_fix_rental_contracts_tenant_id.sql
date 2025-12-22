/*
  # Fix rental_contracts tenant_id constraint

  1. Changes
    - Make `tenant_id` nullable in `rental_contracts` table
      - Allows contracts to be created first, then tenants added
      - Supports multiple tenants per contract via tenants.contract_id
  
  2. Notes
    - Tenants are linked via contract_id in the tenants table
    - This aligns the schema with the current application logic
*/

DO $$
BEGIN
  ALTER TABLE rental_contracts ALTER COLUMN tenant_id DROP NOT NULL;
END $$;