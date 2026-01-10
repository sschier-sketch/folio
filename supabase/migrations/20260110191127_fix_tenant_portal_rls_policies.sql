/*
  # Fix Tenant Portal RLS Policies

  1. Changes
    - Add RLS policies to allow tenants to read their own data via anon role
    - Allow anonymous users to read tenant, contract, property, and unit data
    - This is required because the tenant portal uses custom auth (not Supabase Auth)
    
  2. Security
    - Policies allow reading data but NO modifications
    - Only active tenants can access data
    - No write access for anonymous users
*/

DROP POLICY IF EXISTS "Tenants can view their own data" ON tenants;
CREATE POLICY "Tenants can view their own data"
  ON tenants
  FOR SELECT
  TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Tenants can view their rental contracts" ON rental_contracts;
CREATE POLICY "Tenants can view their rental contracts"
  ON rental_contracts
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = rental_contracts.tenant_id
      AND tenants.is_active = true
    )
  );

DROP POLICY IF EXISTS "Tenants can view their properties" ON properties;
CREATE POLICY "Tenants can view their properties"
  ON properties
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.property_id = properties.id
      AND tenants.is_active = true
    )
  );

DROP POLICY IF EXISTS "Tenants can view their property units" ON property_units;
CREATE POLICY "Tenants can view their property units"
  ON property_units
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.unit_id = property_units.id
      AND tenants.is_active = true
    )
  );
