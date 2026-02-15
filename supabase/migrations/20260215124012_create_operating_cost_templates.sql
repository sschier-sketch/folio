/*
  # Create operating cost templates system

  1. New Tables
    - `operating_cost_templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `property_id` (uuid, FK to properties)
      - `unit_id` (uuid, nullable, FK to property_units)
      - `name` (text) - Display name for the template
      - `alloc_unit_area` (numeric) - Stored allocation: unit area
      - `alloc_total_area` (numeric) - Stored allocation: total area
      - `alloc_unit_persons` (integer) - Stored allocation: unit persons
      - `alloc_total_persons` (integer) - Stored allocation: total persons
      - `alloc_total_units` (integer) - Stored allocation: total units
      - `alloc_unit_mea` (numeric) - Stored allocation: unit MEA
      - `alloc_total_mea` (numeric) - Stored allocation: total MEA
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `operating_cost_template_items`
      - `id` (uuid, primary key)
      - `template_id` (uuid, FK to operating_cost_templates)
      - `cost_type` (text) - The cost type name
      - `allocation_key` (text) - The allocation method
      - `is_section_35a` (boolean) - Tax-relevant flag
      - `section_35a_category` (text) - Tax category
      - `group_label` (text, nullable) - Cost group label
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Authenticated users can only access their own templates
    - CRUD policies for select, insert, update, delete

  3. Important Notes
    - One template per property+unit combination (unique constraint)
    - Template stores cost structure (types, allocation keys, tax settings) but NOT amounts
    - Amounts change each year, but the structure typically stays the same
*/

CREATE TABLE IF NOT EXISTS operating_cost_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES property_units(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Vorlage',
  alloc_unit_area numeric,
  alloc_total_area numeric,
  alloc_unit_persons integer,
  alloc_total_persons integer,
  alloc_total_units integer,
  alloc_unit_mea numeric,
  alloc_total_mea numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_operating_cost_templates_property_unit
  ON operating_cost_templates (user_id, property_id, COALESCE(unit_id, '00000000-0000-0000-0000-000000000000'));

CREATE INDEX IF NOT EXISTS idx_operating_cost_templates_user
  ON operating_cost_templates (user_id);

ALTER TABLE operating_cost_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
  ON operating_cost_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates"
  ON operating_cost_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON operating_cost_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON operating_cost_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS operating_cost_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES operating_cost_templates(id) ON DELETE CASCADE,
  cost_type text NOT NULL,
  allocation_key text NOT NULL DEFAULT 'area',
  is_section_35a boolean NOT NULL DEFAULT false,
  section_35a_category text,
  group_label text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operating_cost_template_items_template
  ON operating_cost_template_items (template_id);

ALTER TABLE operating_cost_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own template items"
  ON operating_cost_template_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operating_cost_templates t
      WHERE t.id = operating_cost_template_items.template_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own template items"
  ON operating_cost_template_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operating_cost_templates t
      WHERE t.id = operating_cost_template_items.template_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own template items"
  ON operating_cost_template_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operating_cost_templates t
      WHERE t.id = operating_cost_template_items.template_id
      AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operating_cost_templates t
      WHERE t.id = operating_cost_template_items.template_id
      AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own template items"
  ON operating_cost_template_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM operating_cost_templates t
      WHERE t.id = operating_cost_template_items.template_id
      AND t.user_id = auth.uid()
    )
  );
