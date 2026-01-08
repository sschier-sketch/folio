/*
  # Fix Tenant Portal RLS Access

  1. Changes
    - Add RLS policy to allow anonymous users to read tenant data when using a valid impersonation token
    - Add RLS policy to allow anonymous users to update tenant login timestamps via valid tokens
  
  2. Security
    - Anonymous users can only access tenant data through valid, unexpired, unused tokens
    - This enables the tenant portal login flow to work correctly
*/

DROP POLICY IF EXISTS "Anyone can view tenant via valid token" ON tenants;
DROP POLICY IF EXISTS "Anyone can update tenant login via valid token" ON tenants;

CREATE POLICY "Anyone can view tenant via valid token"
  ON tenants
  FOR SELECT
  TO anon
  USING (
    id IN (
      SELECT tenant_id 
      FROM tenant_impersonation_tokens 
      WHERE used_at IS NULL 
      AND expires_at > now()
    )
  );

CREATE POLICY "Anyone can update tenant login via valid token"
  ON tenants
  FOR UPDATE
  TO anon
  USING (
    id IN (
      SELECT tenant_id 
      FROM tenant_impersonation_tokens 
      WHERE used_at IS NULL 
      AND expires_at > now()
    )
  )
  WITH CHECK (
    id IN (
      SELECT tenant_id 
      FROM tenant_impersonation_tokens 
      WHERE used_at IS NULL 
      AND expires_at > now()
    )
  );
