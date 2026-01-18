/*
  # Pro Feature Texts Management System

  1. New Tables
    - `pro_feature_texts`
      - `id` (uuid, primary key)
      - `page` (text) - The page identifier (e.g., "rent_payments", "tenant_details")
      - `tab` (text) - The tab identifier (e.g., "dunning", "contract")
      - `feature_key` (text) - Unique key combining page and tab
      - `title` (text) - The feature title
      - `description` (text) - The feature description
      - `features` (jsonb) - Array of feature bullet points
      - `is_active` (boolean) - Whether this feature text is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `pro_feature_texts` table
    - Add policy for public read access (needed for anonymous/free users)
    - Add policy for admin write access
*/

CREATE TABLE IF NOT EXISTS pro_feature_texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL,
  tab text NOT NULL,
  feature_key text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pro_feature_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active pro feature texts"
  ON pro_feature_texts
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage pro feature texts"
  ON pro_feature_texts
  FOR ALL
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

CREATE INDEX IF NOT EXISTS idx_pro_feature_texts_feature_key
  ON pro_feature_texts(feature_key);

CREATE INDEX IF NOT EXISTS idx_pro_feature_texts_page_tab
  ON pro_feature_texts(page, tab);
