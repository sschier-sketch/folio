/*
  # Fix operating_cost_pdfs table - Add missing columns

  1. Changes
    - Add `user_id` column with foreign key to auth.users
    - Add `result_id` column with foreign key to operating_cost_results
    - Add `created_at` column for consistency
    - Add necessary indexes
    - Update RLS policies to use user_id

  2. Security
    - Update RLS policies to check user_id
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'operating_cost_pdfs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE operating_cost_pdfs 
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    
    UPDATE operating_cost_pdfs 
    SET user_id = (
      SELECT user_id FROM operating_cost_statements 
      WHERE operating_cost_statements.id = operating_cost_pdfs.statement_id
    );
    
    ALTER TABLE operating_cost_pdfs 
    ALTER COLUMN user_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'operating_cost_pdfs' AND column_name = 'result_id'
  ) THEN
    ALTER TABLE operating_cost_pdfs 
    ADD COLUMN result_id uuid REFERENCES operating_cost_results(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'operating_cost_pdfs' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE operating_cost_pdfs 
    ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view own PDFs" ON operating_cost_pdfs;
DROP POLICY IF EXISTS "Users can insert own PDFs" ON operating_cost_pdfs;
DROP POLICY IF EXISTS "Users can delete own PDFs" ON operating_cost_pdfs;

CREATE POLICY "Users can view own PDFs"
  ON operating_cost_pdfs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own PDFs"
  ON operating_cost_pdfs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own PDFs"
  ON operating_cost_pdfs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_operating_cost_pdfs_result_id ON operating_cost_pdfs(result_id);
CREATE INDEX IF NOT EXISTS idx_operating_cost_pdfs_user_id ON operating_cost_pdfs(user_id);