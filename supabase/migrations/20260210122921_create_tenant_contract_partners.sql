/*
  # Create tenant contract partners table

  1. New Tables
    - `tenant_contract_partners`
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, references tenants) - the main tenant this partner belongs to
      - `user_id` (uuid, references auth.users) - the property owner
      - `salutation` (text, nullable) - Herr/Frau/Divers
      - `first_name` (text, not null)
      - `last_name` (text, not null)
      - `email` (text, nullable)
      - `phone` (text, nullable)
      - `street` (text, nullable)
      - `house_number` (text, nullable)
      - `zip_code` (text, nullable)
      - `city` (text, nullable)
      - `move_in_date` (date, nullable) - can match main tenant or differ
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `tenant_contract_partners` table
    - Add policies for authenticated users to manage their own data

  3. Indexes
    - Index on `tenant_id` for fast lookups
    - Index on `user_id` for RLS performance

  4. Notes
    - A tenant can have multiple contract partners (e.g. couples renting together)
    - Contract partners have their own personal data and optional separate address
    - The move_in_date can differ from the main tenant or be set identical
*/

CREATE TABLE IF NOT EXISTS tenant_contract_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  salutation text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  street text,
  house_number text,
  zip_code text,
  city text,
  move_in_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE tenant_contract_partners ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tenant_contract_partners_tenant_id
  ON tenant_contract_partners(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_contract_partners_user_id
  ON tenant_contract_partners(user_id);

CREATE POLICY "Users can view own tenant contract partners"
  ON tenant_contract_partners
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tenant contract partners"
  ON tenant_contract_partners
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tenant contract partners"
  ON tenant_contract_partners
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tenant contract partners"
  ON tenant_contract_partners
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
