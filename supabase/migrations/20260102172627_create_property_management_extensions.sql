/*
  # Property Management Extensions

  ## Overview
  Extends the property management system with units, documents, contacts, maintenance tasks, and history tracking.
  Designed for both Free and Pro users with clear feature separation.

  ## New Tables

  1. **property_units**
     - `id` (uuid, primary key)
     - `property_id` (uuid, foreign key to properties)
     - `user_id` (uuid, foreign key to auth.users)
     - `unit_number` (text) - Designation/Number
     - `unit_type` (text) - Type: apartment, office, parking, storage, commercial
     - `floor` (integer, nullable) - Floor number
     - `area_sqm` (numeric, nullable) - Area in square meters
     - `rooms` (integer, nullable) - Number of rooms
     - `status` (text) - Status: vacant, rented, maintenance
     - `tenant_id` (uuid, nullable, foreign key to tenants)
     - `rent_amount` (numeric, nullable) - Current rent amount
     - `notes` (text) - Internal notes
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. **property_documents**
     - `id` (uuid, primary key)
     - `property_id` (uuid, foreign key to properties)
     - `user_id` (uuid, foreign key to auth.users)
     - `document_name` (text)
     - `document_type` (text) - Type: floor_plan, energy_certificate, insurance, other
     - `file_url` (text)
     - `file_size` (integer)
     - `uploaded_at` (timestamptz)
     - `created_at` (timestamptz)

  3. **property_contacts**
     - `id` (uuid, primary key)
     - `property_id` (uuid, foreign key to properties)
     - `user_id` (uuid, foreign key to auth.users)
     - `contact_name` (text)
     - `contact_role` (text) - Role: caretaker, contractor, owner, manager, other
     - `phone` (text, nullable)
     - `email` (text, nullable)
     - `notes` (text)
     - `created_at` (timestamptz)

  4. **maintenance_tasks**
     - `id` (uuid, primary key)
     - `property_id` (uuid, foreign key to properties)
     - `unit_id` (uuid, nullable, foreign key to property_units)
     - `user_id` (uuid, foreign key to auth.users)
     - `title` (text)
     - `description` (text)
     - `status` (text) - Status: open, in_progress, completed
     - `priority` (text) - Priority: low, medium, high
     - `cost` (numeric, nullable)
     - `due_date` (date, nullable)
     - `completed_at` (timestamptz, nullable)
     - `is_recurring` (boolean)
     - `recurrence_interval` (text, nullable) - Interval: monthly, quarterly, yearly
     - `notes` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  5. **property_history**
     - `id` (uuid, primary key)
     - `property_id` (uuid, foreign key to properties)
     - `user_id` (uuid, foreign key to auth.users)
     - `event_type` (text) - Type: unit_created, unit_updated, tenant_change, rent_increase, maintenance, billing, other
     - `event_description` (text)
     - `changed_by_name` (text, nullable)
     - `metadata` (jsonb, nullable) - Additional data
     - `created_at` (timestamptz)

  6. **property_equipment**
     - `id` (uuid, primary key)
     - `property_id` (uuid, foreign key to properties)
     - `user_id` (uuid, foreign key to auth.users)
     - `heating_type` (text, nullable) - gas, oil, district_heating, heat_pump, other
     - `energy_source` (text, nullable) - gas, oil, electricity, solar, other
     - `construction_type` (text, nullable) - solid, prefab, wood, mixed
     - `roof_type` (text, nullable)
     - `parking_spots` (integer, default 0)
     - `elevator` (boolean, default false)
     - `balcony_terrace` (boolean, default false)
     - `garden` (boolean, default false)
     - `basement` (boolean, default false)
     - `equipment_notes` (text)
     - `special_features` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  ## Security
  - All tables have RLS enabled
  - Users can only access their own data
  - Proper indexes for performance

  ## Notes
  - FREE users can use: units (basic), equipment, history (read-only)
  - PRO users get: documents, contacts, maintenance, advanced units features
*/

