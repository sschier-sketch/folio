/*
  # Folio Property Management System Schema

  ## Overview
  Complete database schema for a property management SaaS application for landlords.
  
  ## Tables Created
  
  ### 1. properties
  Stores rental property information including value and financial data
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Owner/landlord
  - `name` (text) - Property name/address
  - `address` (text) - Full address
  - `property_type` (text) - Type (apartment, house, commercial, etc.)
  - `purchase_price` (numeric) - Original purchase price
  - `current_value` (numeric) - Current market value
  - `purchase_date` (date) - Date of purchase
  - `size_sqm` (numeric) - Size in square meters
  - `rooms` (numeric) - Number of rooms
  - `description` (text) - Additional details
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. tenants
  Stores tenant information linked to properties
  - `id` (uuid, primary key)
  - `property_id` (uuid, foreign key to properties)
  - `user_id` (uuid, foreign key to auth.users) - Landlord
  - `first_name` (text)
  - `last_name` (text)
  - `email` (text)
  - `phone` (text)
  - `move_in_date` (date)
  - `move_out_date` (date, nullable)
  - `is_active` (boolean) - Currently renting
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 3. rental_contracts
  Stores rental contract details and rent amounts
  - `id` (uuid, primary key)
  - `tenant_id` (uuid, foreign key to tenants)
  - `property_id` (uuid, foreign key to properties)
  - `user_id` (uuid, foreign key to auth.users) - Landlord
  - `base_rent` (numeric) - Kaltmiete (cold rent)
  - `additional_costs` (numeric) - Nebenkosten
  - `total_rent` (numeric) - Total monthly rent
  - `deposit` (numeric) - Security deposit
  - `contract_start` (date)
  - `contract_end` (date, nullable)
  - `contract_type` (text) - Fixed term or unlimited
  - `document_url` (text, nullable) - Uploaded contract file
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 4. loans
  Stores loan/mortgage information for properties
  - `id` (uuid, primary key)
  - `property_id` (uuid, foreign key to properties)
  - `user_id` (uuid, foreign key to auth.users) - Landlord
  - `lender_name` (text) - Bank/lender name
  - `loan_amount` (numeric) - Original loan amount
  - `remaining_balance` (numeric) - Current balance
  - `interest_rate` (numeric) - Annual interest rate
  - `monthly_payment` (numeric) - Monthly payment amount
  - `start_date` (date)
  - `end_date` (date)
  - `loan_type` (text) - Type of loan
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 5. tickets
  Support ticket system for tenant communication
  - `id` (uuid, primary key)
  - `property_id` (uuid, foreign key to properties)
  - `tenant_id` (uuid, foreign key to tenants, nullable)
  - `user_id` (uuid, foreign key to auth.users) - Landlord
  - `ticket_number` (text, unique) - Human-readable ticket number
  - `subject` (text)
  - `status` (text) - open, in_progress, closed
  - `priority` (text) - low, medium, high, urgent
  - `category` (text) - maintenance, complaint, question, etc.
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `closed_at` (timestamptz, nullable)
  
  ### 6. ticket_messages
  Messages within tickets
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, foreign key to tickets)
  - `sender_type` (text) - landlord or tenant
  - `sender_name` (text) - Name of sender
  - `sender_email` (text) - Email of sender
  - `message` (text)
  - `created_at` (timestamptz)
  
  ### 7. documents
  File uploads for various entities
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users) - Landlord
  - `entity_type` (text) - property, tenant, contract, ticket
  - `entity_id` (uuid) - ID of related entity
  - `file_name` (text)
  - `file_url` (text)
  - `file_type` (text)
  - `file_size` (integer)
  - `description` (text)
  - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Policies ensure users can only access their own data
  - Separate policies for SELECT, INSERT, UPDATE, DELETE operations
*/

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text NOT NULL,
  property_type text DEFAULT 'apartment',
  purchase_price numeric(12,2) DEFAULT 0,
  current_value numeric(12,2) DEFAULT 0,
  purchase_date date,
  size_sqm numeric(8,2),
  rooms numeric(4,1),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  move_in_date date,
  move_out_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rental contracts table
CREATE TABLE IF NOT EXISTS rental_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  base_rent numeric(10,2) NOT NULL DEFAULT 0,
  additional_costs numeric(10,2) DEFAULT 0,
  total_rent numeric(10,2) NOT NULL DEFAULT 0,
  deposit numeric(10,2) DEFAULT 0,
  contract_start date NOT NULL,
  contract_end date,
  contract_type text DEFAULT 'unlimited',
  document_url text,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lender_name text NOT NULL,
  loan_amount numeric(12,2) NOT NULL,
  remaining_balance numeric(12,2) NOT NULL,
  interest_rate numeric(5,2) NOT NULL,
  monthly_payment numeric(10,2) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  loan_type text DEFAULT 'mortgage',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ticket_number text UNIQUE NOT NULL,
  subject text NOT NULL,
  status text DEFAULT 'open',
  priority text DEFAULT 'medium',
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- Ticket messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL,
  sender_name text NOT NULL,
  sender_email text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_tenant_id ON rental_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_property_id ON rental_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_loans_property_id ON loans(property_id);
CREATE INDEX IF NOT EXISTS idx_tickets_property_id ON tickets(property_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
CREATE POLICY "Users can view own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for tenants
CREATE POLICY "Users can view own tenants"
  ON tenants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tenants"
  ON tenants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tenants"
  ON tenants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tenants"
  ON tenants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for rental_contracts
CREATE POLICY "Users can view own rental contracts"
  ON rental_contracts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rental contracts"
  ON rental_contracts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rental contracts"
  ON rental_contracts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own rental contracts"
  ON rental_contracts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for loans
CREATE POLICY "Users can view own loans"
  ON loans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own loans"
  ON loans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ticket_messages
CREATE POLICY "Users can view messages for own tickets"
  ON ticket_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages for own tickets"
  ON ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.user_id = auth.uid()
    )
  );

-- RLS Policies for documents
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM tickets;
  new_number := 'TKT-' || LPAD(counter::text, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_rental_contracts_updated_at
  BEFORE UPDATE ON rental_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();