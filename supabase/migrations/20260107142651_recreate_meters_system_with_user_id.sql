/*
  # Zähler & Verbrauch System - Vollständig neu

  1. Vorhandene Tabellen löschen und neu erstellen
  2. Neue Struktur mit allen erforderlichen Feldern
  3. RLS Policies einrichten
*/

-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS meter_readings CASCADE;
DROP TABLE IF EXISTS meters CASCADE;

-- Create meters table with full structure
CREATE TABLE meters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES property_units(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  meter_number text NOT NULL,
  meter_type text NOT NULL CHECK (meter_type IN ('strom', 'gas', 'heizung', 'warmwasser', 'kaltwasser', 'sonstiges')),
  unit_of_measurement text NOT NULL,
  meter_name text,
  location text,
  supplier text,
  contract_number text,
  reading_interval text CHECK (reading_interval IN ('monthly', 'quarterly', 'halfyearly', 'yearly', 'manual')),
  note text,
  last_reading_value numeric(12,2),
  last_reading_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meter_readings table
CREATE TABLE meter_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id uuid NOT NULL REFERENCES meters(id) ON DELETE CASCADE,
  value numeric(12,2) NOT NULL,
  date date NOT NULL,
  recorded_by text,
  note text,
  photos jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;

-- Policies for meters
CREATE POLICY "Users can view own meters"
  ON meters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meters"
  ON meters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meters"
  ON meters FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meters"
  ON meters FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for meter_readings
CREATE POLICY "Users can view own meter readings"
  ON meter_readings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meters
      WHERE meters.id = meter_readings.meter_id
      AND meters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own meter readings"
  ON meter_readings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meters
      WHERE meters.id = meter_readings.meter_id
      AND meters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own meter readings"
  ON meter_readings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meters
      WHERE meters.id = meter_readings.meter_id
      AND meters.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meters
      WHERE meters.id = meter_readings.meter_id
      AND meters.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own meter readings"
  ON meter_readings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meters
      WHERE meters.id = meter_readings.meter_id
      AND meters.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_meters_user_id ON meters(user_id);
CREATE INDEX idx_meters_property_id ON meters(property_id);
CREATE INDEX idx_meters_unit_id ON meters(unit_id);
CREATE INDEX idx_meters_tenant_id ON meters(tenant_id);
CREATE INDEX idx_meters_meter_type ON meters(meter_type);
CREATE INDEX idx_meter_readings_meter_id ON meter_readings(meter_id);
CREATE INDEX idx_meter_readings_date ON meter_readings(date);