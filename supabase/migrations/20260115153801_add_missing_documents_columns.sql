/*
  # Fehlende Spalten in documents Tabelle hinzufügen

  1. Änderungen
    - Füge `mime_type` Spalte hinzu
    - Füge `property_id` Spalte hinzu (für Zuordnung)
    - Füge `unit_id` Spalte hinzu (für Zuordnung)
    - Füge `uploaded_by` Spalte hinzu
    - Füge `document_date` Spalte hinzu
    - Füge `shared_with_tenant` Spalte hinzu

  2. Hinweise
    - Alle Spalten sind optional (nullable)
    - Bestehende Daten bleiben unverändert
*/

-- Füge fehlende Spalten hinzu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'mime_type'
  ) THEN
    ALTER TABLE documents ADD COLUMN mime_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'property_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN property_id uuid REFERENCES properties(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'unit_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN unit_id uuid REFERENCES property_units(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE documents ADD COLUMN uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'document_date'
  ) THEN
    ALTER TABLE documents ADD COLUMN document_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'shared_with_tenant'
  ) THEN
    ALTER TABLE documents ADD COLUMN shared_with_tenant boolean DEFAULT false;
  END IF;
END $$;
