/*
  # Template Category Descriptions

  1. New Tables
    - `template_category_descriptions`
      - `id` (uuid, primary key)
      - `category` (text, unique) - Category identifier
      - `title` (text) - Display title for the category
      - `description` (text) - Description shown to users
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `template_category_descriptions` table
    - Add policy for authenticated users to read
    - Add policy for admins to manage descriptions

  3. Initial Data
    - Insert default category descriptions
*/

CREATE TABLE IF NOT EXISTS template_category_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE template_category_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view category descriptions"
  ON template_category_descriptions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update category descriptions"
  ON template_category_descriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

INSERT INTO template_category_descriptions (category, title, description) VALUES
  ('interessentensuche', 'Interessentensuche', 'Neben dem persönlichen Eindruck zählen die wichtigsten Eckdaten zum neuen Mieter. Falschangaben sind übrigens ein Kündigungsgrund.'),
  ('wohnungsuebergabe', 'Wohnungsübergabe', 'Protokollieren Sie umfassend und genau, um Konflikten vorzubeugen. Dazu bestätigen Sie den Einzug des Mieters für die Ämter.'),
  ('mietvertrag', 'Mietvertrag', 'Die vom Rechtsanwalt geprüften Mietvertragsvorlagen sind der Grundbaustein für ein gutes Mietverhältnis.'),
  ('mietzahlungen', 'Mietzahlungen', 'Bei Anpassungen und Mahnungen zur Miete ist es besonders wichtig Formvorgaben und Fristen genau einzuhalten. Diese Vorlagen helfen dabei.'),
  ('kuendigung', 'Kündigung', 'Eine formal richtige Kündigungsbestätigung schützt Sie vor Problemen bei Auszug und Neuvermietung.'),
  ('sonstiges', 'Sonstiges', 'Checklisten, Protokolle und Vorlagen, die Ihnen das Leben als Vermieter vereinfachen.')
ON CONFLICT (category) DO NOTHING;