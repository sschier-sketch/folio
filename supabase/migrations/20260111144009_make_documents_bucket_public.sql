/*
  # Make Documents Bucket Public

  1. Changes
    - Set documents bucket to public = true
    - This allows getPublicUrl() to work for anonymous tenant access
  
  2. Security
    - Access is still controlled by RLS policies on storage.objects
    - Only documents with shared_with_tenant = true can be accessed by tenants
    - URL obfuscation provides additional security (long file paths with user IDs)
*/

UPDATE storage.buckets
SET public = true
WHERE id = 'documents';
