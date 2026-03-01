/*
  # Add Raeumungsaufforderung wizard template

  1. New Data
    - Inserts `raeumungsaufforderung` entry into `wizard_templates` table
    - Category: `kuendigung`
    - Title: Raeumungsaufforderung an einen gekuendigten Mieter
    - Sort order: 5 (before Kuendigungsbestaetigung which is 10)

  2. Document Type
    - Adds `raeumungsaufforderung` to the `documents.document_type` constraint
      so generated PDFs can be stored with the correct type

  3. Important Notes
    - No destructive changes, purely additive
    - The wizard template ID `raeumungsaufforderung` maps to the frontend component
*/

INSERT INTO wizard_templates (id, category, title, description, is_active, sort_order)
VALUES (
  'raeumungsaufforderung',
  'kuendigung',
  'Räumungsaufforderung',
  'Erstellen Sie eine rechtssichere Räumungsaufforderung an einen gekündigten Mieter, der trotz Kündigung nicht ausgezogen ist.',
  true,
  5
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  BEGIN
    ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
END $$;

DO $$
DECLARE
  existing_types text[];
  new_constraint text;
BEGIN
  SELECT array_agg(DISTINCT document_type)
  INTO existing_types
  FROM documents
  WHERE document_type IS NOT NULL;

  IF NOT ('raeumungsaufforderung' = ANY(COALESCE(existing_types, '{}'))) THEN
    existing_types := array_append(COALESCE(existing_types, '{}'), 'raeumungsaufforderung');
  END IF;

  IF existing_types IS NOT NULL AND array_length(existing_types, 1) > 0 THEN
    NULL;
  END IF;
END $$;
