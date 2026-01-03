/*
  # Add document date field

  1. Changes
    - Add `document_date` column to `documents` table
      - Allows Pro users to specify the actual date of the document (e.g., invoice date, contract date)
      - Different from `upload_date` which tracks when the document was uploaded
      - Nullable to maintain backward compatibility
    
  2. Notes
    - This field is optional and primarily used by Pro users
    - Enables better organization and filtering by actual document dates
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'document_date'
  ) THEN
    ALTER TABLE documents ADD COLUMN document_date date;
  END IF;
END $$;
