/*
  # SEO Management System

  1. New Tables
    - `seo_global_settings`
      - Single record with global SEO defaults
      - `id` (uuid, primary key)
      - `title_template` (text) - Template for page titles, e.g., "%s – Rentably"
      - `default_title` (text) - Fallback title
      - `default_description` (text) - Fallback description
      - `default_robots_index` (boolean) - Default indexing for public pages
      - `updated_at` (timestamptz)
      
    - `seo_page_settings`
      - Per-page SEO configuration
      - `id` (uuid, primary key)
      - `path` (text, unique) - URL path like "/", "/preise"
      - `page_type` (text) - "marketing", "feature", "blog", "app"
      - `is_public` (boolean) - Whether page is public
      - `allow_indexing` (boolean) - Whether to allow search engine indexing
      - `title` (text, nullable) - Page-specific title
      - `description` (text, nullable) - Page-specific description
      - `canonical_url` (text, nullable) - Canonical URL
      - `og_title` (text, nullable) - Open Graph title
      - `og_description` (text, nullable) - Open Graph description
      - `og_image_url` (text, nullable) - Open Graph image URL
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Only admins can read and modify SEO settings
    - Public read access for rendering (via service role)

  3. Initial Data
    - Create default global settings
    - Seed common public pages
*/

-- Create seo_global_settings table
CREATE TABLE IF NOT EXISTS seo_global_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_template text NOT NULL DEFAULT '%s – Rentably',
  default_title text NOT NULL DEFAULT 'Rentably – Immobilienverwaltung leicht gemacht',
  default_description text NOT NULL DEFAULT 'Die moderne Plattform für Vermieter. Verwalten Sie Ihre Immobilien, Mieter und Finanzen an einem Ort.',
  default_robots_index boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE seo_global_settings ENABLE ROW LEVEL SECURITY;

-- Create seo_page_settings table
CREATE TABLE IF NOT EXISTS seo_page_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text UNIQUE NOT NULL,
  page_type text NOT NULL CHECK (page_type IN ('marketing', 'feature', 'blog', 'app')),
  is_public boolean NOT NULL DEFAULT true,
  allow_indexing boolean NOT NULL DEFAULT true,
  title text,
  description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image_url text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seo_page_settings ENABLE ROW LEVEL SECURITY;

-- Create index on path for fast lookups
CREATE INDEX IF NOT EXISTS idx_seo_page_settings_path ON seo_page_settings(path);
CREATE INDEX IF NOT EXISTS idx_seo_page_settings_public_indexed ON seo_page_settings(is_public, allow_indexing) WHERE is_public = true AND allow_indexing = true;

-- RLS Policies for seo_global_settings

-- Admins can read global settings
CREATE POLICY "Admins can read global SEO settings"
  ON seo_global_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Admins can update global settings
CREATE POLICY "Admins can update global SEO settings"
  ON seo_global_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- RLS Policies for seo_page_settings

-- Admins can read page settings
CREATE POLICY "Admins can read page SEO settings"
  ON seo_page_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Admins can insert page settings
CREATE POLICY "Admins can insert page SEO settings"
  ON seo_page_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Admins can update page settings
CREATE POLICY "Admins can update page SEO settings"
  ON seo_page_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Admins can delete page settings
CREATE POLICY "Admins can delete page SEO settings"
  ON seo_page_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Insert default global settings
INSERT INTO seo_global_settings (id, title_template, default_title, default_description, default_robots_index)
VALUES (
  gen_random_uuid(),
  '%s – Rentably',
  'Rentably – Immobilienverwaltung leicht gemacht',
  'Die moderne Plattform für Vermieter. Verwalten Sie Ihre Immobilien, Mieter und Finanzen an einem Ort.',
  true
)
ON CONFLICT DO NOTHING;

-- Seed public marketing pages
INSERT INTO seo_page_settings (path, page_type, is_public, allow_indexing, title, description, created_at, updated_at)
VALUES
  ('/', 'marketing', true, true, 'Startseite', 'Rentably ist die moderne Plattform für Vermieter. Verwalten Sie Ihre Immobilien, Mieter und Finanzen einfach und effizient.', now(), now()),
  ('/preise', 'marketing', true, true, 'Preise', 'Transparente Preise für Ihre Immobilienverwaltung. Wählen Sie zwischen Basic und Pro – flexibel und fair.', now(), now()),
  ('/funktionen', 'marketing', true, true, 'Funktionen', 'Alle Features von Rentably im Überblick. Von der Mieterverwaltung bis zur Finanzbuchhaltung.', now(), now()),
  ('/support', 'marketing', true, true, 'Support', 'Unser Support-Team hilft Ihnen gerne weiter. Kontaktieren Sie uns bei Fragen oder Problemen.', now(), now()),
  ('/kontakt', 'marketing', true, true, 'Kontakt', 'Nehmen Sie Kontakt mit uns auf. Wir freuen uns auf Ihre Nachricht.', now(), now()),
  ('/impressum', 'marketing', true, true, 'Impressum', 'Impressum und rechtliche Informationen zu Rentably.', now(), now())
ON CONFLICT (path) DO NOTHING;

-- Seed app pages (always noindex)
INSERT INTO seo_page_settings (path, page_type, is_public, allow_indexing, title, description, created_at, updated_at)
VALUES
  ('/dashboard', 'app', false, false, NULL, NULL, now(), now()),
  ('/app', 'app', false, false, NULL, NULL, now(), now()),
  ('/admin', 'app', false, false, NULL, NULL, now(), now()),
  ('/mieterportal', 'app', false, false, NULL, NULL, now(), now()),
  ('/login', 'app', false, false, NULL, NULL, now(), now()),
  ('/signup', 'app', false, false, NULL, NULL, now(), now()),
  ('/reset-password', 'app', false, false, NULL, NULL, now(), now()),
  ('/einstellungen', 'app', false, false, NULL, NULL, now(), now()),
  ('/subscription', 'app', false, false, NULL, NULL, now(), now())
ON CONFLICT (path) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_seo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_seo_global_settings_updated_at ON seo_global_settings;
CREATE TRIGGER update_seo_global_settings_updated_at
  BEFORE UPDATE ON seo_global_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_updated_at();

DROP TRIGGER IF EXISTS update_seo_page_settings_updated_at ON seo_page_settings;
CREATE TRIGGER update_seo_page_settings_updated_at
  BEFORE UPDATE ON seo_page_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_updated_at();