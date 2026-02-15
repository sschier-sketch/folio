/*
  # Create CMS Pages System

  1. New Tables
    - `cms_pages`
      - `id` (uuid, primary key)
      - `slug` (text, unique) - page identifier (e.g. 'agb', 'impressum', 'datenschutz', 'avv')
      - `title` (text) - page title displayed in admin
      - `content` (text) - HTML content of the page
      - `updated_at` (timestamptz) - last modification timestamp
      - `updated_by` (uuid) - user who last edited the page

  2. Security
    - Enable RLS on `cms_pages` table
    - Public read access for all visitors (pages are public legal content)
    - Only admins can update pages

  3. Initial Data
    - Seed rows for agb, impressum, datenschutz, avv with empty content
      (pages will fall back to hardcoded content when DB content is empty)
*/

CREATE TABLE IF NOT EXISTS cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE cms_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cms pages"
  ON cms_pages
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update cms pages"
  ON cms_pages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert cms pages"
  ON cms_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

INSERT INTO cms_pages (slug, title, content) VALUES
  ('impressum', 'Impressum', ''),
  ('agb', 'Allgemeine Geschäftsbedingungen (AGB)', ''),
  ('datenschutz', 'Datenschutzerklärung', ''),
  ('avv', 'Auftragsverarbeitungsvereinbarung (AVV)', '')
ON CONFLICT (slug) DO NOTHING;