-- Create property_units table
CREATE TABLE IF NOT EXISTS property_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  unit_type text NOT NULL DEFAULT 'apartment' CHECK (unit_type IN ('apartment', 'office', 'parking', 'storage', 'commercial')),
  floor integer,
  area_sqm numeric,
  rooms integer,
  status text NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant', 'rented', 'maintenance')),
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  rent_amount numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property_documents table
CREATE TABLE IF NOT EXISTS property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL DEFAULT 'other' CHECK (document_type IN ('floor_plan', 'energy_certificate', 'insurance', 'inspection', 'other')),
  file_url text NOT NULL,
  file_size integer DEFAULT 0,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create property_contacts table
CREATE TABLE IF NOT EXISTS property_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  contact_role text NOT NULL DEFAULT 'other' CHECK (contact_role IN ('caretaker', 'contractor', 'owner', 'manager', 'other')),
  phone text,
  email text,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create maintenance_tasks table
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES property_units(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  cost numeric,
  due_date date,
  completed_at timestamptz,
  is_recurring boolean DEFAULT false,
  recurrence_interval text CHECK (recurrence_interval IN ('monthly', 'quarterly', 'yearly')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property_history table
CREATE TABLE IF NOT EXISTS property_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('unit_created', 'unit_updated', 'tenant_change', 'rent_increase', 'maintenance', 'billing', 'document_uploaded', 'other')),
  event_description text NOT NULL,
  changed_by_name text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create property_equipment table
CREATE TABLE IF NOT EXISTS property_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  heating_type text CHECK (heating_type IN ('gas', 'oil', 'district_heating', 'heat_pump', 'electric', 'other')),
  energy_source text CHECK (energy_source IN ('gas', 'oil', 'electricity', 'solar', 'district', 'other')),
  construction_type text CHECK (construction_type IN ('solid', 'prefab', 'wood', 'mixed', 'other')),
  roof_type text,
  parking_spots integer DEFAULT 0,
  elevator boolean DEFAULT false,
  balcony_terrace boolean DEFAULT false,
  garden boolean DEFAULT false,
  basement boolean DEFAULT false,
  equipment_notes text DEFAULT '',
  special_features text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id)
);

-- Enable RLS on all tables
ALTER TABLE property_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_equipment ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_units
CREATE POLICY "Users can view own property units"
  ON property_units FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own property units"
  ON property_units FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own property units"
  ON property_units FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own property units"
  ON property_units FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for property_documents
CREATE POLICY "Users can view own property documents"
  ON property_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own property documents"
  ON property_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own property documents"
  ON property_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own property documents"
  ON property_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for property_contacts
CREATE POLICY "Users can view own property contacts"
  ON property_contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own property contacts"
  ON property_contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own property contacts"
  ON property_contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own property contacts"
  ON property_contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for maintenance_tasks
CREATE POLICY "Users can view own maintenance tasks"
  ON maintenance_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own maintenance tasks"
  ON maintenance_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own maintenance tasks"
  ON maintenance_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own maintenance tasks"
  ON maintenance_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for property_history
CREATE POLICY "Users can view own property history"
  ON property_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own property history"
  ON property_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for property_equipment
CREATE POLICY "Users can view own property equipment"
  ON property_equipment FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own property equipment"
  ON property_equipment FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own property equipment"
  ON property_equipment FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own property equipment"
  ON property_equipment FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_units_property_id ON property_units(property_id);
CREATE INDEX IF NOT EXISTS idx_property_units_user_id ON property_units(user_id);
CREATE INDEX IF NOT EXISTS idx_property_units_tenant_id ON property_units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_contacts_property_id ON property_contacts(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_property_id ON maintenance_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_status ON maintenance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_property_history_property_id ON property_history(property_id);
CREATE INDEX IF NOT EXISTS idx_property_history_created_at ON property_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_equipment_property_id ON property_equipment(property_id);