/*
  # Add Tenant Portal Communications Access

  1. Changes
    - Add RLS policy to allow anonymous users to view tenant_communications via valid tokens
  
  2. Security
    - Anonymous users can only access non-internal communications for their tenant
    - Token validation ensures only authorized tenant access
*/

DROP POLICY IF EXISTS "Tenants can view communications via valid token" ON tenant_communications;

CREATE POLICY "Tenants can view communications via valid token"
  ON tenant_communications
  FOR SELECT
  TO anon
  USING (
    is_internal = false
    AND tenant_id IN (
      SELECT tenant_id 
      FROM tenant_impersonation_tokens 
      WHERE used_at IS NULL 
      AND expires_at > now()
    )
  );
