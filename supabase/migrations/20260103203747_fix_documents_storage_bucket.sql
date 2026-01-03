/*
  # Fix Documents Storage Bucket and Policies

  1. Storage Bucket
    - Ensure documents bucket exists
    - Set proper configuration
    
  2. Storage Policies
    - Update RLS policies for better compatibility
    - Fix folder structure access
    
  3. Important Notes
    - Storage bucket creation may need to be done via Dashboard if this fails
    - Policies use auth.uid() for user-specific access
*/

-- Create storage bucket if not exists (may need manual creation in Dashboard)
DO $$ 
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'documents',
    'documents',
    false,
    52428800, -- 50MB per file
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Storage bucket creation/update failed - may need manual creation in Dashboard';
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- Create new storage policies with better folder matching
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own folder"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own folder"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete from own folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );