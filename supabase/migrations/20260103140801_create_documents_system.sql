/*
  # Create Documents Management System

  1. New Tables
    - `documents`
      - Core document metadata and file information
      - Supports archiving and categorization
      - Tracks file size for storage limits
      - Includes metadata JSONB for extensibility
      
    - `document_associations`
      - Links documents to various entities (properties, units, tenants, contracts, finances)
      - Flexible association type system
      - Enables one document to be linked to multiple entities
      
    - `document_history`
      - Tracks all changes to documents (Pro feature)
      - Records who made changes and when
      - Stores change details

  2. Storage
    - Creates 'documents' storage bucket
    - RLS policies for secure file access
    
  3. Security
    - Enable RLS on all tables
    - Users can only access their own documents
    - Users can only create associations for their own documents
    - History is read-only for users

  4. Indexes
    - Optimized queries for document listing and filtering
    - Fast lookups by association type and ID
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('contract', 'invoice', 'bill', 'receipt', 'report', 'other')),
  category text,
  description text,
  upload_date timestamptz DEFAULT now() NOT NULL,
  is_archived boolean DEFAULT false NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create document associations table
CREATE TABLE IF NOT EXISTS document_associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  association_type text NOT NULL CHECK (association_type IN ('property', 'unit', 'rental_contract', 'tenant', 'finance', 'expense', 'income')),
  association_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create document history table (Pro feature)
CREATE TABLE IF NOT EXISTS document_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'archived', 'restored', 'associated', 'disassociated')),
  changes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_is_archived ON documents(is_archived);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_document_associations_document_id ON document_associations(document_id);
CREATE INDEX IF NOT EXISTS idx_document_associations_association ON document_associations(association_type, association_id);
CREATE INDEX IF NOT EXISTS idx_document_history_document_id ON document_history(document_id);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for document_associations
CREATE POLICY "Users can view associations for own documents"
  ON document_associations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_associations.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create associations for own documents"
  ON document_associations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_associations.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete associations for own documents"
  ON document_associations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_associations.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- RLS Policies for document_history
CREATE POLICY "Users can view history for own documents"
  ON document_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_history.document_id
      AND documents.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert history"
  ON document_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Function to log document changes
CREATE OR REPLACE FUNCTION log_document_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO document_history (document_id, user_id, action, changes)
    VALUES (NEW.id, NEW.user_id, 'created', jsonb_build_object(
      'file_name', NEW.file_name,
      'document_type', NEW.document_type
    ));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_archived = false AND NEW.is_archived = true THEN
      INSERT INTO document_history (document_id, user_id, action, changes)
      VALUES (NEW.id, NEW.user_id, 'archived', jsonb_build_object(
        'file_name', NEW.file_name
      ));
    ELSIF OLD.is_archived = true AND NEW.is_archived = false THEN
      INSERT INTO document_history (document_id, user_id, action, changes)
      VALUES (NEW.id, NEW.user_id, 'restored', jsonb_build_object(
        'file_name', NEW.file_name
      ));
    ELSE
      INSERT INTO document_history (document_id, user_id, action, changes)
      VALUES (NEW.id, NEW.user_id, 'updated', jsonb_build_object(
        'old', row_to_json(OLD),
        'new', row_to_json(NEW)
      ));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for document history
DROP TRIGGER IF EXISTS log_document_change ON documents;
CREATE TRIGGER log_document_change
  AFTER INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION log_document_change();