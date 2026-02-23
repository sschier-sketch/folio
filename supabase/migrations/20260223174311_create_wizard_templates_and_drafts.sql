/*
  # Create Wizard Templates and Drafts System

  1. New Tables
    - `wizard_templates`
      - `id` (text, primary key) - Template slug identifier (e.g. 'kuendigungsbestaetigung')
      - `category` (text) - Category grouping (e.g. 'kuendigung', 'abmahnung')
      - `title` (text) - Display title
      - `description` (text) - Short description
      - `is_active` (boolean) - Whether template is available
      - `sort_order` (integer) - Display ordering
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `wizard_drafts`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Owner
      - `template_id` (text) - References wizard_templates
      - `draft_data` (jsonb) - All wizard form state
      - `current_step` (integer) - Last step the user was on
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - wizard_templates: authenticated users can read active templates
    - wizard_drafts: users can CRUD their own drafts only

  3. Initial Data
    - Insert initial template: Kuendigungsbestaetigung
*/

-- wizard_templates: registry of available wizard document templates
CREATE TABLE IF NOT EXISTS wizard_templates (
  id text PRIMARY KEY,
  category text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wizard_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active wizard templates"
  ON wizard_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- wizard_drafts: per-user saved wizard progress
CREATE TABLE IF NOT EXISTS wizard_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id text NOT NULL REFERENCES wizard_templates(id) ON DELETE CASCADE,
  draft_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wizard_drafts_user_id ON wizard_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_wizard_drafts_template_id ON wizard_drafts(template_id);

ALTER TABLE wizard_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wizard drafts"
  ON wizard_drafts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wizard drafts"
  ON wizard_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wizard drafts"
  ON wizard_drafts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wizard drafts"
  ON wizard_drafts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert initial template
INSERT INTO wizard_templates (id, category, title, description, sort_order)
VALUES (
  'kuendigungsbestaetigung',
  'kuendigung',
  'Kündigungsbestätigung',
  'Bestätigen Sie die Kündigung eines Mietverhältnisses mit allen relevanten Details, Abnahmeterminen und rechtlichen Hinweisen.',
  10
)
ON CONFLICT (id) DO NOTHING;
