/*
  # Create Property Photos Storage Bucket

  1. New Storage Bucket
    - `property-photos` - For storing property profile photos

  2. Storage Policies
    - Allow authenticated users to upload photos for their properties
    - Allow authenticated users to view photos for their properties
    - Allow authenticated users to delete photos for their properties
    - Allow public access to view photos (for sharing)

  3. Security
    - Users can only upload/delete photos for properties they own
    - File size and type restrictions via bucket configuration
*/

-- Create the storage bucket for property photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-photos',
  'property-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload property photos
CREATE POLICY "Users can upload property photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM properties WHERE user_id = auth.uid()
  )
);

-- Allow users to view their property photos
CREATE POLICY "Users can view their property photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM properties WHERE user_id = auth.uid()
  )
);

-- Allow public access to view property photos
CREATE POLICY "Public can view property photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-photos');

-- Allow users to delete their property photos
CREATE POLICY "Users can delete their property photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM properties WHERE user_id = auth.uid()
  )
);

-- Allow users to update their property photos
CREATE POLICY "Users can update their property photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM properties WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'property-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM properties WHERE user_id = auth.uid()
  )
);

-- Add photo_url column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS photo_url text;
