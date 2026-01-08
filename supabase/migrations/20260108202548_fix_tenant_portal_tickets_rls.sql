/*
  # Fix Tenant Portal Tickets RLS

  1. Changes
    - Add RLS policy to allow anonymous users to create tickets via valid impersonation tokens
    - Add RLS policy to allow anonymous users to read tickets for their tenant
    - Add RLS policy to allow anonymous users to insert ticket messages
    - Add RLS policy to allow anonymous users to read ticket messages
  
  2. Security
    - Anonymous users can only create/access tickets for tenants with valid tokens
    - This enables the tenant portal ticket creation flow
*/

DROP POLICY IF EXISTS "Tenants can create tickets via valid token" ON tickets;
DROP POLICY IF EXISTS "Tenants can view own tickets via valid token" ON tickets;
DROP POLICY IF EXISTS "Tenants can insert messages via valid token" ON ticket_messages;
DROP POLICY IF EXISTS "Tenants can view messages via valid token" ON ticket_messages;

CREATE POLICY "Tenants can create tickets via valid token"
  ON tickets
  FOR INSERT
  TO anon
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_impersonation_tokens 
      WHERE used_at IS NULL 
      AND expires_at > now()
    )
  );

CREATE POLICY "Tenants can view own tickets via valid token"
  ON tickets
  FOR SELECT
  TO anon
  USING (
    tenant_id IN (
      SELECT tenant_id 
      FROM tenant_impersonation_tokens 
      WHERE used_at IS NULL 
      AND expires_at > now()
    )
  );

CREATE POLICY "Tenants can insert messages via valid token"
  ON ticket_messages
  FOR INSERT
  TO anon
  WITH CHECK (
    ticket_id IN (
      SELECT t.id 
      FROM tickets t
      WHERE t.tenant_id IN (
        SELECT tenant_id 
        FROM tenant_impersonation_tokens 
        WHERE used_at IS NULL 
        AND expires_at > now()
      )
    )
  );

CREATE POLICY "Tenants can view messages via valid token"
  ON ticket_messages
  FOR SELECT
  TO anon
  USING (
    ticket_id IN (
      SELECT t.id 
      FROM tickets t
      WHERE t.tenant_id IN (
        SELECT tenant_id 
        FROM tenant_impersonation_tokens 
        WHERE used_at IS NULL 
        AND expires_at > now()
      )
    )
  );
