/*
  # Add Tenant Management Features

  1. New Tables
    - `contract_documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `tenant_id` (uuid, references tenants)
      - `contract_id` (uuid, references rental_contracts)
      - `document_name` (text)
      - `document_url` (text)
      - `document_type` (text) - main_contract, amendment, other
      - `version` (text)
      - `file_size` (integer)
      - `uploaded_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `rent_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `contract_id` (uuid, references rental_contracts)
      - `effective_date` (date)
      - `cold_rent` (decimal)
      - `utilities` (decimal)
      - `reason` (text) - initial, increase, index, stepped
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `deposit_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `contract_id` (uuid, references rental_contracts)
      - `transaction_date` (date)
      - `amount` (decimal)
      - `transaction_type` (text) - payment, partial_return, full_return
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `tenant_communications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `tenant_id` (uuid, references tenants)
      - `contract_id` (uuid, references rental_contracts)
      - `communication_type` (text) - message, document_sent, note
      - `subject` (text)
      - `content` (text)
      - `is_internal` (boolean)
      - `created_at` (timestamptz)
    
    - `handover_protocols`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `contract_id` (uuid, references rental_contracts)
      - `handover_type` (text) - move_in, move_out
      - `handover_date` (date)
      - `electricity_meter` (text)
      - `water_meter` (text)
      - `heating_meter` (text)
      - `checklist_data` (jsonb)
      - `photos` (jsonb)
      - `notes` (text)
      - `created_at` (timestamptz)

  2. Updates to Existing Tables
    - Add deposit fields to rental_contracts if not present
    - Add status field to rental_contracts if not present

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- contract_documents table
CREATE TABLE IF NOT EXISTS contract_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  contract_id uuid REFERENCES rental_contracts(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_url text NOT NULL,
  document_type text DEFAULT 'other' CHECK (document_type IN ('main_contract', 'amendment', 'other')),
  version text DEFAULT '1.0',
  file_size integer DEFAULT 0,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contract documents"
  ON contract_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contract documents"
  ON contract_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contract documents"
  ON contract_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contract documents"
  ON contract_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_contract_documents_user_id ON contract_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_documents_tenant_id ON contract_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_documents_contract_id ON contract_documents(contract_id);

-- rent_history table
CREATE TABLE IF NOT EXISTS rent_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_id uuid REFERENCES rental_contracts(id) ON DELETE CASCADE NOT NULL,
  effective_date date NOT NULL,
  cold_rent decimal NOT NULL DEFAULT 0,
  utilities decimal DEFAULT 0,
  reason text DEFAULT 'initial' CHECK (reason IN ('initial', 'increase', 'index', 'stepped')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rent_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rent history"
  ON rent_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rent history"
  ON rent_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rent history"
  ON rent_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rent history"
  ON rent_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rent_history_user_id ON rent_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rent_history_contract_id ON rent_history(contract_id);
CREATE INDEX IF NOT EXISTS idx_rent_history_date ON rent_history(effective_date);

-- deposit_history table
CREATE TABLE IF NOT EXISTS deposit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_id uuid REFERENCES rental_contracts(id) ON DELETE CASCADE NOT NULL,
  transaction_date date NOT NULL,
  amount decimal NOT NULL DEFAULT 0,
  transaction_type text DEFAULT 'payment' CHECK (transaction_type IN ('payment', 'partial_return', 'full_return')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deposit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deposit history"
  ON deposit_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deposit history"
  ON deposit_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deposit history"
  ON deposit_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own deposit history"
  ON deposit_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_deposit_history_user_id ON deposit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_history_contract_id ON deposit_history(contract_id);

-- tenant_communications table
CREATE TABLE IF NOT EXISTS tenant_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  contract_id uuid REFERENCES rental_contracts(id) ON DELETE CASCADE,
  communication_type text DEFAULT 'note' CHECK (communication_type IN ('message', 'document_sent', 'note')),
  subject text NOT NULL,
  content text DEFAULT '',
  is_internal boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tenant_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant communications"
  ON tenant_communications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tenant communications"
  ON tenant_communications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tenant communications"
  ON tenant_communications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tenant communications"
  ON tenant_communications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tenant_communications_user_id ON tenant_communications(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_communications_tenant_id ON tenant_communications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_communications_contract_id ON tenant_communications(contract_id);

-- handover_protocols table
CREATE TABLE IF NOT EXISTS handover_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_id uuid REFERENCES rental_contracts(id) ON DELETE CASCADE NOT NULL,
  handover_type text DEFAULT 'move_in' CHECK (handover_type IN ('move_in', 'move_out')),
  handover_date date NOT NULL,
  electricity_meter text DEFAULT '',
  water_meter text DEFAULT '',
  heating_meter text DEFAULT '',
  checklist_data jsonb DEFAULT '[]'::jsonb,
  photos jsonb DEFAULT '[]'::jsonb,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE handover_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own handover protocols"
  ON handover_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own handover protocols"
  ON handover_protocols FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own handover protocols"
  ON handover_protocols FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own handover protocols"
  ON handover_protocols FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_handover_protocols_user_id ON handover_protocols(user_id);
CREATE INDEX IF NOT EXISTS idx_handover_protocols_contract_id ON handover_protocols(contract_id);

-- Add deposit fields to rental_contracts if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rental_contracts' AND column_name = 'deposit_amount'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN deposit_amount decimal DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rental_contracts' AND column_name = 'deposit_status'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN deposit_status text DEFAULT 'open' CHECK (deposit_status IN ('open', 'partial', 'complete', 'returned'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rental_contracts' AND column_name = 'deposit_notes'
  ) THEN
    ALTER TABLE rental_contracts ADD COLUMN deposit_notes text DEFAULT '';
  END IF;
END $$;