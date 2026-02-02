/*
  # Fix Property Photos Storage Policies

  1. Changes
    - Drop existing storage policies for property-photos bucket
    - Create new policies that match the upload path format: user_id/property_id/filename
    - Allow users to upload, view, update and delete their own property photos

  2. Security
    - Users can only access photos in their own user_id folder
    - Public read access maintained for sharing functionality
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload property photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their property photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view property photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their property photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their property photos" ON storage.objects;

-- Allow authenticated users to upload photos to their own folder
CREATE POLICY "Users can upload their property photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view photos in their own folder
CREATE POLICY "Users can view their own property photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'property-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to view all property photos (for sharing)
CREATE POLICY "Public can view all property photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-photos');

-- Allow users to delete photos in their own folder
CREATE POLICY "Users can delete their own property photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update photos in their own folder
CREATE POLICY "Users can update their own property photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'property-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Update bucket configuration to allow larger files (10 MB instead of 5 MB)
UPDATE storage.buckets
SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'property-photos';