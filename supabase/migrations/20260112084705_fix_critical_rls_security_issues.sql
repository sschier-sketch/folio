/*
  # Fix Critical RLS Security Issues

  1. Security Fixes
    - Fix `document_history` policy that allows unrestricted access
    - Fix `tenants` password setup policy that allows unrestricted access
    - These policies were effectively bypassing row-level security

  2. Changes
    - Drop and recreate policies with proper security checks
    - Ensure policies only allow legitimate access patterns
*/

-- Fix document_history policy
DROP POLICY IF EXISTS "System can insert history" ON document_history;

CREATE POLICY "System can insert document history"
  ON document_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_history.document_id
      AND documents.user_id = (SELECT auth.uid())
    )
  );

-- Fix tenants password setup policy
DROP POLICY IF EXISTS "Anyone can setup password by email" ON tenants;

CREATE POLICY "Tenants can setup password by email"
  ON tenants
  FOR UPDATE
  TO anon
  USING (
    email IS NOT NULL 
    AND password_hash IS NULL
  )
  WITH CHECK (
    email IS NOT NULL
  );
