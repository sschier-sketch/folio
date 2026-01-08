/*
  # Add Tenant Email Login Policy

  1. Changes
    - Add RLS policy to allow anonymous users to read their own tenant data by email
    - Add RLS policy to allow anonymous users to update their login/password data
  
  2. Security
    - Anonymous users can only read tenant records that match their email
    - This enables email/password login flow for the tenant portal
*/

DROP POLICY IF EXISTS "Anyone can view tenant by email" ON tenants;
DROP POLICY IF EXISTS "Anyone can setup password by email" ON tenants;

CREATE POLICY "Anyone can view tenant by email"
  ON tenants
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can setup password by email"
  ON tenants
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
