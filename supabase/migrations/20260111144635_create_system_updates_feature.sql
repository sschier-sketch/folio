/*
  # Create System Updates Feature

  1. New Tables
    - `system_updates`
      - `id` (uuid, primary key)
      - `title` (text) - Update title
      - `content` (text) - Update description/content
      - `update_type` (text) - 'free' or 'premium'
      - `version` (text, nullable) - Optional version number
      - `is_published` (boolean) - Whether update is visible to users
      - `published_at` (timestamptz, nullable) - When it was published
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `user_update_views`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `update_id` (uuid, foreign key to system_updates)
      - `viewed_at` (timestamptz)
      - Unique constraint on (user_id, update_id)

  2. Security
    - Enable RLS on both tables
    - Admins can create/edit updates
    - All authenticated users can view published updates
    - Users can track their own viewed updates
    
  3. Indexes
    - Index on published_at for sorting
    - Index on user_id for quick lookup of viewed updates
*/

CREATE TABLE IF NOT EXISTS system_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  update_type text NOT NULL CHECK (update_type IN ('free', 'premium')),
  version text,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_update_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  update_id uuid REFERENCES system_updates(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, update_id)
);

CREATE INDEX IF NOT EXISTS idx_system_updates_published_at ON system_updates(published_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_user_update_views_user_id ON user_update_views(user_id);
CREATE INDEX IF NOT EXISTS idx_user_update_views_update_id ON user_update_views(update_id);

ALTER TABLE system_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_update_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system updates"
  ON system_updates FOR ALL
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

CREATE POLICY "Users can view published updates"
  ON system_updates FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "Users can manage own update views"
  ON user_update_views FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_system_updates_updated_at ON system_updates;
CREATE TRIGGER update_system_updates_updated_at
  BEFORE UPDATE ON system_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
