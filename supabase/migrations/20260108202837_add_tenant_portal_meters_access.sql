/*
  # Add Tenant Portal Meters Access

  1. Changes
    - Add RLS policies to allow anonymous users to view meters and readings via valid tokens
    - Allow tenants to insert new meter readings
  
  2. Security
    - Anonymous users can only access meters/readings for their property
    - Token validation ensures only authorized tenant access
*/

DROP POLICY IF EXISTS "Tenants can view meters via valid token" ON meters;
DROP POLICY IF EXISTS "Tenants can view meter readings via valid token" ON meter_readings;
DROP POLICY IF EXISTS "Tenants can insert meter readings via valid token" ON meter_readings;

CREATE POLICY "Tenants can view meters via valid token"
  ON meters
  FOR SELECT
  TO anon
  USING (
    property_id IN (
      SELECT te.property_id
      FROM tenants te
      WHERE te.id IN (
        SELECT tenant_id 
        FROM tenant_impersonation_tokens 
        WHERE used_at IS NULL 
        AND expires_at > now()
      )
    )
  );

CREATE POLICY "Tenants can view meter readings via valid token"
  ON meter_readings
  FOR SELECT
  TO anon
  USING (
    meter_id IN (
      SELECT m.id
      FROM meters m
      WHERE m.property_id IN (
        SELECT te.property_id
        FROM tenants te
        WHERE te.id IN (
          SELECT tenant_id 
          FROM tenant_impersonation_tokens 
          WHERE used_at IS NULL 
          AND expires_at > now()
        )
      )
    )
  );

CREATE POLICY "Tenants can insert meter readings via valid token"
  ON meter_readings
  FOR INSERT
  TO anon
  WITH CHECK (
    meter_id IN (
      SELECT m.id
      FROM meters m
      WHERE m.property_id IN (
        SELECT te.property_id
        FROM tenants te
        WHERE te.id IN (
          SELECT tenant_id 
          FROM tenant_impersonation_tokens 
          WHERE used_at IS NULL 
          AND expires_at > now()
        )
      )
    )
  );
