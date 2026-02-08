/*
  # Create Documents System with Tenant Document Types

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `file_name` (text)
      - `file_path` (text)
      - `file_size` (bigint)
      - `file_type` (text)
      - `document_type` (text, with CHECK constraint for all supported types)
      - `category` (text, nullable)
      - `description` (text, nullable)
      - `upload_date` (timestamptz)
      - `is_archived` (boolean)
      - `shared_with_tenant` (boolean)
      - `metadata` (jsonb)

    - `document_associations`
      - `id` (uuid, primary key)
      - `document_id` (uuid, references documents)
      - `association_type` (text: property, unit, rental_contract, tenant, finance, expense, income)
      - `association_id` (uuid)
      - `created_by` (uuid, references auth.users)

    - `document_history`
      - Tracks all changes to documents

  2. Security
    - Enable RLS on all tables
    - Users can only access their own documents
    - Users can only create/delete associations for their own documents

  3. Indexes
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
  document_type text NOT NULL CHECK (document_type IN (
    'contract', 'invoice', 'bill', 'receipt', 'report', 'other',
    'floor_plan', 'energy_certificate', 'insurance', 'property_deed',
    'rental_agreement', 'utility_bill', 'maintenance', 'photo',
    'blueprint', 'expose',
    'amendment', 'addendum', 'termination', 'protocol',
    'correspondence', 'main_contract'
  )),
  category text,
  description text,
  upload_date timestamptz DEFAULT now() NOT NULL,
  is_archived boolean DEFAULT false NOT NULL,
  shared_with_tenant boolean DEFAULT false NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create document associations table
CREATE TABLE IF NOT EXISTS document_associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  association_type text NOT NULL CHECK (association_type IN (
    'property', 'unit', 'rental_contract', 'tenant', 'finance', 'expense', 'income'
  )),
  association_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create document history table
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

CREATE POLICY "System can insert document history"
  ON document_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_history.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload documents to own folder' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can upload documents to own folder"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own document files' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can view own document files"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own document files' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can delete own document files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();
