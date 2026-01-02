/*
  # Billing & Utility Cost System

  1. New Tables
    - `billing_periods`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `property_id` (uuid, references properties)
      - `name` (text) - e.g., "Abrechnung 2024"
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text) - draft, finalized, sent
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `cost_types`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - e.g., "Heizkosten", "Wasser", "Müllabfuhr"
      - `description` (text)
      - `is_allocable` (boolean) - umlagefähig
      - `default_allocation_key` (text) - sqm, persons, consumption, fixed
      - `created_at` (timestamptz)
    
    - `operating_costs`
      - `id` (uuid, primary key)
      - `billing_period_id` (uuid, references billing_periods)
      - `cost_type_id` (uuid, references cost_types)
      - `amount` (decimal)
      - `allocation_key` (text) - sqm, persons, consumption, fixed
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `meters`
      - `id` (uuid, primary key)
      - `property_id` (uuid, references properties)
      - `unit_id` (uuid, references tenants) - nullable, can be building-wide
      - `meter_type` (text) - water, electricity, heating, gas
      - `meter_number` (text)
      - `location` (text)
      - `installation_date` (date)
      - `created_at` (timestamptz)
    
    - `meter_readings`
      - `id` (uuid, primary key)
      - `meter_id` (uuid, references meters)
      - `billing_period_id` (uuid, references billing_periods)
      - `reading_date` (date)
      - `reading_value` (decimal)
      - `reading_type` (text) - start, end, intermediate
      - `notes` (text)
      - `created_at` (timestamptz)
    
    - `billing_allocations`
      - `id` (uuid, primary key)
      - `billing_period_id` (uuid, references billing_periods)
      - `tenant_id` (uuid, references tenants)
      - `cost_type_id` (uuid, references cost_types)
      - `allocated_amount` (decimal)
      - `advance_payments` (decimal)
      - `balance` (decimal) - positive = refund, negative = additional payment
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- billing_periods table
CREATE TABLE IF NOT EXISTS billing_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'finalized', 'sent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE billing_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing periods"
  ON billing_periods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own billing periods"
  ON billing_periods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own billing periods"
  ON billing_periods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own billing periods"
  ON billing_periods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_billing_periods_user_id ON billing_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_periods_property_id ON billing_periods(property_id);

-- cost_types table
CREATE TABLE IF NOT EXISTS cost_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  is_allocable boolean DEFAULT true,
  default_allocation_key text DEFAULT 'sqm' CHECK (default_allocation_key IN ('sqm', 'persons', 'consumption', 'fixed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cost_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cost types"
  ON cost_types FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cost types"
  ON cost_types FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cost types"
  ON cost_types FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cost types"
  ON cost_types FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cost_types_user_id ON cost_types(user_id);

-- operating_costs table
CREATE TABLE IF NOT EXISTS operating_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_period_id uuid REFERENCES billing_periods(id) ON DELETE CASCADE NOT NULL,
  cost_type_id uuid REFERENCES cost_types(id) ON DELETE CASCADE NOT NULL,
  amount decimal NOT NULL DEFAULT 0,
  allocation_key text NOT NULL CHECK (allocation_key IN ('sqm', 'persons', 'consumption', 'fixed')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE operating_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own operating costs"
  ON operating_costs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_periods
      WHERE billing_periods.id = operating_costs.billing_period_id
      AND billing_periods.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own operating costs"
  ON operating_costs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_periods
      WHERE billing_periods.id = operating_costs.billing_period_id
      AND billing_periods.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own operating costs"
  ON operating_costs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_periods
      WHERE billing_periods.id = operating_costs.billing_period_id
      AND billing_periods.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_periods
      WHERE billing_periods.id = operating_costs.billing_period_id
      AND billing_periods.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own operating costs"
  ON operating_costs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_periods
      WHERE billing_periods.id = operating_costs.billing_period_id
      AND billing_periods.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_operating_costs_billing_period_id ON operating_costs(billing_period_id);
CREATE INDEX IF NOT EXISTS idx_operating_costs_cost_type_id ON operating_costs(cost_type_id);

-- meters table
CREATE TABLE IF NOT EXISTS meters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  unit_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  meter_type text NOT NULL CHECK (meter_type IN ('water', 'electricity', 'heating', 'gas')),
  meter_number text NOT NULL,
  location text DEFAULT '',
  installation_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meters"
  ON meters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = meters.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meters"
  ON meters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = meters.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meters"
  ON meters FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = meters.property_id
      AND properties.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = meters.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meters"
  ON meters FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = meters.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_meters_property_id ON meters(property_id);
CREATE INDEX IF NOT EXISTS idx_meters_unit_id ON meters(unit_id);

-- meter_readings table
CREATE TABLE IF NOT EXISTS meter_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id uuid REFERENCES meters(id) ON DELETE CASCADE NOT NULL,
  billing_period_id uuid REFERENCES billing_periods(id) ON DELETE CASCADE,
  reading_date date NOT NULL,
  reading_value decimal NOT NULL,
  reading_type text DEFAULT 'intermediate' CHECK (reading_type IN ('start', 'end', 'intermediate')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meter readings"
  ON meter_readings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meters
      JOIN properties ON properties.id = meters.property_id
      WHERE meters.id = meter_readings.meter_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meter readings"
  ON meter_readings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meters
      JOIN properties ON properties.id = meters.property_id
      WHERE meters.id = meter_readings.meter_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meter readings"
  ON meter_readings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meters
      JOIN properties ON properties.id = meters.property_id
      WHERE meters.id = meter_readings.meter_id
      AND properties.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meters
      JOIN properties ON properties.id = meters.property_id
      WHERE meters.id = meter_readings.meter_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meter readings"
  ON meter_readings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meters
      JOIN properties ON properties.id = meters.property_id
      WHERE meters.id = meter_readings.meter_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_meter_readings_meter_id ON meter_readings(meter_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_billing_period_id ON meter_readings(billing_period_id);

-- billing_allocations table
CREATE TABLE IF NOT EXISTS billing_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_period_id uuid REFERENCES billing_periods(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  cost_type_id uuid REFERENCES cost_types(id) ON DELETE CASCADE NOT NULL,
  allocated_amount decimal DEFAULT 0,
  advance_payments decimal DEFAULT 0,
  balance decimal DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE billing_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing allocations"
  ON billing_allocations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_periods
      WHERE billing_periods.id = billing_allocations.billing_period_id
      AND billing_periods.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own billing allocations"
  ON billing_allocations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_periods
      WHERE billing_periods.id = billing_allocations.billing_period_id
      AND billing_periods.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own billing allocations"
  ON billing_allocations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_periods
      WHERE billing_periods.id = billing_allocations.billing_period_id
      AND billing_periods.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM billing_periods
      WHERE billing_periods.id = billing_allocations.billing_period_id
      AND billing_periods.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own billing allocations"
  ON billing_allocations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM billing_periods
      WHERE billing_periods.id = billing_allocations.billing_period_id
      AND billing_periods.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_billing_allocations_billing_period_id ON billing_allocations(billing_period_id);
CREATE INDEX IF NOT EXISTS idx_billing_allocations_tenant_id ON billing_allocations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_allocations_cost_type_id ON billing_allocations(cost_type_id);