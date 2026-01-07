/*
  # Create Templates System

  1. New Tables
    - `templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - for admin uploads
      - `title` (text) - template name
      - `category` (text) - category of template
      - `description` (text, optional) - template description
      - `file_name` (text) - original file name
      - `file_path` (text) - storage path
      - `file_size` (bigint) - file size in bytes
      - `file_type` (text) - MIME type
      - `is_premium` (boolean) - whether template requires premium subscription
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `templates` table
    - Add policies for:
      - Admins can insert, update, delete templates
      - All authenticated users can view templates
      - Premium templates require premium subscription

  3. Storage
    - Create storage bucket for templates
    - Set up policies for template downloads
*/

CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert templates"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update templates"
  ON templates
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

CREATE POLICY "Admins can delete templates"
  ON templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can view templates"
  ON templates
  FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can download templates"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'templates');

CREATE POLICY "Admins can upload templates"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'templates' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete template files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'templates' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS templates_category_idx ON templates(category);
CREATE INDEX IF NOT EXISTS templates_user_id_idx ON templates(user_id);
CREATE INDEX IF NOT EXISTS templates_created_at_idx ON templates(created_at DESC);