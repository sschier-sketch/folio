/*
  # Create Property Images System

  1. New Tables
    - `property_images`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `user_id` (uuid, foreign key to auth.users)
      - `file_url` (text) - Storage path
      - `file_name` (text)
      - `title` (text, optional)
      - `category` (enum) - Image category
      - `note` (text, optional)
      - `is_cover` (boolean, default false)
      - `visible_in_tenant_portal` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage
    - Create `property-photos` bucket for storing property images

  3. Security
    - Enable RLS on `property_images` table
    - Add policies for property owners to manage their images
*/

-- Create enum for image categories
DO $$ BEGIN
  CREATE TYPE property_image_category AS ENUM (
    'Aussen',
    'Innen',
    'Treppenhaus',
    'Technik',
    'Zustand',
    'Sonstiges'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  title text,
  category property_image_category DEFAULT 'Sonstiges',
  note text,
  is_cover boolean DEFAULT false,
  visible_in_tenant_portal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_user_id ON property_images(user_id);
CREATE INDEX IF NOT EXISTS idx_property_images_is_cover ON property_images(is_cover) WHERE is_cover = true;
CREATE INDEX IF NOT EXISTS idx_property_images_created_at ON property_images(created_at DESC);

-- Enable RLS
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Policies for property owners
CREATE POLICY "Users can view images of their properties"
  ON property_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert images to their properties"
  ON property_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update images of their properties"
  ON property_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images of their properties"
  ON property_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- Create storage bucket for property photos (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_property_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_property_images_updated_at_trigger ON property_images;
CREATE TRIGGER update_property_images_updated_at_trigger
  BEFORE UPDATE ON property_images
  FOR EACH ROW
  EXECUTE FUNCTION update_property_images_updated_at();

-- Function to ensure only one cover image per property
CREATE OR REPLACE FUNCTION ensure_single_cover_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_cover = true THEN
    UPDATE property_images
    SET is_cover = false
    WHERE property_id = NEW.property_id
      AND id != NEW.id
      AND is_cover = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to ensure single cover
DROP TRIGGER IF EXISTS ensure_single_cover_image_trigger ON property_images;
CREATE TRIGGER ensure_single_cover_image_trigger
  BEFORE INSERT OR UPDATE ON property_images
  FOR EACH ROW
  WHEN (NEW.is_cover = true)
  EXECUTE FUNCTION ensure_single_cover_image();