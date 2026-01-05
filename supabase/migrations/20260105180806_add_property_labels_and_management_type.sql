/*
  # Add Property Labels and Management Type

  1. New Tables
    - `property_labels`
      - `id` (uuid, primary key)
      - `property_id` (uuid, references properties)
      - `label` (text) - Label name/text
      - `color` (text) - Color for the label badge
      - `created_at` (timestamp)
      - `user_id` (uuid, references auth.users)

  2. Changes to Existing Tables
    - Add `property_management_type` to `properties` table
      - Options: 'rental_management', 'weg_management', 'rental_and_weg_management'
    - Remove `rooms` column from `properties` table (data safety: only if no data exists)

  3. Security
    - Enable RLS on `property_labels` table
    - Add policies for users to manage their own property labels
*/

-- Add property_management_type column to properties
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'property_management_type'
  ) THEN
    ALTER TABLE properties ADD COLUMN property_management_type text;
  END IF;
END $$;

-- Create property_labels table
CREATE TABLE IF NOT EXISTS property_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  color text NOT NULL DEFAULT 'blue',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on property_labels
ALTER TABLE property_labels ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own property labels
CREATE POLICY "Users can view own property labels"
  ON property_labels
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can create property labels for their properties
CREATE POLICY "Users can create property labels"
  ON property_labels
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_labels.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own property labels
CREATE POLICY "Users can update own property labels"
  ON property_labels
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own property labels
CREATE POLICY "Users can delete own property labels"
  ON property_labels
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_labels_property_id ON property_labels(property_id);
CREATE INDEX IF NOT EXISTS idx_property_labels_user_id ON property_labels(user_id);