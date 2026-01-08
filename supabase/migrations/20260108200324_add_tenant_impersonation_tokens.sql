/*
  # Add Tenant Impersonation Tokens

  1. New Tables
    - `tenant_impersonation_tokens`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, references tenants)
      - `created_by` (uuid) - the landlord user id
      - `token` (text, unique) - random secure token
      - `expires_at` (timestamptz) - token expiry time
      - `used_at` (timestamptz, nullable) - when token was used
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `tenant_impersonation_tokens` table
    - Landlords can create tokens for their own tenants
    - Tokens are single-use and expire after 1 hour
*/

-- Create tenant_impersonation_tokens table
CREATE TABLE IF NOT EXISTS tenant_impersonation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tenant_impersonation_tokens ENABLE ROW LEVEL SECURITY;

-- Landlords can create tokens for their tenants
CREATE POLICY "Landlords can create impersonation tokens for their tenants"
  ON tenant_impersonation_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_impersonation_tokens.tenant_id
      AND tenants.user_id = auth.uid()
    )
  );

-- Landlords can view their own tokens
CREATE POLICY "Landlords can view their impersonation tokens"
  ON tenant_impersonation_tokens
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Allow anonymous access to validate tokens (for tenant login)
CREATE POLICY "Anyone can read unexpired unused tokens"
  ON tenant_impersonation_tokens
  FOR SELECT
  TO anon
  USING (
    used_at IS NULL AND
    expires_at > now()
  );

-- Allow anonymous update to mark token as used
CREATE POLICY "Anyone can mark token as used"
  ON tenant_impersonation_tokens
  FOR UPDATE
  TO anon
  USING (
    used_at IS NULL AND
    expires_at > now()
  )
  WITH CHECK (
    used_at IS NOT NULL
  );

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_tenant_impersonation_tokens_token 
  ON tenant_impersonation_tokens(token);

-- Create index for tenant_id lookups
CREATE INDEX IF NOT EXISTS idx_tenant_impersonation_tokens_tenant_id 
  ON tenant_impersonation_tokens(tenant_id);
