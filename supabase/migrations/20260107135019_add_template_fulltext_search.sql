/*
  # Vorlage Volltextsuche

  1. Änderungen
    - Fügt `content` Spalte zur `templates` Tabelle hinzu für Volltextsuche
    - Der Inhalt kann beim Upload vom Admin eingegeben werden (Schlüsselwörter, Zusammenfassung)
    - Erstellt einen GIN-Index für schnelle Volltextsuche

  2. Sicherheit
    - Keine Änderungen an RLS-Richtlinien erforderlich
*/

-- Add content column for fulltext search
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'templates' AND column_name = 'content'
  ) THEN
    ALTER TABLE templates ADD COLUMN content text;
  END IF;
END $$;

-- Create GIN index for fulltext search on content
CREATE INDEX IF NOT EXISTS idx_templates_content_search ON templates USING gin(to_tsvector('german', coalesce(content, '')));